@isTest
public with sharing class NotesInAccountAndContactController_Test {

    @TestSetup
    public static void createTestData()
    {
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Account acc = TestDataFactory.createAccount();
            Contact contact = TestDataFactory.createContact();
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
                Dakota_Notes__c dnotes =  TestDataFactory.createNote(communityUser.Id, acc.Id);
            }
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
            System.assert(NotesInAccountAndContactController.getOrganizationId()!=null);
        }
    }
    
    @IsTest
    public static void testFetchNotes()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(NotesInAccountAndContactController.getSFBaseUrl() != null);
            System.assert(NotesInAccountAndContactController.fetchNotes([SELECT Id FROM Account LIMIT 1].id, 1, 0, 'Id', 'ASC')!=null);
        }
        
    }
    
    @IsTest
    public static void testgetObjectName()
    {
        System.assert(NotesInAccountAndContactController.getObjectName([SELECT Id FROM Account LIMIT 1].id)!=null);
         
    }

    @IsTest
    public static void testgetUserProfileName()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(NotesInAccountAndContactController.getUserProfileName()!=null);
        }    
    }

    @IsTest
    public static void testGetTotalNotesRecordsCount()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(NotesInAccountAndContactController.getTotalNotesRecordsCount([SELECT Id FROM Account LIMIT 1].id)!=null);
        }
    }

    @IsTest
    static void testCheckDakotaNotesPermissions(){
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        User secondCommunityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser2@testorg.com' Limit 1];
        Test.startTest();
        //positive case
        System.runAs(communityUser){
            System.assertEquals(NotesInAccountAndContactController.checkDakotaNotesPermissions(), true, 'Permissions for Dakota Notes not given');
        }
        //negative case 
        System.runAs(secondCommunityUser){
            System.assertEquals(NotesInAccountAndContactController.checkDakotaNotesPermissions(), false, 'Permissions for Dakota Notes given');
        }
        Test.stopTest();
        
    }
    
    @IsTest
    public static void testDeleteNote()
    {
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            Account acc = [SELECT Id FROM Account LIMIT 1];
            Dakota_Notes__c dnotes =  TestDataFactory.createNote(communityUser.Id, acc.Id);
            System.assert(NotesInAccountAndContactController.deleteNote(dnotes.Id)!=null);
        }
    }
    
    @IsTest
    public static void testFetchParentRecord()
    {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        SObject accReturned = NotesInAccountAndContactController.fetchParentRecord(acc.Id);
        System.assertEquals(acc.Id, accReturned.Id, 'Return Account does not match');
        
        Contact con = [SELECT Id FROM Contact LIMIT 1];
        SObject conReturned = NotesInAccountAndContactController.fetchParentRecord(con.Id);
        System.assertEquals(con.Id, conReturned.Id, 'Return Contact does not match');
        
    }
    
}