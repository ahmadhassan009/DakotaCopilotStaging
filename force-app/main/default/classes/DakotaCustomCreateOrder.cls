@RestResource(urlMapping='/DakotaCustomCreateOrder')
global with sharing class DakotaCustomCreateOrder {
    public static Account makeAccount(String accName){
        Account acc = new Account();
         acc.Name = accName;
         insert acc;
         return acc;
     }
     
     public static Contact makeContact(
     Account acc,
     String contEmail,
     String contFirstName,
     String contLastName,
     String contMailingCity,
     String contMailingState,
     String contMailingCountry,
     String contMailingPostalCode,
     String contMailingStreet
     ){
     
        Contact cont = new Contact();
        cont.FirstName = contFirstName;
        cont.LastName = contLastName;
        cont.Email = contEmail;
        cont.AccountId = acc.Id;
        cont.MailingCity = contMailingCity;
        cont.MailingState = contMailingState;
        cont.MailingCountry = contMailingCountry;
        cont.MailingPostalCode = contMailingPostalCode;
        cont.MailingStreet = contMailingStreet;
        insert cont;
        return cont;
     }
     
     Public Static Opportunity makeOpportunity(Account acc, String opName){
        
        Opportunity opp = new Opportunity();
        opp.Name  = opName;
        opp.StageName = 'Red Zone';
        opp.Type = 'Annual License Fee';
        Date newdate = Date.today();
        opp.CloseDate = newdate.addMonths(1);
        opp.AccountId = acc.Id;
        insert opp;
        return opp;
     }
      
     Public static zqu__Quote__c makeQuote(Account acc, Contact cont, Opportunity opp){
     
        zqu__Quote__c qte = new zqu__Quote__c();
        
        qte.Name = 'Quote for ' + opp.Name;
        qte.zqu__Opportunity__c = opp.Id;
        qte.zqu__ValidUntil__c = opp.CloseDate;
        qte.zqu__SoldToContact__c = cont.Id;
        qte.zqu__BillToContact__c = cont.Id;
        qte.zqu__PaymentMethod__c = '';
        qte.zqu__PaymentTerm__c = 'Due Upon Receipt';
        qte.zqu__Currency__c = 'USD';
        qte.zqu__StartDate__c = date.today();
        qte.zqu__InitialTerm__c = 12;
        qte.zqu__RenewalTerm__c = 12;
        qte.zqu__Account__c = acc.Id;
        qte.zqu__RenewalSetting__c = 'RENEW_TO_EVERGREEN';
        qte.zqu__Subscription_Term_Type__c = 'Evergreen';
        qte.zqu__SubscriptionType__c = 'New Subscription';
        qte.zqu__Status__c = 'New';

        insert qte;
        return qte; 
    }
    
    Public static void addProducts(
        zqu__Quote__c qte,
        String product1ZuoraId,
        String product2ZuoraId,
        String product2Quantity,
        String includedProductId,
        String includedProductQuantity
    ){
        List<zqu.zChargeGroup> chargeGroupsToAdd = new List<zqu.zChargeGroup>();
        
        List<zqu__ProductRatePlan__c> product1List = [SELECT Id
            FROM
            zqu__ProductRatePlan__c
            WHERE
            zqu__ZuoraId__c = :product1ZuoraId];
        if (product1List.size() != 0) {
            zqu__ProductRatePlan__c product1 = product1List[0];
            try {
                zqu.ZChargeGroup chargeGroup1 = zqu.zQuoteUtil.getChargeGroup(qte.Id, product1.Id);        
            	chargeGroupsToAdd.add(chargeGroup1);
            }
            catch (Exception e) {
                // Do nothing;
            }
            
        }
        
        if (includedProductId != 'false') {
            List<zqu__ProductRatePlan__c> includedProductList = [SELECT Id
            FROM
            zqu__ProductRatePlan__c
            WHERE
            zqu__ZuoraId__c = :includedProductId];
            if (includedProductList.size() != 0) {
                zqu__ProductRatePlan__c includedProduct = includedProductList[0];
                try {
                    zqu.ZChargeGroup includedChargeGroup = zqu.zQuoteUtil.getChargeGroup(qte.Id, includedProduct.Id);
                    for ( zqu.zCharge includedCharge : includedChargeGroup.zCharges ) {
                       includedCharge.QUANTITY = includedProductQuantity;
                    }
                    zqu.zQuoteUtil.calculateChargesOnQuantityChange(includedChargeGroup.zCharges);
                    chargeGroupsToAdd.add(includedChargeGroup);
                }
                catch (Exception e) {
                    // Do nothing;
                }
            }
        }
        
        if (product2ZuoraId != 'false') {
            List<zqu__ProductRatePlan__c> product2List = [SELECT Id
            FROM
            zqu__ProductRatePlan__c
            WHERE
            zqu__ZuoraId__c = :product2ZuoraId];
            if (product2List.size() != 0) {
                zqu__ProductRatePlan__c product2 = product2List[0];
                try {
                    zqu.ZChargeGroup chargeGroup2 = zqu.zQuoteUtil.getChargeGroup(qte.Id, product2.Id);
                    for ( zqu.zCharge charge2 : chargeGroup2.zCharges ) {
                        charge2.QUANTITY = product2Quantity;
                    }
                    zqu.zQuoteUtil.calculateChargesOnQuantityChange(chargeGroup2.zCharges);
                    chargeGroupsToAdd.add(chargeGroup2);
                }
                catch (Exception e) {
                    // Do nothing;
                }
            }
        }
        
        if (chargeGroupsToAdd.size() != 0) {
        	zqu.ZQuoteUtil.addChargeGroups(chargeGroupsToAdd);
        }
    }  

    @HttpPost
    global static void CreateOrder(
    String accName,
    String contEmail,
    String contFirstName,
    String contLastName,
    String contMailingCity,
    String contMailingState,
    String contMailingCountry,
    String contMailingPostalCode,
    String contMailingStreet,
    String opName,
    String product1ZuoraId,
    String product2ZuoraId,
    String product2Quantity,
    String includedProductId,
    String includedProductQuantity
    )  {
        Account acc = makeAccount(accName);
        
        Contact cont = makeContact(
        acc,
        contEmail,
        contFirstName,
        contLastName,
        contMailingCity,
        contMailingState,
        contMailingCountry,
        contMailingPostalCode,
        contMailingStreet
        );
        
        Opportunity opp = makeOpportunity(acc, opName);
        
        zqu__Quote__c qte = makeQuote(acc, cont, opp);
        
        addProducts(
            qte,
            product1ZuoraId,
            product2ZuoraId,
            product2Quantity,
            includedProductId,
            includedProductQuantity
        );

        String json = '{"quoteId": "' + qte.Id + '", "quoteName" : "' + qte.Name + '", "accId" : "' + acc.Id + '"}';

        RestContext.response.addHeader('Content-Type', 'application/json');
        RestContext.response.responseBody = Blob.valueOf(json);
    }

 }