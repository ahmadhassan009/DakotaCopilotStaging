global class BatchToUpdateLastLoginDate implements Database.Batchable<sObject>, Database.Stateful
{
    global Map<Id,User> accountIdToUser{get;set;}
    global dateTime Last_Sync_Date{get;set;}
    global boolean exceptionFound = false;
    
    global Database.QueryLocator start(Database.BatchableContext bc)
    {
        return Database.getQueryLocator([Select Id,Name,Customer_Last_Login_Date__c from Account where Id In :accountIdToUser.keySet()]);
    }
    global void execute(Database.BatchableContext bc, List<Account> accounts)
    {
        try
        {
            List<Account> accountsToBeUpdated = new List<Account>();
            for(Account acct: accounts)
            {
                Date lastLoginDate = Date.valueOf(accountIdToUser.get(acct.Id).LastLoginDate);
                if(acct.Customer_Last_Login_Date__c != lastLoginDate)
                {
                    acct.Customer_Last_Login_Date__c = lastLoginDate;
                    accountsToBeUpdated.add(acct);
                }
            }
            if(accountsToBeUpdated.size() > 0)
            {
                update accountsToBeUpdated;
            }    
        }
        catch(exception ex)
        {
            exceptionFound = true;
            throw(ex);
        }
    }
    global void finish(Database.BatchableContext bc)
    {
        //if exception occures revert the Last Sync date in custom settings
        if(exceptionFound)
        {
            List<User_Last_Login_Scheduler__c> userLastLoginScheduler = User_Last_Login_Scheduler__c.getall().values();
            if(userLastLoginScheduler.size() > 0)
            {
                userLastLoginScheduler[0].Last_Sync_Date__c = Last_Sync_Date;
                update userLastLoginScheduler;
            }    
        }        
    } 
}