@IsTest
public with sharing class CrmIntegrationController_Test {
    @TestSetup
    public static void createTestData()
    {
        Account acc = New Account(
            Name = 'Test Acc'
        );
        insert acc;
        
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            //Create contact
            Contact contact = new Contact(
                FirstName = 'Test',
                Lastname = 'Community User',
                AccountId = acc.Id
            );
            
            insert contact;
            Profile p = [SELECT Id from Profile WHERE Name= 'Dakota Customer Community']; 
            Test.startTest();
            User communityUser =new User(Alias = 'dcom', 
                                        Email='communityuser@testorg.com', 
                                        EmailEncodingKey='UTF-8',
                                        LastName='Testing',
                                        LanguageLocaleKey='en_US', 
                                        LocaleSidKey='en_US',
                                        ProfileId = p.Id, 
                                        TimeZoneSidKey='America/Los_Angeles',
                                        UserName='communityuser@testorg.com',
                                        ContactId = contact.Id,
                                        Portal_State__c = 'MP 2.0',
                                        IsActive = true);
            
            insert communityUser; 
            communityUser.IsPortalEnabled = true;
            update communityUser;
            Test.stopTest();
        }
    }
    
    @IsTest
    public static void testGetOrganizationId()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(CrmIntegrationController.getOrganizationId()!=null);
        }
    }

    @IsTest
    public static void testCheckDataIntegerationsAccess()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(CrmIntegrationController.checkDataIntegerationsAccess(acc.Id)==null);
        }
    }

    @IsTest
    public static void testGetCurrentUserTimeZone()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assertEquals(CrmIntegrationController.getCurrentUserTimeZone(), 'America/Los_Angeles', 'TimeZone is not correct');
        }
    }

    @IsTest
    public static void testGetAccountName()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(CrmIntegrationController.getAccountName(acc.Id)!=null);
        }
    }

    @IsTest
    public static void testGetContactName()
    {
        Contact con = [SELECT Id FROM Contact Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(CrmIntegrationController.getContactName(con.Id)!=null);
        }
    }
}