@isTest
public with sharing class EducationRelatedToAccountController_Test {
    @testSetup
    public static void createTestData()
    {
        Account acc = TestDataFactory.createAccount();
        Contact cont = TestDataFactory.createContact();
        TestDataFactory.createEducationRecordForAccount(acc.Id, cont.Id);
    }
    
    @isTest
    public static void testGetEducationRecords()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc']; 
        List<Education__c> returnedResult = EducationRelatedToAccountController.getEducationRecords(acc.Id, 'Name', 'desc','LAST');
        System.assertEquals(5, returnedResult.size());
    }

    @isTest
    public static void testGetEducationRecordsViewAll()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc']; 
        List<Education__c> returnedResult = EducationRelatedToAccountController.getEducationRecordsViewAll(acc.Id, 'Name', 'desc',50,0,'LAST');
        System.assertEquals(5, returnedResult.size());
    }

    @isTest
    public static void testGetRecordsCount()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];
        Integer count = EducationRelatedToAccountController.getRecordsCount(acc.Id);
        System.assertEquals(5, count);
    }

    @isTest
    public static void testGetRecordsAccName()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];
        Account accName = EducationRelatedToAccountController.getAccountName(acc.Id);
        System.assertEquals('Test Acc', accName.Name);
    }
}