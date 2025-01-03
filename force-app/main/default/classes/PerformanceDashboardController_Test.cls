@isTest
public with sharing class PerformanceDashboardController_Test {
    @testSetup
    public static void createTestData() {
        TestDataFactory.createAccount();
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];
        Investment_Strategy__c is = new Investment_Strategy__c();
        is.Name = 'Test Inv Strategy 1';
        is.Investment_Strategy_Verified__c = true;
        is.Account__c = acc.id;
        insert is;
        Performance__c invStr = new Performance__c();
        invStr.Name = 'Test Perf Strategy';
        invStr.Investment_Strategy__c = is.Id;
        invStr.Account__c = acc.id;
        invStr.RecordTypeId = Schema.SObjectType.Performance__c.getRecordTypeInfosByDeveloperName().get('Private_Fund').getRecordTypeId();
        insert invStr;
        Performance__c invStr2 = new Performance__c();
        invStr2.Name = 'Test Perf Strategy2';
        invStr2.Investment_Strategy__c = is.Id;
        invStr2.Account__c = acc.id;
        invStr2.RecordTypeId = Schema.SObjectType.Performance__c.getRecordTypeInfosByDeveloperName().get('Private_Fund').getRecordTypeId();
        insert invStr2;
        
        Performance__c invStr3 = new Performance__c();
        invStr3.Name = 'Test Hedge Fund';
        invStr3.Investment_Strategy__c = is.Id;
        invStr3.Account__c = acc.id;
        invStr3.Asset_Class_picklist__c = 'Hedge Fund';
        invStr3.RecordTypeId = Schema.SObjectType.Performance__c.getRecordTypeInfosByDeveloperName().get('Hedge_Fund').getRecordTypeId();
        insert invStr3;
    }

    @isTest
    public static void testFetchPerformanceRecords() {
        List<Performance__c> result = PerformanceDashboardController.fetchPerformanceRecords('', new List<String>(), new List<String>(), new List<String>(), 'Performance_AUM__c', 'desc', 'LAST', 20, 0);
        Integer count = PerformanceDashboardController.fetchPerformanceRecordsCount('Test', new List<String>(), new List<String>(), new List<String>());
        List<Performance__c> result2 = PerformanceDashboardController.fetchPerformanceRecords('Test',  new List<String>(), new List<String>(), new List<String>(), 'Performance_AUM__c', 'desc', 'LAST', 20, 0);
        // PerformanceDashboardController.HedgeFundData result3 = PerformanceDashboardController.fetchHedgeFundRecords('', 'Provided_Mgmt__c', 'desc', 'LAST', 20, 0);
        // PerformanceDashboardController.HedgeFundData result4 = PerformanceDashboardController.fetchHedgeFundRecords('Test Hedge Fund', 'Provided_Mgmt__c', 'desc', 'LAST', 20, 0);
        // Integer count2 = PerformanceDashboardController.fetchHedgeFundRecordsCount('');
        // System.assertNotEquals(count2, 0);
        System.assertEquals(result.size() > 0, true);
        System.assertEquals(result2.size() > 0, true);
        System.assertEquals(count > 0, true);
    }
}