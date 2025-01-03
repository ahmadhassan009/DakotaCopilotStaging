@IsTest
public class TriggerOnEventService_Test {
    @TestSetup
    public static void createTestData()
    {
       
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Account acc = TestDataFactory.createAccount();
            Contact contact = TestDataFactory.createContact();
            Test.startTest();
            User communityUser = TestDataFactory.createCommunityUser(contact.Id);
            communityUser.IsPortalEnabled = true;
            update communityUser;
            Test.stopTest();
        }

        Event newEvent = new Event();
        newEvent.subject = 'Slack Event';
        newEvent.StartDateTime = System.now().addDays(1);
        newEvent.EndDateTime = System.now().addDays(2);
        insert newEvent;
    }
    
    @IsTest
    public static void testProvideAccessToAllUsers()
    {
        Id eventRecordTypeId = Schema.getGlobalDescribe().get('Event').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Event').getRecordTypeId();
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            Test.startTest();
            Event newEvent = TestDataFactory.createEvent(communityUser.Id, acc.Id,eventRecordTypeId);
            Test.stopTest();
            Event event = [SELECT Is_Community_Activity__c,IsVisibleInSelfService FROM Event LIMIT 1];
            System.assertEquals(true, event.Is_Community_Activity__c);
            System.assertEquals(true, event.IsVisibleInSelfService);
        }
    }


    @IsTest
    public static void testSendSlackNotificationAfterInsert()
    {
        Test.startTest();
        Event newEvent = new Event();
        newEvent.subject = 'Slack Event';
        newEvent.StartDateTime = System.now().addDays(1);
        newEvent.EndDateTime = System.now().addDays(2);
        insert newEvent;
        Test.stopTest();
        System.debug('getQueueableJobs');
        System.debug(Limits.getQueueableJobs());
        system.assertEquals(1, Limits.getQueueableJobs(), 'The Event Slack Job should be Queued');

    }

    @IsTest
    public static void testSendSlackNotificationAfterUpdate()
    {
        Test.startTest();
        Event newEvent = [SELECT subject FROM Event WHERE Subject = 'Slack Event' LIMIT 1];
        newEvent.subject = 'Slack Event';
        update newEvent;
        Test.stopTest();
        system.assertEquals(1, Limits.getQueueableJobs(), 'The Event Slack Job should be Queued');
    }

    @IsTest
    public static void testSendSlackNotificationAfterDelete()
    {
        Test.startTest();
        Event newEvent = [SELECT subject FROM Event WHERE Subject = 'Slack Event' LIMIT 1];
        delete newEvent;
        Test.stopTest();
        system.assertEquals(1, Limits.getQueueableJobs(), 'The Event Slack Job should be Queued');
    }

    
}