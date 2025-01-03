global class BatchToCreateDC_ConsultantRoles implements Database.Batchable<sObject> {
    global Database.QueryLocator start(Database.BatchableContext bc) {
        String query = 'Select Id,Service_Provider_Account__c,Account__c FROM Fund_Service_Provider__c WHERE Service_Provider_Account__c != null';
        return Database.getQueryLocator(query);
    }
    global void execute(Database.BatchableContext bc, List<Fund_Service_Provider__c> fundServiceProviders){
        Set<Id> accountIds = new Set<Id>();
        Map<Id,Set<Id>> fundServToAccountIds = new Map<Id,Set<Id>>();
        for(Fund_Service_Provider__c fundServiceProv : fundServiceProviders)
        {
            accountIds.add(fundServiceProv.Service_Provider_Account__c);
            if(fundServToAccountIds.containsKey(fundServiceProv.Service_Provider_Account__c))
            {
                Set<Id> accountIdsTemp = fundServToAccountIds.get(fundServiceProv.Service_Provider_Account__c);
                accountIdsTemp.add(fundServiceProv.Account__c);
                fundServToAccountIds.put(fundServiceProv.Service_Provider_Account__c,accountIdsTemp);
            }
            else
            {
                Set<Id> accountIdsTemp2 = new Set<Id>();
                accountIdsTemp2.add(fundServiceProv.Account__c);
                fundServToAccountIds.put(fundServiceProv.Service_Provider_Account__c,accountIdsTemp2);  
            }
            
        }
        
        List<AccountContactRelation> accountCnctRelations = [Select Id,ContactId,AccountId
                                                             from AccountContactRelation
                                                             where IsDirect = true 
                                                             AND AccountId IN :accountIds
                                                             AND ((Contact.Contact_Type__c IN ('DC Consultant', 'Field Consultant'))
                                                                  OR (Contact.Channel_Focus__c IN ('Corporate Pension Plan', 'DC Plan'))
                                                                  OR (Contact.Search_Asset_Class__c = 'Generalist'))
                                                             AND Contact.Marketplace_Verified_Contact__c = true];
        Set<Id> contactIds = new Set<Id>();
        
        Map<String,AccountContactRelation> createRelationshipRecords = new Map<String,AccountContactRelation>();
        for(AccountContactRelation acctCnctRel : accountCnctRelations)
        {
            for(Id accountId : fundServToAccountIds.get(acctCnctRel.AccountId))
            {
                AccountContactRelation newAcctConRel = new AccountContactRelation();
                newAcctConRel.ContactId = acctCnctRel.ContactId;
                newAcctConRel.AccountId = accountId;
                newAcctConRel.Roles = 'DC Consultant';
                String uniqueRelation = String.valueOf(newAcctConRel.ContactId)+String.valueOf(newAcctConRel.AccountId);
                createRelationshipRecords.put(uniqueRelation,newAcctConRel);
            }
        }
        Database.insert(createRelationshipRecords.values(),false);
    }
    global void finish(Database.BatchableContext bc){}
}