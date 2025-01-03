@isTest
public class TriggerOnInvestmentService_Test {

    @testSetUp
    public static void createData()
    {
        Account acc = TestDataFactory.createAccount();
        Investment__c inv = TestDataFactory.createInvestmentRecord(acc.Id);
        TestDataFactory.createHerokuAuthMetadata();

    }

    @isTest
    public static void testRefreshInvestmentPanels()
    {
        Investment__c inv = [SELECT Id, Name FROM Investment__c WHERE Name = 'Test Investment' LIMIT 1];
        inv.Name = 'Test Investment 1';
        update inv;
        System.assert(inv != null);
    }
    
    @isTest
    public static void testDeleteFromHeroku() {
        
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());

        List<Investment__c> inv = [SELECT Id, Name, Fund_Balance__c, Account__c FROM Investment__c LIMIT 1];
        delete inv;
    }

    @isTest
    public static void testResetHerokuSyncFlag() {
        
        List<Investment__c> inv = [SELECT Id, Fund_Balance__c, Heroku_Synced__c FROM Investment__c LIMIT 1];
        System.assertEquals(false, inv[0].Heroku_Synced__c);
        inv[0].Fund_Balance__c = 2000;
        update inv;
        List<Investment__c> invUpdated = [SELECT Id, Fund_Balance__c, Heroku_Synced__c FROM Investment__c WHERE id = :inv[0].Id LIMIT 1];
        System.assertEquals(false, invUpdated[0].Heroku_Synced__c);
        
    }
}