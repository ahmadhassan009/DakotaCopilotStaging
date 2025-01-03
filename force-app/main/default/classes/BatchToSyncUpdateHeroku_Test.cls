@isTest
public with sharing class BatchToSyncUpdateHeroku_Test {

    @testSetup
    static void setupTestData() {

        // Create test data for your batch job, if required
        Contact con = TestDataFactory.createCommunityUserContact();
        Account joinded = TestDataFactory.createDynamicAccount('test update');
        Account acc = TestDataFactory.createAccount();
        TestDataFactory.createUpdateRecords(acc.Id,joinded.Id,con.Id);
        TestDataFactory.createHerokuAuthMetadata();
    }

    @isTest
    static void testBatchJob() {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Test.startTest();
        // Instantiate the batch class
        BatchToSyncUpdateHeroku batchJob = new BatchToSyncUpdateHeroku();
        
        // Start the batch job
        Database.executeBatch(batchJob);
        Test.stopTest();
        
        // Perform assertions to verify the batch job's behavior
        // For example, check if the update were updated correctly
        
        // Retrieve the updated update
        List<Update__c> updateds = [SELECT Id, Heroku_Synced__c FROM Update__c];
        
        // Assert that the Heroku_Synced__c field is set to true for the updated 
        for (Update__c updated : updateds) {
            System.assertEquals(true, updated.Heroku_Synced__c);
        }
    }
}