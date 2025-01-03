@isTest
public with sharing class ManagerPsRelatedToAccount_Test {
    @testSetup
    public static void createTestDate()
    {
        Id feeScheduleRecordTypeId = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Fee_Schedule').getRecordTypeId();
        Account accWODoc = new Account();
        accWODoc.Name = 'Test Account WO Doc';
        accWODoc.Type = 'RIA';
        insert accWODoc;
        
        Manager_Presentation__c fsRecordWoDoc = new Manager_Presentation__c();
        fsRecordWoDoc.Name = 'Test Files WO Doc';
        fsRecordWoDoc.Is_Active__c = true;
        fsRecordWoDoc.RecordTypeId = feeScheduleRecordTypeId;
        fsRecordWoDoc.Account__c = accWODoc.Id;
        insert fsRecordWoDoc;

        Account acc = new Account();
        acc.Name = 'Test Account';
        acc.Type = 'RIA';
        insert acc;

        Manager_Presentation__c fsRecord = new Manager_Presentation__c();
        fsRecord.Name = 'Test Files';
        fsRecord.Is_Active__c = true;
        fsRecord.RecordTypeId = feeScheduleRecordTypeId;
        fsRecord.Account__c = acc.Id;
        insert fsRecord;

        ManagerPresentationsRelatedToAccount.ManagerPresentationsData temp = new ManagerPresentationsRelatedToAccount.ManagerPresentationsData();
        temp.Id = 'Test';
        temp.DocName = 'Test';
        temp.AccountName = 'Test';
        temp.DistributionPublicUrl = 'Test';

/*        ContentVersion contentVersion = new ContentVersion(
            Title = 'Test File',
            PathOnClient = 'testFile.pdf',
            VersionData = Blob.valueOf('Test Content'),
            IsMajorVersion = true
        );
        insert contentVersion; 
        
        Id docId = [SELECT Id FROM ContentDocument].Id;
        ContentDocumentLink cdl = New ContentDocumentLink();
        cdl.LinkedEntityId = fsRecord.Id;
        cdl.ContentDocumentId = docId;
        cdl.shareType = 'V';
        insert cdl;

        id[] fixedSearchResults = new id[1];
        fixedSearchResults[0] = docId;
        Test.setFixedSearchResults(fixedSearchResults);
*/		        


    }
    
    @isTest
    public static void testGetFeeScheduleRecordsWoDoc(){
        Account acc = [Select Id from Account where Name = 'Test Account WO Doc' Limit 1]; 
        System.assertEquals(0, ManagerPresentationsRelatedToAccount.getManagerPresentationRecords(acc.Id,'Fee Schedule').size());
    }

    @isTest
    public static void testGetFeeScheduleRecords(){
        Account acc = [Select Id from Account where Name = 'Test Account' Limit 1]; 
        List<ManagerPresentationsRelatedToAccount.ManagerPresentationsData> result = ManagerPresentationsRelatedToAccount.getManagerPresentationRecords(acc.Id,'Meeting Materials');
        System.assertEquals(0, ManagerPresentationsRelatedToAccount.getManagerPresentationRecords(acc.Id,'Fee Schedule').size()); 
        System.assertEquals(0, result.size());
    }
    
    @isTest
    public static void testGetAccountName() {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To MP';
        insert accountRecord;
        Account returedAccount = ManagerPresentationsRelatedToAccount.getAccountName(accountRecord.Id);
        system.assertEquals(returedAccount.Name,'Test Account Linked To MP');       
    }
    
    @isTest
    public static void testGetSFBaseUrl() {
        string result = ManagerPresentationsRelatedToAccount.getSFBaseUrl();
        system.assertNotEquals(result, '');       
    }    
        
    @isTest
    public static void testGetRecordsCount() {
		Account acc = [Select Id from Account where Name = 'Test Account' Limit 1]; 
        Integer result = ManagerPresentationsRelatedToAccount.getRecordsCount(acc.Id);
        system.assertNotEquals(result, 0);       
    }

    @isTest
    public static void testGetRecords() {
		Account acc = [Select Id from Account where Name = 'Test Account' Limit 1]; 
        List<Manager_Presentation__c> result = ManagerPresentationsRelatedToAccount.getRecords(acc.Id, 'Asset_Class__c', 'desc',  'LAST', 10, 0);
        try {         
        	List<Manager_Presentation__c> result2 = ManagerPresentationsRelatedToAccount.getRecords(acc.Id, 'Asset_Class__c', 'desc',  'LAST', Null, 0);
        } Catch(Exception e) {
	        system.assertNotEquals(e, null);
        }
        system.assertNotEquals(result.size(), 0);       
    }
}