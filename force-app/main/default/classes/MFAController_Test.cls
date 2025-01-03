@isTest
public with sharing class MFAController_Test {

    public class mockSession {
        public Id Id ='a138E000000N9dr';
        public Id ParentId;
        public String SessionType = 'NotTempChatterNetworks';
        public Datetime LastModifiedDate = Datetime.now();
    }

    @IsTest
    static void testRevokeUserSession(){
        Test.startTest(); 
        mockSession ms = new mockSession();
        String session = JSON.serialize(ms);
        AuthSession ss =  (AuthSession)JSON.deserialize(session, AuthSession.class);
        MFAController.sessions.add(ss);       
        MFAController.revokeUserSession();
        System.assert(MFAController.concurrEvents.size()>0);
        Test.stopTest();
    }

    @IsTest
     static void testGetAuthSessionId(){
        Test.startTest();
        System.assert(MFAController.getAuthSessionId()=='true');
        Test.stopTest();
     }

    @IsTest
    static void testSetUserLastLoginDate(){
        
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Test.startTest();
            Account acc = TestDataFactory.createAccount();
            Contact contact = TestDataFactory.createContact();
            contact.AccountId = acc.Id;
            update contact;
            User communityUser = TestDataFactory.createCommunityUser(contact.Id);
            System.RunAs(communityUser) 
            {
                MFAController.setUserLastLoginDate();
            }
            Test.stopTest(); 
            List<Contact> conList = [SELECT Id, User_Last_Login_Date__c FROM Contact LIMIT 1];
            if(conList.size() > 0) {
                System.assert(conList[0].User_Last_Login_Date__c == System.Today());
            }
        }
    }
}