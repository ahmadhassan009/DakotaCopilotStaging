@isTest
public with sharing class SchedulerToUpdateInvestmentCounts_Test {
    
    @TestSetup
    static void setupTestData() {
        Account acc = TestDataFactory.createAccount();
        TestDataFactory.createInvestmentRecord(acc.Id);
        
        Investment_Counts__c cs = New Investment_Counts__c();
        cs.Name = 'Investment Record Counts';
        cs.Public_Investment_Count__c = 1;
        cs.X13F_Fillings_Investment_Count__c = 1;
        insert cs;
    }

    @isTest
    static void testSchedulerToUpdateInvestmentCounts() {
        Test.startTest();
        SchedulerToUpdateInvestmentCounts sc = new SchedulerToUpdateInvestmentCounts();
        sc.execute(null);        
        Test.stopTest();
    }
}