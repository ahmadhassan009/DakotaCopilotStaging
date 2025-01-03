@isTest
public with sharing class SendAccountContactUnverifiedEmails_Test {
    @TestSetup
    static void makeData(){
        List<Account> accountList = new List<Account>();
        List<Contact> contactList = new List<Contact>();
        
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            //creating bulk accounts
            for (Integer i = 0; i < 100; i++) {
                Account acc = new Account(Name = 'Test Account '+i, X100_Marketplace__c=true);
                accountList.add(acc);
            }
            insert accountList;
            for (Account acc : accountList) {
                Contact con = new Contact(Title = 'Test Contact '+acc.Id, LastName = 'Test Contact '+acc.Id, Marketplace_Verified_Contact__c=true, AccountId = acc.Id);
                contactList.add(con);
            }
            insert contactList;
            Contact contact = TestDataFactory.createContact();
            User communityUser = TestDataFactory.createCommunityUser(contact.Id);
            communityUser.IsPortalEnabled = true;
            communityUser.Activities_Access__c = true;
            update communityUser;

            Test.startTest();
            Id taskRecordTypeId = Schema.getGlobalDescribe().get('Task').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
            TestDataFactory.createMassTasks(communityUser.Id, contactList, taskRecordTypeId);
            TestDataFactory.createMassNotes(communityUser.Id, contactList);
            Test.stopTest();
        }
    }
    @IsTest
    static void testSendMailAlertAccount() {
        Test.startTest();
        List<Id> accIdList= new List<Id>();
        for(Account acc : [SELECT Id, X100_Marketplace__c FROM Account]){
            accIdList.add(acc.Id);
        }
       
        SendAccountContactUnverifiedEmailAlerts.sendUnverifiedEmails(accIdList);
        System.assert(Limits.getEmailInvocations()>0);
        Test.stopTest();
        
    }

    @IsTest
    static void testSendMailAlertContact() {
        Test.startTest();
        List<Id> conIdList= new List<Id>();
        for(Contact con : [SELECT Id FROM Contact]){
            conIdList.add(con.Id);
        }
        SendAccountContactUnverifiedEmailAlerts.sendUnverifiedEmails(conIdList);
        System.assert(Limits.getEmailInvocations()>0);
        Test.stopTest();
        
    }
}