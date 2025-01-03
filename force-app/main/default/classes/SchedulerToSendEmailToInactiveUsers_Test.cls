@isTest
public with sharing class SchedulerToSendEmailToInactiveUsers_Test {
    
    @testSetUp
    public static void CreateTestData()
    {
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User']; 
        User u = new User(Alias = 'standt', Email='test@tgmailrt.com', 
            EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', ProfileId = p.Id, 
            TimeZoneSidKey='America/Los_Angeles', UserName='test@tgmailrt.com');
        insert u;
    }

    @isTest

    public static void testSendEmailToInactiveUsers()
    {
        System.Test.startTest();
        SchedulerToSendEmailToInactiveUsers sh1 = new SchedulerToSendEmailToInactiveUsers();      
        String sch = '0 0 23 * * ?';
        system.schedule('Test check', sch, sh1);
        System.Test.stopTest();
    }
}