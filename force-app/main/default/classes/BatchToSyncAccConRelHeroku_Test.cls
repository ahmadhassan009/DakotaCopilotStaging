@IsTest
public with sharing class BatchToSyncAccConRelHeroku_Test {
    @TestSetup
    static void setupTestData() {

        // Create test data for your batch job, if required
        Contact con = TestDataFactory.createCommunityUserContact();
        TestDataFactory.createHerokuAuthMetadata();
        

    }
    
    @IsTest
    static void testBatchJob() {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());

        Test.startTest();
        // Instantiate the batch class
        BatchToSyncAccConRelHeroku batchJob = new BatchToSyncAccConRelHeroku();
        
        // Start the batch job
        Database.executeBatch(batchJob);
        Test.stopTest();
        
        // Retrieve the updated investments
        List<AccountContactRelation> accConRelList = [SELECT Id, Heroku_Synced__c FROM AccountContactRelation];
      
        // Assert that the Heroku_Synced__c field is set to true for the updated investments
        for (AccountContactRelation accConRel : accConRelList) {
            System.assertEquals(true, accConRel.Heroku_Synced__c);
        }
    }
}