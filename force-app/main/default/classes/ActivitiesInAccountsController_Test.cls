@IsTest
public class ActivitiesInAccountsController_Test {
    @TestSetup
    public static void createTestData()
    {
       
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Account acc = TestDataFactory.createAccount();
            Contact contact = TestDataFactory.createCommunityUserContact();
            Contact contact2 = TestDataFactory.createDynamicContact('Notes Test User');
            
            Test.startTest();
            User communityUser = TestDataFactory.createCommunityUser(contact.Id);
            communityUser.IsPortalEnabled = true;
            communityUser.Activities_Access__c = true;
            update communityUser;

            User secondCommunityUser = TestDataFactory.createSecondCommunityUser(contact2.Id);
            secondCommunityUser.IsPortalEnabled = true;
            secondCommunityUser.Activities_Access__c = false;
            update secondCommunityUser;
            
            System.RunAs(communityUser) 
            {
                Id taskRecordTypeId = Schema.getGlobalDescribe().get('Task').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
                Id eventRecordTypeId = Schema.getGlobalDescribe().get('Event').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Event').getRecordTypeId();

                Task newTask = TestDataFactory.createTask(communityUser.Id, acc.Id, taskRecordTypeId);
                
                TaskRelation tskr = TestDataFactory.createTaskRelation(newTask.Id, contact.Id);
                
                Event newEvent = TestDataFactory.createEvent(communityUser.Id, acc.Id,eventRecordTypeId);
                
                EventRelation evtr = TestDataFactory.createEventRelation(newEvent.Id, contact.Id);
            }
            Test.stopTest();
        }
    }
    
    @IsTest
    public static void testFetchAccountActivities()
    {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(ActivitiesInAccountsController.fetchActivities(acc.id,acc.id, 1)!=null);
        }
    }
    
    @IsTest
    public static void testFetchContactActivities()
    {
        Contact con = [SELECT Id FROM Contact LIMIT 1];
        
        Task task = [SELECT Id,WhoId FROM Task LIMIT 1];
        task.WhoId = con.Id;
        update task;
        
        Event event = [SELECT Id,WhoId FROM Event LIMIT 1];
        event.WhoId = con.Id;
        update event;
        
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(ActivitiesInAccountsController.fetchActivities(con.Id,con.Id, 1)!=null);
        }
        
    }
    
    @isTest
    public static void testFetchPastAccountActivities()
    {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        
        Task task = [SELECT Id,Status FROM Task LIMIT 1];
        task.Status = 'Completed';
        update task;
        
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(ActivitiesInAccountsController.fetchPastActivities(acc.id,acc.id, 1)!=null);
        }
    }
    
    @isTest
    public static void testFetchPastContactActivities()
    {
        Contact con = [SELECT Id FROM Contact LIMIT 1];
        
        Task task = [SELECT Id,WhoId FROM Task LIMIT 1];
        task.WhoId = con.Id;
        task.Status = 'Completed';
        update task;
        
        Event event = [SELECT Id,WhoId,StartDateTime FROM Event LIMIT 1];
        event.WhoId = con.Id;
        event.StartDateTime = System.now().addDays(-1);
        update event;
        
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(ActivitiesInAccountsController.fetchPastActivities(con.Id,con.Id, 1)!=null);
        }
        
    }
    
    @IsTest
    public static void testfetchEventSubject()
    {
        System.assert(ActivitiesInAccountsController.fetchEventSubject()!=null);
    }
    
     @IsTest
    public static void testFetchPickLists()
    {
        System.assert(ActivitiesInAccountsController.fetchPickLists()!=null);
    }
    
    @IsTest
    public static void testCreateEditTask()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            String connId = [SELECT Id FROM Contact LIMIT 1].Id;
            String accId = [SELECT Id FROM Account LIMIT 1].Id;
            String taskId = [SELECT Id FROM Task LIMIT 1].Id;
            System.assert(ActivitiesInAccountsController.createEditTask(null,'Email',System.today(), 'High', 'Open', communityUser.Id, accId, connId,'Test Desc')!=null);
            System.assert(ActivitiesInAccountsController.createEditTask(taskId,'Email',System.today(), 'High', 'Open', communityUser.Id, accId, connId,'Test Desc')!=null);
        }
    }
    
    @IsTest
    public static void testGetTaskContacts()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            Id taskId = [SELECT Id FROM Task LIMIT 1].Id;
            System.assert(ActivitiesInAccountsController.getTaskContacts(taskId)!=null);
        }
    }
    
    @IsTest
    public static void testCreateEditEvent()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            String eventId = [SELECT Id FROM Event LIMIT 1].Id;
            String connId = [SELECT Id FROM Contact LIMIT 1].Id;
            String accId = [SELECT Id FROM Account LIMIT 1].Id;
            System.assert(ActivitiesInAccountsController.createEditEvent(null,'Lunch',System.now(), System.now().addDays(1), communityUser.Id,accId, connId, false,'')!=null);
            System.assert(ActivitiesInAccountsController.createEditEvent(eventId,'Lunch',System.now(), System.now().addDays(1), communityUser.Id,accId, connId, false,'')!=null);
        }
    }

    @IsTest
    public static void testGetEventContacts()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            Id eventId = [SELECT Id FROM Event LIMIT 1].Id;
            System.assert(ActivitiesInAccountsController.getEventContacts(eventId)!=null);
        }
    }

    @IsTest
    public static void testFetchAccounts()
    {
        System.assert(ActivitiesInAccountsController.fetchAccounts('Test') !=null);
    }

    @IsTest
    public static void testFetchUsers()
    {
        Id accId = [SELECT Id FROM Account LIMIT 1].Id;
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(ActivitiesInAccountsController.fetchUsers(accId) !=null);
        }
    }
}