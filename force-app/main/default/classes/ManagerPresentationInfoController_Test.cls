@isTest
public with sharing class ManagerPresentationInfoController_Test {
    @testSetUp
    public static void createData()
    {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        ContentVersion contentVersion = new ContentVersion(
            Title = 'Dummy',
            PathOnClient = 'testFile.pdf',
            VersionData = Blob.valueOf('Test Content'),
            IsMajorVersion = true
        );
        insert contentVersion; 
        
        Id docId = [SELECT Id FROM ContentDocument].Id;

        Manager_Presentation_Info__c mpInfo =new Manager_Presentation_Info__c(
            Distribution_Public_URL__c = 'https://dakotanetworks--uat.sandbox.my.salesforce.com/sfc/p/760000008iJi/a/760000004n10/uKg9nXCfUU6uSxNO7n8xcngPgAVor6N.dmZ8nOaT8q8',
            MP_Title__c = 'Dummy',
            Type__c='Pension Staff Review',
            Asset_Class__c='Global Equities',
            Sub_Asset_Class__c='Healthcare',
            Meeting_Date__c=system.today(),
            Content_Document_Id__c = docId
            );
        insert mpInfo;

         Heroku_Credentials__c cs = New Heroku_Credentials__c();
        cs.Name = 'Authentication_Credentials';
        cs.Access_Token__c = '7mmWMaIKs2Cxvsiff7SX3SwLn/POtlHdhb+BB/9jtopu2w68Sw1Wf4Zq6a3GVfxeS/F8C6WcwyBg8NRRi+N/5w==';
        cs.Authentication_Key__c= 'lrGY/02l8WrqQftXLdFV3Q==';
        cs.Heroku_URL__c= 'https://marketplace-dakota-dev.herokuapp.com';
        cs.Expiry_Date__c= Datetime.now();
        cs.Password__c= 'zgDN+dXLx5wpSA9aJDFZOX1K6QEzkrU9c3RvNfxwAo0=';
        cs.Username__c= 'qa';
        insert cs;
    }
    
    @isTest
    public static void testFetchManagerPresentationRecords(){        
        Test.startTest();
        System.assertEquals(1, ManagerPresentationInfoController.getRecordsCount(''));
        ManagerPresentationInfoController.getAllRecords('Dummy','Meeting_Date__c','desc',5,0,'LAST').size();
        Test.stopTest();
    }
}