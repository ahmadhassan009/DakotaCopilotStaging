@isTest
public class Form5500SearchController_Test {
    @testSetup
    public static void createTestData()
    {
        TestDataFactory.createAccount();
    }
    
    @isTest
    public static void testGetCurrentRecordEin()
    {
        Account acc=[select Id FROM account WHERE name = 'Test Acc']; 
        Account returnedResult = Form5500SearchController.getCurrentRecordEin(acc.Id);
        System.assertEquals(returnedResult!=null,true);
        
    }
}