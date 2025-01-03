@IsTest
public with sharing class BatchSyncFundServiceProviderHeroku_Test {
    @TestSetup
    static void setupTestData() {
        // Create test data for your batch job, if required
        Account acc = TestDataFactory.createAccount();
        Account acct = new Account();
        acct.Name = 'Test Account';
        insert acct;
        
        Account acct2 = new Account();
        acct2.Name = 'Test Account 2';
        insert acct2;
        //TestDataFactory.createFundServiceProviderReocrd(acc.Id);
        Fund_Service_Provider__c fundServProvider = new Fund_Service_Provider__c();
        fundServProvider.Name = 'Test Fund Serv Provider';
        fundServProvider.Service_Provider_Account__c = acct.Id;
        fundServProvider.Account__c = acct2.Id;
        insert fundServProvider;
        TestDataFactory.createHerokuAuthMetadata();
    }
    
    @IsTest
    static void testBatchJob() {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        // Create test records to be processed by the batch job
        List<Fund_Service_Provider__c> testFundServiceProviders = new List<Fund_Service_Provider__c>{[SELECT Id, Heroku_Synced__c FROM Fund_Service_Provider__c Limit 1]};
        if(testFundServiceProviders != null && testFundServiceProviders.size() > 0){
            testFundServiceProviders[0].Heroku_Synced__c = false;
            update testFundServiceProviders;
        }
        // Add test Fund Service Providers to the list
        
        Test.startTest();
        // Instantiate the batch class
        BatchToSyncFundServiceProvidersInHeroku batchJob = new BatchToSyncFundServiceProvidersInHeroku();
        
        // Start the batch job
        Database.executeBatch(batchJob);
        Test.stopTest();
        
        // Perform assertions to verify the batch job's behavior
        // For example, check if the FundServiceProviders were updated correctly
        
        // Retrieve the updated Fund Service Providers
        List<Fund_Service_Provider__c> updatedFundServiceProviders = [SELECT Id, Heroku_Synced__c FROM Fund_Service_Provider__c];
        
        // Assert that the Heroku_Synced__c field is set to true for the updated investments
        for (Fund_Service_Provider__c fundServiceProvider : updatedFundServiceProviders) {
            System.assertEquals(true, fundServiceProvider.Heroku_Synced__c);
        }
    }
}