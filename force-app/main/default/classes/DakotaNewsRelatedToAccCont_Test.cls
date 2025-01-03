@isTest
public class DakotaNewsRelatedToAccCont_Test {
    @TestSetup
    public static void createTestData() {
        Account acc = TestDataFactory.createAccount();
        TestDataFactory.createDakotaNewsRecords();
    }

    @isTest
    public static void testGetDakotaNewsRecordCount() {
        Account acct = [ SELECT Id,Name FROM Account WHERE Name = 'Test Acc' Limit 1 ];
        System.assertEquals(5, DakotaNewsRelatedToAccountController.getDakotaNewsRecordCount(acct.Id));
    }

    @isTest
    public static void testGetDakotaNewsRecords() {
        Account acct = [SELECT Id,Name FROM Account WHERE Name = 'Test Acc' Limit 1 ];
        List<Dakota_News__c> newsList = DakotaNewsRelatedToAccountController.getDakotaNewsRecords(acct.Id, 'Name', 'ASC', 10, 0, 'LAST');
        System.assertEquals(5, newsList.size());
    }
}