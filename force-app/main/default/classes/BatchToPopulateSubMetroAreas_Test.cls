@isTest
public class BatchToPopulateSubMetroAreas_Test {

    @testSetUp
    public static void createData()
    {
        Metro_Area__c accountMetroArea = new Metro_Area__c();
        accountMetroArea.Name = 'Test Account MetroArea';
        insert accountMetroArea;
        
        Metro_Area__c contactMetroArea = new Metro_Area__c();
        contactMetroArea.Name = 'Test Account MetroArea';
        insert contactMetroArea;
        
        Account acct = new Account();
        acct.Name = 'Test Account';
        acct.X100_Marketplace__c = true;
        acct.MetroArea__c = accountMetroArea.Id;
        insert acct;
        
        List<Contact> contacts = new List<Contact>();
        for(integer i=0 ; i<50; i++)
        {
            Contact cnct = new Contact();
            cnct.LastName = 'Test Contact '+i;
            cnct.AccountId = acct.Id;
            cnct.Marketplace_Verified_Contact__c = true;
            cnct.Metro_Area__c = contactMetroArea.Id;
            contacts.add(cnct);
        }
        insert contacts;
    }
    
    @isTest
    public static void testBatchToPopulateSubMetroAreas()
    {
        Account acct = [Select Id,Name from Account where Name = 'Test Account' Limit 1];
        Test.startTest();
        BatchToPopulateSubMetroAreas btch = new BatchToPopulateSubMetroAreas('\''+acct.Id+'\'');
        Database.executeBatch(btch, 1);
        Test.stopTest();
    }
}