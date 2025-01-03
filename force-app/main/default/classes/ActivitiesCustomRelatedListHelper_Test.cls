@isTest
public class ActivitiesCustomRelatedListHelper_Test 
{
    @testSetup
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
    
    @isTest
    public static void testGetOrganizationId()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(ActivitiesCustomRelatedListHelper.getOrganizationId()!=null);
        }
    }
    
    @isTest
    public static void testGetAccountName(){
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To Task/Event Record';
        insert accountRecord;
        Account returedAccount = ActivitiesCustomRelatedListHelper.getAccountName(accountRecord.Id);
        system.assertEquals(returedAccount.Name,'Test Account Linked To Task/Event Record');
    }
    
    @isTest
    public static void testCheckActivityPermissions(){
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        User secondCommunityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser2@testorg.com' Limit 1];
        Test.startTest();
        //positive case
        System.runAs(communityUser){
            System.assertEquals(ActivitiesCustomRelatedListHelper.checkActivityPermissions(), true, 'Permissions for Activities not given');
        }
        //negative case 
        System.runAs(secondCommunityUser){
            System.assertEquals(ActivitiesCustomRelatedListHelper.checkActivityPermissions(), false, 'Permissions for Activities given');
        }
        Test.stopTest();
    }
    
    @isTest
    public static void testDeleteActivity()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            Id taskRecordTypeId = Schema.getGlobalDescribe().get('Task').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
            Account acc = [SELECT Id FROM Account LIMIT 1];
            Task newTask = TestDataFactory.createTask(communityUser.Id,acc.id,taskRecordTypeId);
            System.assert(ActivitiesCustomRelatedListHelper.deleteActivity(newTask.Id)!=null);
            
            Id eventRecordTypeId = Schema.getGlobalDescribe().get('Event').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Event').getRecordTypeId();
            Event newEvent = TestDataFactory.createEvent(communityUser.Id, acc.id, eventRecordTypeId);
            System.assert(ActivitiesCustomRelatedListHelper.deleteActivity(newEvent.Id)!=null);
        }
    }
    
    @isTest
    public static void testrecordExists()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            Id eventId = [SELECT Id FROM Event LIMIT 1].Id;
            Id taskId = [SELECT Id FROM Task LIMIT 1].Id;
            System.assert(ActivitiesCustomRelatedListHelper.recordExists(eventId)== true);
            System.assert(ActivitiesCustomRelatedListHelper.recordExists(taskId)==true);
        }
    }
    
    @isTest
    public static void testGetObjectName(){
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        Test.startTest();
        System.RunAs(communityUser) 
        {
            Id eventId = [SELECT Id FROM Event LIMIT 1].Id;
            Id taskId = [SELECT Id FROM Task LIMIT 1].Id;
            System.assertEquals(ActivitiesCustomRelatedListHelper.getObjectName(eventId), 'Event');
            System.assertEquals(ActivitiesCustomRelatedListHelper.getObjectName(taskId), 'Task');
        }
        Test.stopTest();
    }
    
    @isTest
    public static void testgetContactName()
    {
        Id contactId = [SELECT Id FROM Contact LIMIT 1].Id;
        System.assert(ActivitiesCustomRelatedListHelper.getContactName(contactId) !=null);
    }
    
    @isTest
    public static void testFetchParentRecord()
    {
        Id contactId = [SELECT Id FROM Contact LIMIT 1].Id;
        System.assert(ActivitiesCustomRelatedListHelper.fetchParentRecord(contactId) !=null);
        Id accId = [SELECT Id FROM Account LIMIT 1].Id;
        System.assert(ActivitiesCustomRelatedListHelper.fetchParentRecord(accId) !=null);
    }
    
    @isTest
    public static void testGetSFBaseUrl()
    {
        System.assert(ActivitiesCustomRelatedListHelper.getSFBaseUrl() !=null);
    }
    
    @isTest
    public static void testGetSessionId()
    {
        System.assert(ActivitiesCustomRelatedListHelper.getSessionId() !=null);
    }
    
    @isTest
    public static void testActivityHelper()
    {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(ActivitiesInAccountsController.fetchActivities(acc.id,acc.id, 1)!=null);
        }
    }

    @isTest
    public static void testGetAssigneeUserId()
    {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(ActivitiesCustomRelatedListHelper.getAssigneeUserId()!=null);
        }
    }
}