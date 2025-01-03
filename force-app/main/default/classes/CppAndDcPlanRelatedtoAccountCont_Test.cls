@isTest
public with sharing class CppAndDcPlanRelatedtoAccountCont_Test {

    @testSetup
    public static void createTestData()
    {
        Account acc = new Account();
        acc.Name = 'Test Acc';
        acc.Type = 'Corporation';
        insert acc;
        
        Account acc2 = new Account();
        acc2.Name = 'Test Acc2';
        acc2.Retirement_Plan__c = acc.Id;
        acc2.Type = 'DC Plan';
        insert acc2;
    }

    @isTest
    public static void testGetAccountType()
    {
        Account acc = CppAndDcPlanRelatedtoAccountController.getAccountType([SELECT Id FROM Account WHERE Name = 'Test Acc' LIMIT 1].Id);
        System.assertEquals('Corporation', acc.Type);
    }
    
    @isTest
    public static void testGetRecords()
    {
        System.assertEquals(1, CppAndDcPlanRelatedtoAccountController.getCppAndDcPlanAccounts([SELECT Id FROM Account LIMIT 1].Id, 'Id', 'asc', 'FIRST').size());
    }
    
    @isTest
    public static void testGetRecordsCount()
    {
        System.assertEquals(1, CppAndDcPlanRelatedtoAccountController.getCppAndDcPlanAccountsCount([SELECT Id FROM Account LIMIT 1].Id));
    }
}