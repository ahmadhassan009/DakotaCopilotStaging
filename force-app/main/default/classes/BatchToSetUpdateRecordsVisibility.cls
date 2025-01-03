global class BatchToSetUpdateRecordsVisibility implements Database.Batchable<sObject>
{
    global Database.QueryLocator start(Database.BatchableContext BC)
    {
        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
        String query ='SELECT Id, Object_Name__c, Object_Name_In_Community_List_View_URL__c FROM Follow__c WHERE RecordTypeId = :recordTypeId';
        if(Test.isRunningTest()) {
            query = 'SELECT Id, Object_Name__c, Object_Name_In_Community_List_View_URL__c FROM Follow__c';
        }
        return Database.getQueryLocator(query);
    }
    
    global void execute(Database.BatchableContext BC, List<Follow__c> favoriteRecordsToUpdate)
    {
        String tempObjectNameField ;
        String modifiedString = '';
        Boolean convertNextCharToLowerCase = false;
        for(Follow__c fav : favoriteRecordsToUpdate){
            tempObjectNameField = fav.Object_Name__c.substring(0, 1).toLowerCase() + fav.Object_Name__c.substring(1);
            if ((tempObjectNameField).endsWith('__c')) {
                tempObjectNameField = tempObjectNameField.substring(0, tempObjectNameField.length() - 3);
            } 
            modifiedString = tempObjectNameField;
            if(tempObjectNameField.contains('_')) {
                modifiedString = '';
                tempObjectNameField = tempObjectNameField.replace('_', '-');
                convertNextCharToLowerCase = false;
                for (Integer i = 0; i < tempObjectNameField.length(); i++) {
                    String currentChar = tempObjectNameField.substring(i, i + 1);
                    
                    if (currentChar == '-') {
                        convertNextCharToLowerCase = true;
                        modifiedString += currentChar;
                    } else if (convertNextCharToLowerCase) {
                        modifiedString += currentChar.toLowerCase();
                    } else {
                        modifiedString += currentChar;
                    }
                }
            }
        fav.Object_Name_In_Community_List_View_URL__c = modifiedString;
        }
        update favoriteRecordsToUpdate;
    }
    
    global void finish(Database.BatchableContext BC){}
}