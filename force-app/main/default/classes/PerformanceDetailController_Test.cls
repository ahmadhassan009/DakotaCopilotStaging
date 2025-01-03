@isTest
public with sharing class PerformanceDetailController_Test {
    @isTest
    public static void testIsSourceSelfReported() {
        Test.startTest();
        Investment_Strategy__c invr = new Investment_Strategy__c();
        invr.Name = 'Test 1';
        insert invr;
        Performance__c invStr = new Performance__c();
        invStr.Name = 'Test Perf Strategy';
        invStr.Investment_Strategy__c = invr.Id;
        insert invStr;
        System.assertEquals(false, PerformanceDetailController.isSourceSelfReported(invStr.Id));
        Test.stopTest();
    }

    @isTest
    public static void testGetlayoutData() {
        Test.startTest();
        Investment_Strategy__c invr = new Investment_Strategy__c();
        invr.Name = 'Test 1';
        invr.Investment_Strategy_Verified__c = true;
        insert invr;
        Performance__c invStr = new Performance__c();
        invStr.Name = 'Test Perf Strategy';
        invStr.Investment_Strategy__c = invr.Id;
        insert invStr;
        Map<String,List<List<String>>> result = PerformanceDetailController.getlayoutData(invStr.Id);
        System.assertEquals(2, result.size());
        Test.stopTest();
    }
}