@IsTest
public with sharing class BatchToSyncFormD_Test {
    @TestSetup
    static void setupTestData() {
        FormDSyncedDate__c cs = New FormDSyncedDate__c();
        cs.Name = 'StartDate';
        cs.StartDate__c =  '2022-02-01';
        insert cs;
    }
    
    @IsTest
    static void testBatchJob() {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());       
        
        Test.startTest();
        BatchToSyncFormD batchJob = new BatchToSyncFormD(0,false);
        Database.executeBatch(batchJob);
        Test.stopTest();
    }
}