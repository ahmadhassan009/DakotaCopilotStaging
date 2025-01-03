@isTest 
public class ChildAccountsInAccountsController_Test {
    @testSetup
    public static void createTestData()
    {
        Account acc = new Account();
        acc.Name = 'Test Acc';
        insert acc;
        
        Account acc2 = new Account();
        acc2.Name = 'Test Acc2';
        acc2.Parent_Account__c = acc.Id;
        acc2.TAMP__c = acc.Id;
        insert acc2;
    }
    
    @isTest
    public static void testGetRecords()
    {
        System.assertEquals(1, ChildAccountsInAccountsController.getAccounts([SELECT Id FROM Account LIMIT 1].Id, 'TAMP', 'Id', 'asc', 'FIRST').size());
        System.assertEquals(1, ChildAccountsInAccountsController.getAccounts([SELECT Id FROM Account LIMIT 1].Id, 'Child', 'Id', 'asc', 'FIRST').size());
    }
    
    @isTest
    public static void testGetRecordsCount()
    {
        System.assertEquals(1, ChildAccountsInAccountsController.getAccountsCount([SELECT Id FROM Account LIMIT 1].Id, 'TAMP'));
        System.assertEquals(1, ChildAccountsInAccountsController.getAccountsCount([SELECT Id FROM Account LIMIT 1].Id, 'Child'));
    }
    @isTest
    public static void testGetFaTeamsAccountsCount()
    {
        System.assertEquals(0, ChildAccountsInAccountsController.getFaTeamsAccountsCount([SELECT Id FROM Account LIMIT 1].Id));
    }
    @isTest
    public static void testGetFaTeamsAccounts()
    {
        System.assertEquals(0, ChildAccountsInAccountsController.getFaTeamsAccounts([SELECT Id FROM Account LIMIT 1].Id, 'Id', 'asc', 'FIRST').size());
    }
    
    @isTest
    public static void testGetFaTeamsAllAccounts()
    {
        System.assertEquals(0, ChildAccountsInAccountsController.getFaTeamsAllAccounts([SELECT Id FROM Account LIMIT 1].Id, 'Id', 'asc', 'FIRST','50','0').size());
    }
    
    @isTest
    public static void testGetFaTeamsAllChildAccounts()
    {
        System.assertEquals(1, ChildAccountsInAccountsController.getFaTeamsAllChildAccounts([SELECT Id FROM Account LIMIT 1].Id, 'Id', 'asc', 'FIRST','50','0').size());
    }
}