@isTest
public with sharing class InvestmentHoldingsController_Test {
    @testSetup
    public static void createTestData()
    {
        Account acc = TestDataFactory.createAccount();
        TestDataFactory.createInvestmentHoldingsRecords(acc.Id);
    }
    
    @isTest
    public static void testGetRecordsTypeIds()
    { 
        
        System.assertEquals(true, InvestmentHoldingsController.getRecordsTypeIds()!=null);
    }
    
    @isTest
    public static void testGetInvestmentHoldingsRecords()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];
        Map<String, Schema.RecordTypeInfo> investmentholdingRecTypes = Schema.getGlobalDescribe().get('Investment_Holdings__c').getDescribe().getRecordTypeInfosByDeveloperName();
        Id recordTypeId = investmentholdingRecTypes.get('Alternative_Holdings').getRecordTypeId(); 
        List<Investment_Holdings__c> returnedResult = InvestmentHoldingsController.getInvestmentHoldingsRecords(acc.Id,String.valueOf(recordTypeId), 'Name', 'desc','LAST');
        System.assertEquals(5, returnedResult.size());
    }

    @isTest
    public static void testGetInvestmentHoldingsRecordsViewAll()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc']; 
        Map<String, Schema.RecordTypeInfo> investmentholdingRecTypes = Schema.getGlobalDescribe().get('Investment_Holdings__c').getDescribe().getRecordTypeInfosByDeveloperName();
        Id recordTypeId = investmentholdingRecTypes.get('Alternative_Holdings').getRecordTypeId();
        List<Investment_Holdings__c> returnedResult = InvestmentHoldingsController.getInvestmentHoldingsRecordsViewAll(acc.Id,String.valueOf(recordTypeId), 'Name', 'desc',50,0,'LAST');
        System.assertEquals(5, returnedResult.size());
    }

    @isTest
    public static void testGetRecordsCount()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];
        Map<String, Schema.RecordTypeInfo> investmentholdingRecTypes = Schema.getGlobalDescribe().get('Investment_Holdings__c').getDescribe().getRecordTypeInfosByDeveloperName();
        Id recordTypeId = investmentholdingRecTypes.get('Alternative_Holdings').getRecordTypeId();
        Integer count = InvestmentHoldingsController.getRecordsCount(acc.Id,String.valueOf(recordTypeId));
        System.assertEquals(5, count);
    }

    @isTest
    public static void testGetRecordTypeCounts()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];
        System.assertEquals(true, InvestmentHoldingsController.getRecordTypeCounts(acc.Id)!=null);
    }
}