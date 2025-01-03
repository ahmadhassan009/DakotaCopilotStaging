@isTest
public class jobAndRoleChangesController_Test {

    @testSetUp
    public static void createTestData() {
        Account acc = TestDataFactory.createAccount();
        Account joinded = TestDataFactory.createDynamicAccount('test update');
        Contact cont = TestDataFactory.createContact();
        TestDataFactory.createUpdateRecords(acc.Id,joinded.Id,cont.Id);
    }

    @isTest
    public static void testGetJobRecordsCount() {
        
        System.assertEquals(5, jobAndRoleChangesController.getJobRecordsCount('test'));
    }
   
    @isTest
    public static void testGetJobChanges() {
        
        System.assertEquals(5, jobAndRoleChangesController.getJobChanges('test','Last_Updated_Date__c','desc',5,0,'LAST').size());
    }

    @isTest
    public static void testGetRoleRecordsCount() {
        
        System.assertEquals(5, jobAndRoleChangesController.getRoleRecordsCount('test'));
    }
   
    @isTest
    public static void testGetRoleChanges() {
        
        System.assertEquals(5, jobAndRoleChangesController.getRoleChanges('test','Last_Updated_Date__c','desc',5,0,'LAST').size());
    }
}