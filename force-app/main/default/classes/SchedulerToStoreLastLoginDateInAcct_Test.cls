@isTest
public class SchedulerToStoreLastLoginDateInAcct_Test {
    @testSetup
    public static void createTestDate(){
        User_Last_Login_Scheduler__c schedulerDateTime = new User_Last_Login_Scheduler__c();
        schedulerDateTime.Name = 'Test Scheduler';
        schedulerDateTime.Last_Sync_Date__c = System.now().addDays(-1);
        insert schedulerDateTime;
        
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Account portalAccount = new Account();
            portalAccount.Name = 'TestAccount';
            portalAccount.Customer_Last_Login_Date__c = Date.today();
            insert portalAccount;

            Contact portalContact = new Contact();
            portalContact.Lastname = 'Test Contact';
            portalContact.AccountId = portalAccount.Id;
            insert portalContact;
            
            Profile p = [SELECT Id from Profile WHERE Name= 'Dakota Customer Community']; 
            
            User portalUser =new User();
            portalUser.Alias = 'dcom';
            portalUser.Email='communityuser@testorg.com'; 
            portalUser.EmailEncodingKey='UTF-8';
            portalUser.LastName='Test User';
            portalUser.LanguageLocaleKey='en_US'; 
            portalUser.LocaleSidKey='en_US';
            portalUser.ProfileId = p.Id;
            portalUser.TimeZoneSidKey='America/Los_Angeles';
            portalUser.UserName='communityuser@testorg.com';
            portalUser.ContactId = portalContact.Id;
            portalUser.IsActive = true;
            insert portalUser; 
        }
   }
    
    @isTest
    public static void testSchedulerToStoreLastLoginDateInAccount()
    {
        Test.StartTest();
        SchedulerToStoreLastLoginDateInAccount sh1 = new SchedulerToStoreLastLoginDateInAccount();      
        String sch = '0 0 23 * * ?';
        system.schedule('Test check', sch, sh1);
        Integer scheduledJobCount = [SELECT COUNT() FROM CronJobDetail WHERE Name = 'Test check'];
        System.assert(scheduledJobCount == 1);
        Test.stopTest();
        
        List<User_Last_Login_Scheduler__c> userLastLoginScheduler = User_Last_Login_Scheduler__c.getall().values();
        System.assertNotEquals(Date.today().addDays(-1), Date.valueOf(userLastLoginScheduler[0].Last_Sync_Date__c));
    }


    @IsTest
    static void testBatchException(){
        
        Test.startTest();
        BatchToUpdateLastLoginDate bat = new BatchToUpdateLastLoginDate();
        bat.accountIdToUser = new Map<Id,User>();
        bat.Last_Sync_Date = Date.today().addDays(-1);
        bat.exceptionFound = true;
        DataBase.executeBatch(bat);
        Test.stopTest();
        List<User_Last_Login_Scheduler__c> userLastLoginScheduler = User_Last_Login_Scheduler__c.getall().values();
        System.assertEquals(Date.today().addDays(-1), Date.valueOf(userLastLoginScheduler[0].Last_Sync_Date__c));
        
    }
}