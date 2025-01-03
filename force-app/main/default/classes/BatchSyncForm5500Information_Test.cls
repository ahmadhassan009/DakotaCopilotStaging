@isTest
public with sharing class BatchSyncForm5500Information_Test {
    @TestSetup
    static void setupTestData() {
        // Create test data for your batch job, if required
        Account acc = TestDataFactory.createAccount();
        TestDataFactory.createForm5500AdditionalInformationRecord(acc.Id);
        TestDataFactory.createHerokuAuthMetadata();
    }
    
    @IsTest
    static void testBatchJob() {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        // Create test records to be processed by the batch job
        List<Form_5500_Additional_Information__c> testForm5500AdditionalInformation = new List<Form_5500_Additional_Information__c>{[SELECT Id, Heroku_Synced__c FROM Form_5500_Additional_Information__c Limit 1]};
        if(testForm5500AdditionalInformation != null && testForm5500AdditionalInformation.size() > 0){
            testForm5500AdditionalInformation[0].Heroku_Synced__c = false;
           update testForm5500AdditionalInformation;
        }
        
        Test.startTest();
        // Instantiate the batch class
        BatchToSyncForm5500AdditionalInformation batchJob = new BatchToSyncForm5500AdditionalInformation();
        
        // Start the batch job
        Database.executeBatch(batchJob);
        Test.stopTest();
        
        // Perform assertions to verify the batch job's behavior
        // For example, check if the form5500AdditionalInformation were updated correctly
        
        List<Form_5500_Additional_Information__c> updatedForm5500AdditionalInformation = [SELECT Id, Heroku_Synced__c FROM Form_5500_Additional_Information__c];
        
        // Assert that the Heroku_Synced__c field is set to true for the updated investments
        for (Form_5500_Additional_Information__c form5500AdditionalInformation : updatedForm5500AdditionalInformation) {
            System.assertEquals(true, form5500AdditionalInformation.Heroku_Synced__c);
        }
    }
}