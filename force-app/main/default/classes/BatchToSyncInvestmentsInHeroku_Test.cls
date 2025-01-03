@IsTest
public with sharing class BatchToSyncInvestmentsInHeroku_Test {
    @TestSetup
    static void setupTestData() {

        // Create test data for your batch job, if required
        Account acc = TestDataFactory.createAccount();
        TestDataFactory.createInvestmentRecord(acc.Id);
        TestDataFactory.createHerokuAuthMetadata();
        

    }
    
    @IsTest
    static void testBatchJob() {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        // Create test records to be processed by the batch job
        List<Investment__c> testInvestments = new List<Investment__c>{[SELECT Id, Heroku_Synced__c FROM Investment__c Limit 1]};
        if(testInvestments != null && testInvestments.size() > 0){
            testInvestments[0].Heroku_Synced__c = false;
            update testInvestments;
        }
        // Add test investments to the list
        
        Test.startTest();
        // Instantiate the batch class
        BatchToSyncInvestmentsInHeroku batchJob = new BatchToSyncInvestmentsInHeroku();
        
        // Start the batch job
        Database.executeBatch(batchJob);
        Test.stopTest();
        
        // Perform assertions to verify the batch job's behavior
        // For example, check if the investments were updated correctly
        
        // Retrieve the updated investments
        List<Investment__c> updatedInvestments = [SELECT Id, Heroku_Synced__c FROM Investment__c];
        
        // Assert that the Heroku_Synced__c field is set to true for the updated investments
        for (Investment__c investment : updatedInvestments) {
            System.assertEquals(true, investment.Heroku_Synced__c);
        }
    }
}