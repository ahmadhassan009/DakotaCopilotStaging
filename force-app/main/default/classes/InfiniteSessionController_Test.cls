@isTest
public with sharing class InfiniteSessionController_Test {
    @TestSetup
    static void makeData(){
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Account acc = TestDataFactory.createAccount();
            acc.Active_Draft_Trial__c = true;
            acc.Trial_Start_Date__c = System.today();
            update acc;
            Contact contact = TestDataFactory.createDynamicContact('infinite');
                        
            User communityUser = TestDataFactory.createCommunityUser(contact.Id);
            communityUser.IsPortalEnabled = true;
            update communityUser;
        
        } 
    }
    @isTest
    static void isTrailUserTest(){

        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(InfiniteSessionController.isTrailUser() == true);
        }

       
    }
}