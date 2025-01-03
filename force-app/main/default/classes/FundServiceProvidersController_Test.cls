@isTest
public class FundServiceProvidersController_Test {

    @testSetup
    public static void createTestData()
    {
        Account acc=TestDataFactory.createAccount();
        TestDataFactory.createServiceProviderRecord(acc.Id);
    }
    
    @isTest
    public static void testGetRecords()
    {
        Account acc=[select Id FROM Account WHERE Name = 'Test Acc']; 
        List<Fund_Service_Provider__c> returnedResult = FundServiceProvidersController.getRecords(acc.Id,'Name','desc','LAST');
        System.assertEquals(5,returnedResult.size());
        
    }

    @isTest
    public static void testGetRecordsCount()
    {
        Account acc=[select Id FROM Account WHERE Name = 'Test Acc']; 
        Integer count = FundServiceProvidersController.getRecordsCount(acc.Id);
        System.assertEquals(5,count);
    }

    @isTest
    public static void testGetAllRecords()
    {
        Account acc=[select Id FROM Account WHERE Name = 'Test Acc']; 
        List<Fund_Service_Provider__c> returnedResult = FundServiceProvidersController.getAllRecords(acc.Id,'Name','desc','20','0','LAST');
        System.assertEquals(5,returnedResult.size());  
    }

    @isTest
    public static void testGetRecordsRelaedAccountName()
    {
        Account acc=[select Id FROM Account WHERE Name = 'Test Acc']; 
        String returnedResult = FundServiceProvidersController.getRecordsRelaedAccountName(acc.Id);
        System.assertEquals('Test Acc',returnedResult);  
    }
}