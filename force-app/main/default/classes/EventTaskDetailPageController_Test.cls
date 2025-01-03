@IsTest 
public with sharing class EventTaskDetailPageController_Test {
    @TestSetup
    public static void createTestData()
    {
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Contact contact = TestDataFactory.createCommunityUserContact();
            
            Test.startTest();
            User communityUser = TestDataFactory.createCommunityUser(contact.Id);
            communityUser.IsPortalEnabled = true;
            communityUser.Activities_Access__c = true;
            update communityUser;
            
            System.RunAs(communityUser) 
            {
                Id taskRecordTypeId = Schema.getGlobalDescribe().get('Task').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
                Id eventRecordTypeId = Schema.getGlobalDescribe().get('Event').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Event').getRecordTypeId();
                Account acc=[select id,name from account where name='Test Portal Account'];
                Task newTask = TestDataFactory.createTask(communityUser.Id, acc.Id, taskRecordTypeId);
                
                Event newEvent = TestDataFactory.createEvent(communityUser.Id, acc.Id,eventRecordTypeId);
            }
            Test.stopTest();
        }
    }
    
    @IsTest
    public static void testFetchEvent()
    {
        
        Event event = [SELECT Id,WhoId FROM Event LIMIT 1];
        System.assert(EventTaskDetailPageController.fetchEvent(event.Id)!=null);
        
    }

    @IsTest
    public static void testFetchTask()
    {
        
        Task task = [SELECT Id,WhoId FROM Task LIMIT 1];
        System.assert(EventTaskDetailPageController.fetchTask(task.Id)!=null);
        
    }

    @IsTest
    public static void testObjectNamefromId()
    {
        
        Task task = [SELECT Id,WhoId FROM Task LIMIT 1];
        System.assert(EventTaskDetailPageController.objectNamefromId(task.Id)=='Task');
        
    }
    @IsTest
    public static void testGetUserTimeZone()
    {
        System.assert(EventTaskDetailPageController.getUserTimeZone()!=null);
    }
}