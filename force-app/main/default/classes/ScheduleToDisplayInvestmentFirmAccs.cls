global  class ScheduleToDisplayInvestmentFirmAccs implements Schedulable {

    public static Id recordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
    public static Set<Id> accountsToUpdateIds= new Set<Id>();
    public static LastModifiedDateForInvestmentFirm__c lastDate = LastModifiedDateForInvestmentFirm__c.getInstance('LastModifiedDate');
    public static DateTime lastsyncdate = lastDate.Last_Modified_Date__c;
    public static List<String> objectNamesList = new List<String>(System.Label.FundRelatedObjectNames.split(','));
    public static List<DateTime> lastModifiedDateList = new List<DateTime>();

    global void execute(SchedulableContext ctx) {
        updateInvestmentFirmAccounts();        
    }

    public static void updateInvestmentFirmAccounts() {     
        for (String objectName : objectNamesList) {
            retrieveAccountIds(objectName);            
        }
        updateLastModifiedDate();
        accountsToDisplay();
        accountsNotToDisplay();          
    }

    public static void retrieveAccountIds(String objectName) {
        Boolean isDateupdate = false;
        String query = 'SELECT Id, Name, Account__c, lastmodifieddate FROM ' + objectName + ' WHERE lastmodifieddate >:lastsyncdate AND Account__c != null AND Account__r.X100_Everest__c = false order by lastmodifieddate Desc';
        List<SObject> returnedRecords = Database.query(query);

        if (returnedRecords.size() > 0) {
            for (SObject record : returnedRecords) {
                Id accountField = (Id)record.get('Account__c');
                accountsToUpdateIds.add(accountField);
                if (isDateupdate == false) {
                    isDateupdate = true;
                    lastModifiedDateList.add((DateTime)record.get('lastmodifieddate'));
                }
            }
        }
    }

    public static void accountsToDisplay() {
        List<Account> accountsToDisplay = new List<Account>();
        if (accountsToUpdateIds.size() > 0) {
            accountsToDisplay = [
                                    SELECT Id,Name,X100_Everest__c 
                                    FROM Account 
                                    WHERE RecordTypeId = :recordTypeId 
                                    AND Id IN :accountsToUpdateIds 
                                    AND X100_Everest__c = False
                                ];
            if (accountsToDisplay.size() > 0) {
                for (Account acc : accountsToDisplay) {
                    acc.X100_Everest__c = true;
                }  
                try {
                    update accountsToDisplay;
                } catch(Exception ex) {
                    System.debug(ex.getMessage());
                }
            } 
        }
    }

    public static void accountsNotToDisplay() {
        List<Set<Id>> accountIdsSet = new List<Set<Id>>();
        Integer count = 0;
        String accountsNotToDisplayQuery = '';  
        List<Account> accountsNotToDisplay = new List<Account>();
        List<Account> accountsResults = new List<Account>();
        String accQuery = 'SELECT Id,Name,X100_Everest__c FROM Account WHERE RecordTypeId=:recordTypeId AND X100_Everest__c=True';
        for (String objectName : objectNamesList) {
            accountsNotToDisplayQuery += ' AND Id NOT IN (SELECT Account__c FROM '+ objectName + ')';  
            count+=1;
            if (Math.mod(count, 2) == 0 || count == objectNamesList.size()) {
                accountsResults = Database.query(accQuery + accountsNotToDisplayQuery);
                accountsNotToDisplayQuery = '';
                Set<Id> accountsSet = new Set<Id>();
                if (accountsResults.size() > 0) {
                    for (Account acc : accountsResults) {
                        accountsSet.add(acc.Id);
                    }
                }
                accountIdsSet.add(accountsSet);
            }
        }

        Set<Id> allAccountIdsSet = new Set<Id>();
        if(accountsResults.size() > 0) {
            allAccountIdsSet.addAll(accountIdsSet[0]);
            for (Integer i = 1; i < accountIdsSet.size(); i++) {               
                allAccountIdsSet.retainAll(accountIdsSet[i]);
            }
        }

        accountsNotToDisplay = [
                                    SELECT Id, Name, X100_Everest__c 
                                    FROM Account 
                                    WHERE RecordTypeId = :recordTypeId 
                                    AND Id IN :allAccountIdsSet 
                                    AND X100_Everest__c = True
                                ];
        if (accountsNotToDisplay.size() > 0) {
            for (Account acc : accountsNotToDisplay) {
                acc.X100_Everest__c = false;
            }
            try {
                update accountsNotToDisplay;
            } catch(Exception ex) {
                System.debug(ex.getMessage());
            }  
        }
    }

    public static void updateLastModifiedDate() {
        DateTime maxDate = lastModifiedDateList.isEmpty() ? null : lastModifiedDateList[0];
        for (DateTime dat : lastModifiedDateList) {
            if (dat > maxDate) {
                maxDate = dat;
            }
        }
        if (maxDate != null) {
            lastDate.Last_Modified_Date__c = maxDate;
            try {
                update lastDate;
            } catch(Exception ex) {
                System.debug(ex.getMessage());
            }
        }
    }
}