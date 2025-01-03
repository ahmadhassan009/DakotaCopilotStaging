@isTest 
public class PublicPlanMinutesInAccountsCont_Test {
    @testSetup
    public static void createTestData()
    {
        Account acc = new Account();
        acc.Name = 'Test Acc';
        insert acc;
        
        Public_Plan_Minute__c publicPlanMinute = new Public_Plan_Minute__c();
        publicPlanMinute.Name = 'Test Public Plan Minute';
        publicPlanMinute.Account__c = acc.id;
        insert publicPlanMinute;
    }
    
    @isTest
    public static void testGetRecords()
    {
        System.assertEquals(1, PublicPlanMinutesInAccountsController.getRecords([SELECT Id FROM Account LIMIT 1].Id, 'Id', 'asc', 'FIRST',10,0).size());
    }
    
    @isTest
    public static void testGetRecordsCount()
    {
        System.assertEquals(1,PublicPlanMinutesInAccountsController.getRecordsCount([SELECT Id FROM Account LIMIT 1].Id));
    }
    
    @isTest
    public static void testGetRecordsRelatedAccountName()
    {
        System.assertEquals('Test Acc',PublicPlanMinutesInAccountsController.getRecordsRelatedAccountName([SELECT Id FROM Account LIMIT 1].Id));
    }
}