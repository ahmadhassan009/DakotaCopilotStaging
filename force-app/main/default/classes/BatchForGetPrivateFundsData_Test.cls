@IsTest
public with sharing class BatchForGetPrivateFundsData_Test {
    @TestSetup
    static void setupTestData() {
        Form_ADV__c cs = New Form_ADV__c();
        cs.form_ADV_Private_Fund_Flag__c = false;
        cs.CRD_No__c =  '12345';
        insert cs;
    }
    
    @IsTest
    static void testBatchJob() {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());       
        
        Test.startTest();
        BatchForGetPrivateFundsData batchJob = new BatchForGetPrivateFundsData();
        Database.executeBatch(batchJob);
        Test.stopTest();
    }
}