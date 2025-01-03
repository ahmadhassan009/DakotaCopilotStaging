@isTest
public with sharing class ManagerPresentationController_Test {
    @testSetUp
    public static void createData()
    {

        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Id presentationDeckRecordTypeId = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Presentation_Deck').getRecordTypeId();
        Manager_Presentation__c mpRecord = new Manager_Presentation__c();
        mpRecord.Name = 'Test Files';
        mpRecord.Is_Active__c = true;
        mpRecord.RecordTypeId = presentationDeckRecordTypeId;
        insert mpRecord;
        
        ContentVersion contentVersion = new ContentVersion(
            Title = 'Test File',
            PathOnClient = 'testFile.pdf',
            VersionData = Blob.valueOf('Test Content'),
            IsMajorVersion = true
        );
        insert contentVersion; 
        
        Id docId = [SELECT Id FROM ContentDocument].Id;
        ContentDocumentLink cdl = New ContentDocumentLink();
        cdl.LinkedEntityId = mpRecord.Id;
        cdl.ContentDocumentId = docId;
        cdl.shareType = 'V';
        insert cdl;

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
        
        Id docId = [SELECT Id FROM ContentDocument].Id;
        
        id[] fixedSearchResults = new id[1];
        fixedSearchResults[0] = docId;
        Test.setFixedSearchResults(fixedSearchResults);
        
        Test.startTest();
        ManagerPresentationController.fetchManagerPresentationRecords('Test');
        System.assertEquals(1, ManagerPresentationController.fetchManagerPresentationRecords('').size());
        Test.stopTest();
    }
    
    @isTest
    public static void testGetPublicDistributionURL()
    {
        Set<Id> docIds = new Set<Id>();
        Id docId = [SELECT Id FROM ContentDocument].Id;
        docIds.add(docId);
        String contentDocIds = JSON.serialize(docIds);
        
        Map<String,String> docIdToURL = ManagerPresentationController.getPublicDistributionURL(contentDocIds);
        System.assert(docIdToURL.values().size() > 0);
    }
    
    @isTest
    public static void testGetDocumentName()
    {
        Set<Id> docIds = new Set<Id>();
        Id docId = [SELECT Id FROM ContentDocument].Id;
        docIds.add(docId);
        String contentDocIds = JSON.serialize(docIds);
        
        Map<String,String> docIdToName = ManagerPresentationController.getDocumentName(contentDocIds);
        System.assert(docIdToName.values().size() > 0);
    }
}