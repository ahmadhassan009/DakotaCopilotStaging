@IsTest
public class TriggerOnTaskService_Test {
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
    }

    @IsTest
    public static void testProvideAccessToAllUsers()
    {
        Id taskRecordTypeId = Schema.getGlobalDescribe().get('Task').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            Test.startTest();
            Task newTask = TestDataFactory.createTask(communityUser.Id, acc.Id, taskRecordTypeId);
            Test.stopTest();
            Task task = [SELECT Is_Community_Activity__c,IsVisibleInSelfService FROM Task LIMIT 1];
            System.assertEquals(true, task.Is_Community_Activity__c);
            System.assertEquals(true, task.IsVisibleInSelfService);
        }
    }
}