@isTest
public with sharing class TriggerOnUpdateService_Test {
    @testSetup
    static void setupTestData() {

        // Create test data for your batch job, if required
        Heroku_Credentials__c cs = New Heroku_Credentials__c();
        cs.Name = 'Authentication_Credentials';
        cs.Access_Token__c = '7mmWMaIKs2Cxvsiff7SX3SwLn/POtlHdhb+BB/9jtopu2w68Sw1Wf4Zq6a3GVfxeS/F8C6WcwyBg8NRRi+N/5w==';
        cs.Authentication_Key__c= 'lrGY/02l8WrqQftXLdFV3Q==';
        cs.Heroku_URL__c= 'https://marketplace-dakota-dev.herokuapp.com';
        cs.Expiry_Date__c= Datetime.now();
        cs.Password__c= 'zgDN+dXLx5wpSA9aJDFZOX1K6QEzkrU9c3RvNfxwAo0=';
        cs.Username__c= 'qa';
        insert cs;
        Contact con = TestDataFactory.createCommunityUserContact();
        Account joinded = TestDataFactory.createDynamicAccount('test update');
        Account acc = TestDataFactory.createAccount();
        TestDataFactory.createUpdateRecords(acc.Id,joinded.Id,con.Id);
    }
    @isTest
    public static void testResetHerokuSyncFlag() {
        
        List<Update__c> inv = [SELECT Id,New_Title__c, Heroku_Synced__c FROM Update__c LIMIT 1];
        System.assertEquals(false, inv[0].Heroku_Synced__c);
        inv[0].New_Title__c = 'Test';
        update inv;
        List<Update__c> updated = [SELECT Id,New_Title__c, Heroku_Synced__c FROM Update__c WHERE id = :inv[0].Id LIMIT 1];
        System.assertEquals(false, updated[0].Heroku_Synced__c);
        
    }

    @IsTest
    static void testDeleteRecFromHeroku() 
    {    
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Test.startTest();
        Update__c updates  = [SELECT Id FROM Update__c  limit 1];
        delete updates;
        Test.stopTest();
    }
}