@IsTest
public with sharing class BatchToSyncInvestmentFundInHeroku_Test {
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
        Investment_Funds__c invFund = new Investment_Funds__c(
            Name = 'Test Investment Funds',
            Account__c = acct.Id
        );
        insert invFund;
        TestDataFactory.createHerokuAuthMetadata();
    }
    
    @IsTest
    static void testBatchJob() {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        // Create test records to be processed by the batch job
        List<Investment_Funds__c> testInvestmentFunds = new List<Investment_Funds__c>{[SELECT Id, Heroku_Synced__c FROM Investment_Funds__c Limit 1]};
        if(testInvestmentFunds != null && testInvestmentFunds.size() > 0){
            testInvestmentFunds[0].Heroku_Synced__c = false;
           update testInvestmentFunds;
        }
        // Add test Investment Funds to the list
        
        Test.startTest();
        // Instantiate the batch class
        BatchToSyncInvestmentFundsInHeroku batchJob = new BatchToSyncInvestmentFundsInHeroku();
        
        // Start the batch job
        Database.executeBatch(batchJob);
        Test.stopTest();
        
        // Perform assertions to verify the batch job's behavior
        // For example, check if the InvestmentFundss were updated correctly
        
        // Retrieve the updated Investment Funds
        List<Investment_Funds__c> updatedInvestmentFunds = [SELECT Id, Heroku_Synced__c FROM Investment_Funds__c];
        
        // Assert that the Heroku_Synced__c field is set to true for the updated investments
        for (Investment_Funds__c investmentFunds : updatedInvestmentFunds) {
            System.assertEquals(true, investmentFunds.Heroku_Synced__c);
        }
    }
}