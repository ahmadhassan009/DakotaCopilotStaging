global class ScheduleToUpdatEverestCheckboxInvestFirm implements Schedulable, Database.Batchable<SObject> {

    Map<Id, Boolean> accountHasFundInfo = new Map<Id, Boolean>();
    global void execute(SchedulableContext sc) {
        ScheduleToUpdatEverestCheckboxInvestFirm batchJob = new ScheduleToUpdatEverestCheckboxInvestFirm();
        Database.executeBatch(batchJob);
    }

    global Database.QueryLocator start(Database.BatchableContext BC) {
        accountHasFundInfo = new  Map<Id, Boolean>(); 
        Id recordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
        String query = 'Select Id,Name,X100_Everest__c from account where RecordTypeId=:recordTypeId';
        return Database.getQueryLocator(query);
    }

    global void execute(Database.BatchableContext BC, List<Account> accountsList) {

        List<Account> accountsToUpdate = new List<Account>();
        Set<Id> accIds = new Set<Id>();
        for (Account acc : accountsList) {
            acc.X100_Everest__c = false;
            accountsToUpdate.add(acc);
            accIds.add(acc.Id);
        }   

        List<String> objectNamesList = new List<String>(System.Label.FundRelatedObjectNames.split(','));
        for (String objectName : objectNamesList) {
            if (accIds.size() > 0) {
                accIds = checkForFundInformation(accIds, objectName);
            }
        }

        for (Account acc : accountsToUpdate) {
           if (accountHasFundInfo.containsKey(acc.Id)) {
                acc.X100_Everest__c = true;
           }
        }
        try {
            update accountsToUpdate;
        } catch(Exception ex) {
            System.debug(ex.getMessage());
        }
    }

    global void finish(Database.BatchableContext BC) {
    }

    private Set<Id> checkForFundInformation(Set<Id> accIds,String objectApiName) {  
        Set<Id> matchingAccIds = new Set<Id>();
        String query = 'SELECT Id, Name, Account__c FROM ' + objectApiName + ' WHERE Account__c != null AND Account__c IN: accIds';
        List<SObject> returnedRecords = Database.query(query);

        if (returnedRecords.size() > 0) {
            for (SObject record : returnedRecords) {
                Id accountField = (Id)record.get('Account__c');
                matchingAccIds.add(accountField);
                accountHasFundInfo.put(accountField, true);
            }
            accIds.removeAll(matchingAccIds);
        }
        return accIds;
    }
}