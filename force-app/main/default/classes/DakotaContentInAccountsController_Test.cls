@isTest 
public class DakotaContentInAccountsController_Test {
    @testSetup
    public static void createTestData()
    {
        Account acc = new Account();
        acc.Name = 'Test Acc';
        insert acc;
        
        Dakota_Content__c dakotaContent = new Dakota_Content__c();
        dakotaContent.Name = 'Test DC';
        dakotaContent.Account_Linked__c = acc.id;
        insert dakotaContent;
    }
    
    @isTest
    public static void testGetRecords()
    {
        System.assertEquals(1, DakotaContentInAccountsController.getRecords([SELECT Id FROM Account LIMIT 1].Id, 'Date__c', 'desc', 'LAST').size());
    }
    
    @isTest
    public static void testGetRecordsCount()
    {
        System.assertEquals(1,DakotaContentInAccountsController.getRecordsCount([SELECT Id FROM Account LIMIT 1].Id));
    }
}