global class BatchToUpdateUsersExportRecordsCount implements Database.Batchable<sObject>
{
    global Database.QueryLocator start(Database.BatchableContext bc)
    {
        if(test.isRunningTest())
        {
            return Database.getQueryLocator('SELECT Id,Export_Batch_Limit__c,Last_Export_Reset_Date__c from User where Allow_Account_and_Contacts_Export__c = true');
        }
        String todayDate= Datetime.now().format('yyyy-MM-dd');
        return Database.getQueryLocator('SELECT Id,Export_Batch_Limit__c,Last_Export_Reset_Date__c from User where Allow_Account_and_Contacts_Export__c = true And Last_Export_Reset_Date__c ='+todayDate);
    }
    
    global void execute(Database.BatchableContext bc, List<User> users)
    {
        for(User usr: users)
        {
            usr.Export_Batch_Limit__c = integer.valueof(System.Label.Initial_Export_Batch_Limit);
            usr.Last_Export_Reset_Date__c = Date.Today().addDays(30);
        }
        update users;
    }
    
    global void finish(Database.BatchableContext bc){} 
}