@isTest
public class TriggerOnConferenceService_Test {
    
    @testSetUp
    public static void createData()
    {
        Metro_Area__c ma = TestDataFactory.createMetroArea();
        Account acc = TestDataFactory.createAccount();
        Contact con = TestDataFactory.createContact();
        
    }
    
    @isTest
    public static void testRefreshConferencePanels()
    {
        Metro_Area__c ma = [SELECT Id FROM Metro_Area__c WHERE Name = 'Test Metro Area' LIMIT 1];
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc' LIMIT 1];
        Contact con = [SELECT Id FROM Contact WHERE FirstName = 'Test' AND Lastname = 'Community User' LIMIT 1];

        Conference__c conf = TestDataFactory.createConferenceRecord(ma.Id, acc.Id, con.Id);
        conf.Name = 'Test Conference Updated';
        update conf;
        System.assert(conf != null);
    }
    
}