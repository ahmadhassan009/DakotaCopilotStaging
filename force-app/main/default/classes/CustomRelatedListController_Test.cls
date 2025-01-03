@isTest
public with sharing class CustomRelatedListController_Test {
    @testSetup
    public static void createTestData()
    {
        Account acc = TestDataFactory.createAccount();
        TestDataFactory.createInvestmentRecord(acc.Id);
    }
    
    @isTest
    public static void testGetRecordCountViewAll()
    { 
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];        
        System.assertEquals(1, CustomRelatedListController.getRecordCountViewAll(acc.Id, 'Investment__c','Account__c'));
    }
    
    @isTest
    public static void testGetRecordViewAll()
    { 
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];        
        System.assertEquals(true, CustomRelatedListController.getRecordViewAll(acc.Id,'Id,Name', 'Investment__c','Account__c','name','asc',10,0,'LAST')!=null);
    }

    @isTest
    public static void testGetRecordName()
    { 
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];        
        System.assertEquals(true, CustomRelatedListController.getRecordName(acc.Id)!=null);
    }
}