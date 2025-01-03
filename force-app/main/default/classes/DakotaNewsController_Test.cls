@isTest
public class DakotaNewsController_Test {

    @testSetup
    public static void createTestData()
    {
        TestDataFactory.createAccount();
        TestDataFactory.createDakotaNewsRecords();
    }
    
    @isTest
    public static void testgetRecords()
    {
        List<Dakota_News__c> returnedResultt = DakotaNewsController.getRecords('test','Publish_Date__c','desc');
        System.assertEquals(5,returnedResultt.size());
        List<Dakota_News__c> returnedResultViewAll = DakotaNewsController.getRecordsViewAll('test','Publish_Date__c','desc');
        System.assertEquals(5,returnedResultViewAll.size());
        Integer countt = DakotaNewsController.getRecordsCount('test');
        System.assertEquals(5,countt);
    }

}