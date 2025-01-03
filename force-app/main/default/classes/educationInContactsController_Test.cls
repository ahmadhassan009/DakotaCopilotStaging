@isTest
public class educationInContactsController_Test {

    @testSetup
    public static void createTestData()
    {
        Account acc=TestDataFactory.createAccount();
        Contact cont=TestDataFactory.createContact();
        TestDataFactory.createEducationRecord(cont.Id);
    }
    
    @isTest
    public static void testGetEducationRecords()
    {
        Contact cont=[select Id FROM Contact WHERE Lastname = 'Community User']; 
        List<Education__c> returnedResult = educationInContactsController.getEducationRecords(cont.Id,'Name','desc','LAST');
        System.assertEquals(5,returnedResult.size());
        
    }

    @isTest
    public static void testGetRecordsCount()
    {
        Contact cont=[select Id FROM Contact WHERE Lastname = 'Community User']; 
        Integer count = educationInContactsController.getRecordsCount(cont.Id);
        System.assertEquals(5,count);
    }
}