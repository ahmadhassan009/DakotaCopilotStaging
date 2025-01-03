global class SchedulerToStoreLastLoginDateInAccount implements Schedulable{
    global void execute(SchedulableContext ctx) {
        List<String> profileNames = new List<String>{'Dakota Customer Community','Dakota Customer API Only Users', 'Marketplace Lite Customer', 'Customer Community Plus User'
        , 'Customer Community Plus User', 'Marketplace User - Emerging Manager Membership', 'Marketplace User - Platinum Membership', 'Marketplace User - Premium Membership', 'Marketplace User - Standard Membership'};
        List<User_Last_Login_Scheduler__c> userLastLoginScheduler = User_Last_Login_Scheduler__c.getall().values();
        if(userLastLoginScheduler.size() > 0)
        {
            Datetime schedulerLastRunDate = userLastLoginScheduler[0].Last_Sync_Date__c;
            List<User> communityUsers = new List<User>();
            if(!Test.isRunningTest())
            {
                communityUsers = [Select Id,Name,LastLoginDate,AccountId from User where Profile.Name In :profileNames
                                  and LastLoginDate != null and IsActive = true and Account.Id != null
                                  and LastLoginDate >= :schedulerLastRunDate 
                                  order by LastLoginDate desc];
            }
            else
            {
                communityUsers = [Select Id,Name,LastLoginDate,AccountId from User where Profile.Name In :profileNames
                                  and IsActive = true and Account.Id != null
                                  order by LastLoginDate desc];
            }
            if(communityUsers.size() > 0)
            {
                Map<Id,User> accountIdToUser = new Map<Id,User>();
                for(User u:communityUsers)
                {
                    if(!accountIdToUser.containsKey(u.AccountId))
                    {
                        accountIdToUser.put(u.AccountId,u);
                    }
                }
                if(accountIdToUser.size() > 0)
                {
                    //DSC-774: Update Accounts in batch to resolve Apex CPU limit exception
                    BatchToUpdateLastLoginDate bat = new BatchToUpdateLastLoginDate();
                    bat.accountIdToUser = accountIdToUser;
                    bat.Last_Sync_Date = schedulerLastRunDate;
                    database.executebatch(bat,50);
                }
            }
            userLastLoginScheduler[0].Last_Sync_Date__c = System.now();
            update userLastLoginScheduler;
        }
    }
}