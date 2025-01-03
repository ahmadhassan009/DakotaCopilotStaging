public class TriggerOnAccountService {
    
    public static void refreshAccountPannels(List<Account> newAccounts)
    {
        List<refreshComponents__e> refreshRecordEvents = new List<refreshComponents__e>();
        for (Account account : newAccounts) {
            refreshRecordEvents.add(new refreshComponents__e(
                recordUsed__c = account.MetroArea__r.Id,
                UserUsed__c = UserInfo.getUserId(),
                userSession__c=UserInfo.getSessionId()
            ));
        } 
        EventBus.publish(refreshRecordEvents);
    }
    
    public static void createNewAccountActivityStream(List<Account> newAccounts)
    {
        List<Update__c> activityStreamRecords = new List<Update__c>();
        Id investmentFirmRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
        for(Account account : newAccounts)
        {
            Update__c rh = new Update__c(
                Last_Updated_Date__c = System.now(),
                Account__c = account.Id,
                RecordChangedBy__c = UserInfo.getUserId(),
                Account_Type__c=account.Type,
                AUM__c=account.Aum__c,
                Metro_Area__c=account.MetroArea__c,
                Is_Accessible__c = account.X100_Marketplace__c,
                Is_Accessible_Everest__c = account.RecordTypeId == investmentFirmRecTypeId ? true : false,
                Type__c = 'Marketplace Data Updates'
            );
            activityStreamRecords.add(rh);
        }
        if(activityStreamRecords.size() > 0)
        {
            insert activityStreamRecords;
        }
    }
    
    public static void syncParentIdOfAccount(List<Account> newAccounts, Map<Id, Account> oldAccounts)
    {
        for(Account acc : newAccounts)
        {
            if( (Trigger.isInsert && acc.ParentId!=null) || (Trigger.isUpdate && acc.ParentId!=oldAccounts.get(acc.Id).ParentId) )
            {
                acc.Parent_Account__c = acc.ParentId;
            }
        }
    }

    public static void createUpdateRecord(List<Account> newAccounts, Map<Id, Account> oldAccounts) {
        try {
            List<Update__c> updatesRecords = new List<Update__c>();
            for (Account acc : newAccounts) {
                if ((Trigger.isUpdate && acc.Custodian_s__c != oldAccounts.get(acc.Id).Custodian_s__c)) {
                    Update__c u = new Update__c(
                        Last_Updated_Date__c = System.now(),
                        Account__c = acc.Id,
                        RecordChangedBy__c = UserInfo.getUserId(),
                        Field_Name__c = 'Custodian_s__c',
                        Old_Value__c = oldAccounts.get(acc.Id)?.Custodian_s__c,
                        New_Value__c = acc.Custodian_s__c 
                    );
                    updatesRecords.add(u);
                }
            }
            if (updatesRecords.size() > 0) {
                insert updatesRecords;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static void populateNumberOfAccountsOnMetroArea(List<Account> newAccounts, Map<Id, Account> oldAccounts)
    {
        Set<Id> parentMetroAreaIds = new Set<Id>();
        Map<Id, Integer> accountCountMapForMP = new Map<Id, Integer>();
        Map<Id, Integer> accountCountMapForEverest = new Map<Id, Integer>();
        Map<Id, Integer> maAccMap = new Map<Id, Integer>();
        List<Id> accList = new List<Id>();
        if(Trigger.isInsert || Trigger.isUpdate) //Insert or Update case
        {
            for(Account acc : newAccounts)
            {
                if(Trigger.isInsert && acc.MetroArea__c!=null) //Insert case
                {
                    parentMetroAreaIds.add(acc.MetroArea__c);
                }
                else if(Trigger.isUpdate) //Update case
                {
                    if(acc.MetroArea__c!=oldAccounts.get(acc.Id).MetroArea__c || acc.RecordTypeId!=oldAccounts.get(acc.Id).RecordTypeId ||
                       acc.X100_Marketplace__c!=oldAccounts.get(acc.Id).X100_Marketplace__c)
                    {
                        if(acc.MetroArea__c!=null)
                        {
                            parentMetroAreaIds.add(acc.MetroArea__c);
                            accountCountMapForMP.put(acc.MetroArea__c, 0);
                            if(acc.X100_Marketplace__c==oldAccounts.get(acc.Id).X100_Marketplace__c)
                            {
                                accountCountMapForEverest.put(acc.MetroArea__c, 0);
                            }
                        }
                        if(oldAccounts.get(acc.Id).MetroArea__c != null)
                        {
                            parentMetroAreaIds.add(oldAccounts.get(acc.Id).MetroArea__c);
                            accountCountMapForMP.put(oldAccounts.get(acc.Id).MetroArea__c,0);
                            if(acc.X100_Marketplace__c==oldAccounts.get(acc.Id).X100_Marketplace__c)
                            {
                                accountCountMapForEverest.put(oldAccounts.get(acc.Id).MetroArea__c,0);
                            }
                        }
                    }
                }
            }
        }
        
        if(Trigger.isDelete) //Delete case
        {
            for(Account acc : oldAccounts.values())
            {
                if(acc.MetroArea__c!=null) //Insert case
                {
                    parentMetroAreaIds.add(acc.MetroArea__c);
                    accountCountMapForMP.put(acc.MetroArea__c, 0);
                    accountCountMapForEverest.put(acc.MetroArea__c, 0);
                }
            }            
        }
        
        
        //Prepare Count for verified Number of Accounts linked through sub metro areas
        for(AggregateResult aggRes: [SELECT COUNT(Account__c) numofInvestmentAccounts, Metro_Area__c FROM Sub_Metro_Area__c
                                        WHERE Account__r.RecordType.DeveloperName = 'Dakota_Investments_Account' 
                                        AND Account__r.X100_Marketplace__c = true
                                        AND Metro_Area__c IN :parentMetroAreaIds GROUP BY Metro_Area__c])
        {
            Id metroAreaId = (Id) aggRes.get('Metro_Area__c');
            Integer numofAccounts = (Integer) aggRes.get('numofInvestmentAccounts');
            maAccMap.put(metroAreaId, numofAccounts);
        }

         //If the same account is linked directly as well as indirectly(through sub metro area) to a metro area, then it should be counted as one.
         for(Sub_Metro_Area__c subMa: [SELECT Account__c FROM Sub_Metro_Area__c
                                        WHERE Account__r.RecordType.DeveloperName = 'Dakota_Investments_Account' 
                                        AND Account__r.X100_Marketplace__c = true
                                        AND Metro_Area__c IN :parentMetroAreaIds ])
        {
            accList.add(subMa.Account__c);
        }

        //Prepare Count Map For Sort Order (Marketplace)
        for (AggregateResult aggRes : [Select Count(Id) numofInvestmentAccounts, MetroArea__c from Account where RecordType.DeveloperName = 'Dakota_Investments_Account' 
                                       and X100_Marketplace__c = true and MetroArea__c in :parentMetroAreaIds AND Id NOT IN: accList Group by MetroArea__c]) 
        {
            Id parentMetroAreaId = (Id) aggRes.get('MetroArea__c');
            Integer numofAccounts = (Integer) aggRes.get('numofInvestmentAccounts');
            accountCountMapForMP.put(parentMetroAreaId, numofAccounts);
        }

        if(accountCountMapForMP.size()>0 || maAccMap.size()>0)
        {
            List<Metro_Area__c> metroareasToUpdate = new List<Metro_Area__c>();
            for(Metro_Area__c metroarea : [SELECT Id, Sort_Order__c FROM Metro_Area__c WHERE Id IN :accountCountMapForMP.keySet()])
            {
                if(accountCountMapForMP.containsKey(metroarea.Id) && maAccMap.containsKey(metroarea.Id))
                {
                    metroarea.Sort_Order__c = accountCountMapForMP.get(metroarea.Id) + maAccMap.get(metroarea.Id);
                } else if(accountCountMapForMP.containsKey(metroarea.Id) && !maAccMap.containsKey(metroarea.Id)) {
                    metroarea.Sort_Order__c = accountCountMapForMP.get(metroarea.Id);
                } else if(! accountCountMapForMP.containsKey(metroarea.Id) && maAccMap.containsKey(metroarea.Id)) {
                    metroarea.Sort_Order__c = maAccMap.get(metroarea.Id);
                } else {
                    metroarea.Sort_Order__c = 0;
                }
                metroareasToUpdate.add(metroarea);
            }
            update metroareasToUpdate;
        }
        
        //Prepare Count Map For Sort Order (Everest)
        Id investmentFirmRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
        for (AggregateResult aggRes : [Select Count(Id) numofMarketplaceAccounts, MetroArea__c from Account where RecordTypeId = :investmentFirmRecTypeId and
                                       MetroArea__c in :parentMetroAreaIds Group by MetroArea__c]) 
        {
            Id parentMetroAreaId = (Id) aggRes.get('MetroArea__c');
            Integer numofAccounts = (Integer) aggRes.get('numofMarketplaceAccounts');
            accountCountMapForEverest.put(parentMetroAreaId, numofAccounts);
        }
        if(accountCountMapForEverest.size()>0)
        {
            List<Metro_Area__c> metroareasToUpdate = new List<Metro_Area__c>();
            for(Metro_Area__c metroarea : [Select Id, Sort_Order_Everest__c from Metro_Area__c where Id in :accountCountMapForEverest.keySet()])
            {
                if(accountCountMapForEverest.containsKey(metroarea.Id))
                {
                    metroarea.Sort_Order_Everest__c = accountCountMapForEverest.get(metroarea.Id);
                    metroareasToUpdate.add(metroarea);
                }
            }
            update metroareasToUpdate;
        }
    }
    
    public static void updateRelatedContactAndAccounts(List<Account> newAccounts, Map<Id, Account> oldAccounts)
    {
        Set<Id> accountIdsforContacts = new Set<Id>();
        Set<Id> accountIdsforAccounts = new Set<Id>();
        for(Account acc: newAccounts)
        {
            if((acc.Name != oldAccounts.get(acc.Id).Name) || (acc.Type != oldAccounts.get(acc.Id).Type) || (acc.MetroArea__c != oldAccounts.get(acc.Id).MetroArea__c))
            {
                accountIdsforContacts.add(acc.id);
            }
            if(acc.Name != oldAccounts.get(acc.Id).Name)
            {
                accountIdsforAccounts.add(acc.id);
            }
        }
        
        List<Contact> contacts = new List<Contact>();
        List<String> contactsTobeUpdated = new List<String>();      
        if(accountIdsforContacts!=null && accountIdsforContacts.size()>0)
        {
            contacts = [SELECT Id,Updated__c,AccountId FROM Contact WHERE AccountId IN: accountIdsforContacts];
        }
        
        List<Account> accs = new List<Account>();
        List<String> accsTobeUpdated = new List<String>();
        if(accountIdsforAccounts!=null && accountIdsforAccounts.size()>0)
        {
            accs = [SELECT Id, Updated__c, UHNW_Division__c,Hedge_Fund_Consultant__c, TAMP__c,
                    General_Consultant__c, Real_Estate_Consultant__c, General_Consultant_2__c,
                    Private_Equity_Consultant__c
                    FROM Account 
                    WHERE UHNW_Division__c IN: accountIdsforAccounts
                    OR Hedge_Fund_Consultant__c IN: accountIdsforAccounts
                    OR TAMP__c IN: accountIdsforAccounts
                    OR General_Consultant__c IN: accountIdsforAccounts
                    OR Real_Estate_Consultant__c IN: accountIdsforAccounts
                    OR General_Consultant_2__c IN: accountIdsforAccounts
                    OR Private_Equity_Consultant__c IN: accountIdsforAccounts];
        }
        for(Contact conn: contacts)
        {
            contactsTobeUpdated.add('\''+conn.Id+'\'');
        }
        for(Account account: accs)
        {
            accsTobeUpdated.add('\''+account.Id+'\'');
        }

        if(contactsTobeUpdated !=null && contactsTobeUpdated.size()>0)
        {
            Database.executeBatch(new BatchToUpdateContacts(String.join(contactsTobeUpdated, ',' )),50);
        }
        if(accsTobeUpdated!=null && accsTobeUpdated.size()>0)
        {
            Database.executeBatch(new BatchToUpdateAccounts(String.join(accsTobeUpdated, ',' )),50);
        }
    }

    public static void updateProductStructure(List<Account> newAccounts, Map<Id, Account> oldAccounts)
    {
        Map<Id,Account> updatedAccounts = new Map<Id,Account>();
        Map<Id, Boolean> intervalFundExist = new  Map<Id, Boolean>();
        Map<Id, Boolean> ETFExist = new  Map<Id, Boolean>();
        List<Account> accountsToBeProcessed = new List<Account>();
        for(Account acc: newAccounts)
        {
            if((Trigger.IsInsert && (acc.Mutual_Fund__c || acc.Limited_Partnership__c || acc.Separate_Account__c || acc.CIT__c || acc.ETF__c || acc.Interval_Fund__c)) ||
               (Trigger.IsUpdate && (oldAccounts.get(acc.Id).Mutual_Fund__c != acc.Mutual_Fund__c || 
                                     oldAccounts.get(acc.Id).Limited_Partnership__c != acc.Limited_Partnership__c ||
                                     oldAccounts.get(acc.Id).Separate_Account__c != acc.Separate_Account__c ||
                                     oldAccounts.get(acc.Id).CIT__c != acc.CIT__c ||
                                     oldAccounts.get(acc.Id).ETF__c != acc.ETF__c ||
                                     oldAccounts.get(acc.Id).Interval_Fund__c != acc.Interval_Fund__c)))
            {
                accountsToBeProcessed.add(acc);
                acc.Product_Structure__c = (acc.Product_Structure__c == null ? acc.Product_Structure__c = '' : acc.Product_Structure__c);
                if(acc.Id != null) 
                {
                    updatedAccounts.put(acc.Id,acc);
                    ETFExist.put(acc.Id, false);
                    intervalFundExist.put(acc.Id, false);
                }
            }
        }
        
        if(Trigger.IsUpdate && updatedAccounts.keySet().size() > 0)
        {
            List<String> productStructures = new List<String>{'ETF','Interval/Gated'};
            for(Investment_Strategy__c invr: [SELECT Id, Account__c, Product_Structure__c FROM Investment_Strategy__c 
                                                WHERE Account__c IN :updatedAccounts.keySet() AND Product_Structure__c In :productStructures])
            {
                if(invr.Product_Structure__c == 'ETF' && updatedAccounts.containsKey(invr.Account__c) && updatedAccounts.get(invr.Account__c).Product_Structure__c.contains('ETF'))
                    ETFExist.put(invr.Account__c, true);
                else if(invr.Product_Structure__c == 'Interval/Gated' && updatedAccounts.containsKey(invr.Account__c) && updatedAccounts.get(invr.Account__c).Product_Structure__c.contains('Interval Fund'))
                    intervalFundExist.put(invr.Account__c, true);
            }
        }
        
        for(Account acc: accountsToBeProcessed)
        {
            if((oldAccounts!=null && !oldAccounts.get(acc.id).Mutual_Fund__c && acc.Mutual_Fund__c) || (oldAccounts==null && acc.Mutual_Fund__c))
            {
                acc.Product_Structure__c = acc.Product_Structure__c +';Mutual Fund';
            }
            else if(oldAccounts!=null && oldAccounts.get(acc.id).Mutual_Fund__c && !acc.Mutual_Fund__c)
            {	
                if(acc.Product_Structure__c.contains(';Mutual Fund'))
                {
                    acc.Product_Structure__c = acc.Product_Structure__c.replace(';Mutual Fund','');
                }
                else
                {
                    acc.Product_Structure__c = acc.Product_Structure__c.replace('Mutual Fund','');
                }
            }
            
            if(ETFExist == null || (ETFExist!=null && ETFExist.size()<=0) || (ETFExist!=null && ETFExist.size()>0 && !ETFExist.get(acc.Id)))
            {
                if(!acc.Product_Structure__c.contains('ETF') && (oldAccounts!=null && !oldAccounts.get(acc.id).ETF__c && acc.ETF__c) || (oldAccounts==null && acc.ETF__c))
                {
                    acc.Product_Structure__c = acc.Product_Structure__c +';ETF';
                }
                else if(oldAccounts!=null && oldAccounts.get(acc.id).ETF__c && !acc.ETF__c)
                {	
                    if(acc.Product_Structure__c.contains(';ETF'))
                    {
                        acc.Product_Structure__c = acc.Product_Structure__c.replace(';ETF','');
                    }
                    else
                    {
                        acc.Product_Structure__c = acc.Product_Structure__c.replace('ETF','');
                    }
                }
            }
            
            if((oldAccounts!=null && !oldAccounts.get(acc.id).Limited_Partnership__c && acc.Limited_Partnership__c) || (oldAccounts==null && acc.Limited_Partnership__c))
            {
                acc.Product_Structure__c = acc.Product_Structure__c +';Limited Partnership';
            }
            else if(oldAccounts!=null && oldAccounts.get(acc.id).Limited_Partnership__c && !acc.Limited_Partnership__c)
            {	
               if(acc.Product_Structure__c.contains(';Limited Partnership'))
                {
                    acc.Product_Structure__c = acc.Product_Structure__c.replace(';Limited Partnership','');
                }
                else
                {
                    acc.Product_Structure__c = acc.Product_Structure__c.replace('Limited Partnership','');
                }
            }
            
            if((oldAccounts!=null && !oldAccounts.get(acc.id).Separate_Account__c && acc.Separate_Account__c) || (oldAccounts==null && acc.Separate_Account__c))
            {
                acc.Product_Structure__c = acc.Product_Structure__c +';Separate Account';
            }
            else if(oldAccounts!=null && oldAccounts.get(acc.id).Separate_Account__c && !acc.Separate_Account__c)
            {	
                if(acc.Product_Structure__c.contains(';Separate Account'))
                {
                    acc.Product_Structure__c = acc.Product_Structure__c.replace(';Separate Account','');
                }
                else
                {
                    acc.Product_Structure__c = acc.Product_Structure__c.replace('Separate Account','');
                }
            }
            
            if((oldAccounts!=null && !oldAccounts.get(acc.id).CIT__c && acc.CIT__c) || (oldAccounts==null && acc.CIT__c))
            {
                acc.Product_Structure__c = acc.Product_Structure__c +';CIT';
            }
            else if(oldAccounts!=null && oldAccounts.get(acc.id).CIT__c && !acc.CIT__c)
            {	
               if(acc.Product_Structure__c.contains(';CIT'))
                {
                    acc.Product_Structure__c = acc.Product_Structure__c.replace(';CIT','');
                }
                else
                {
                    acc.Product_Structure__c = acc.Product_Structure__c.replace('CIT','');
                }
            }
            
            //DPS-337 : Incorporating Interval fund logic
            if(intervalFundExist == null || (intervalFundExist!=null && intervalFundExist.size()<=0) || (intervalFundExist!=null && intervalFundExist.size()>0 && !intervalFundExist.get(acc.Id)))
            {
                if(!acc.Product_Structure__c.contains('Interval Fund') && (oldAccounts!=null && !oldAccounts.get(acc.id).Interval_Fund__c && acc.Interval_Fund__c) || (oldAccounts==null && acc.Interval_Fund__c))
                {
                    acc.Product_Structure__c = acc.Product_Structure__c +';Interval Fund';
                }
                else if(oldAccounts!=null && oldAccounts.get(acc.id).Interval_Fund__c && !acc.Interval_Fund__c)
                {	
                    if(acc.Product_Structure__c.contains(';Interval Fund'))
                    {
                        acc.Product_Structure__c = acc.Product_Structure__c.replace(';Interval Fund','');
                    }
                    else
                    {
                        acc.Product_Structure__c = acc.Product_Structure__c.replace('Interval Fund','');
                    }
                }
            }
        }
    }

    public static void updateCountryField(List<Account> newAccounts, Map<Id, Account> oldAccounts)
    {
        if(Trigger.isInsert || Trigger.isUpdate)
        {
            for(Account acc : newAccounts)
            {
                if(Trigger.isInsert || Trigger.isUpdate && acc.BillingCountry != oldAccounts.get(acc.Id).BillingCountry)
                {
                    if(acc.BillingCountry != null && (acc.BillingCountry.toLowercase() == 'united states' || acc.BillingCountry.toLowercase() == 'us' ||
                    acc.BillingCountry.toLowercase() == 'u.s.' || acc.BillingCountry.toLowercase() == 'u.s' || acc.BillingCountry.toLowercase() == 'u.s.a.' || 
                    acc.BillingCountry.toLowercase() == 'u.s.a' || acc.BillingCountry.toLowercase() == 'united states of america'))
                    {                   
                        acc.BillingCountry = 'USA';
                    }
                }
            }                             
        }            
    }
  
    public static void populateform5500CheckboxOfChildFundServiceAndFundInvestment(List<Account> newAccounts, Map<Id, Account> oldAccounts)
    { 
        Map<ID, String> accMap = new Map<ID, String>();
        for(Account acc : newAccounts)
        {
            if( Trigger.isUpdate && acc.ACK_ID__c!=oldAccounts.get(acc.Id).ACK_ID__c)
            {
                accMap.put(acc.Id,acc.ACK_ID__c);
            }
        }

        if(accMap.keySet().size()>0)
        {

            List<Fund_Service_Provider__c> fundServiceProviderDC= new List<Fund_Service_Provider__c>();
            fundServiceProviderDC=[select id,name,Form_5500_Account__c,Account__c from Fund_Service_Provider__c where Account__c in :accMap.keySet()];

            if(fundServiceProviderDC.size()>0)
            {
                for(Fund_Service_Provider__c fundService : fundServiceProviderDC)
                {
                    if(accMap.get(fundService.Account__c) !=null && !String.isBlank(accMap.get(fundService.Account__c)))
                    {
                        fundService.Form_5500_Account__c=true; 
                    }
                    else
                    {
                        fundService.Form_5500_Account__c=false;                        
                    }                
                }
                update fundServiceProviderDC;
            }

            List<Investment_Funds__c> investmentFundsDC= new List<Investment_Funds__c>();
            investmentFundsDC=[select id,name,Form_5500_Account__c,Account__c from Investment_Funds__c where Account__c in :accMap.keySet()];
            if(investmentFundsDC.size()>0)
            {
                for(Investment_Funds__c investmentFund : investmentFundsDC)
                {
                    if(accMap.get(investmentFund.Account__c) !=null && !String.isBlank(accMap.get(investmentFund.Account__c)))
                    {
                        investmentFund.Form_5500_Account__c=true;    
                    }
                    else
                    {
                        investmentFund.Form_5500_Account__c=false;                         
                    }             
                }
                update investmentFundsDC;
            }
            
            List<Account_Contact_Relation__c> accountContactRelations = [Select Id,Form_5500_Account__c,Account__c from Account_Contact_Relation__c where Account__c in :accMap.keySet()];
            if(accountContactRelations.size()>0)
            {
                for(Account_Contact_Relation__c acctCnctRelation : accountContactRelations)
                {
                    if(accMap.get(acctCnctRelation.Account__c) !=null && !String.isBlank(accMap.get(acctCnctRelation.Account__c)))
                    {
                        acctCnctRelation.Form_5500_Account__c=true;    
                    }
                    else
                    {
                        acctCnctRelation.Form_5500_Account__c=false;                         
                    }             
                }
                update accountContactRelations;
            }
        }
    }

    public static void updateInsertDataIntegerationsCheckbox(List<Account> newAccounts, Map<Id, Account> oldAccounts)
    {
        List<Account> listToUpdate= new List<Account>();
        for (Account acc : newAccounts) 
        {
            if((Trigger.isUpdate && ((acc.Data_Integerations__c != oldAccounts.get(acc.Id).Data_Integerations__c ) || (acc.Is_Trial_User__c != oldAccounts.get(acc.Id).Is_Trial_User__c))) || Trigger.isInsert)
            {
                listToUpdate.add(acc);
            }
        }
        if(listToUpdate.size() > 0) 
        {
            System.enqueueJob(new DataIntegerationsBitCallout(listToUpdate));
        }
    }

    public static void updateRelatedContacts(List<Account> newAccounts, Map<Id, Account> oldAccounts) {
        List<String> accountIdsforContacts = new List<String>();
        for(Account acc: newAccounts) {
            if(oldAccounts.get(acc.Id) !=null && acc.Not_a_fit_for_MarketplaceII__c != oldAccounts.get(acc.Id).Not_a_fit_for_MarketplaceII__c) {
                accountIdsforContacts.add('\''+acc.Id+'\'');
            }
        }

        if(accountIdsforContacts.size()> 0) {
            Database.executeBatch(new BatchToUpdateContactsOfRelatedAccounts(String.join(accountIdsforContacts, ',' )),50);
        }
    }
}