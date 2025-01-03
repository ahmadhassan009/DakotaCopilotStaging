@isTest
public class SchedulerToDeleteActivityStream_Test {
    
    @testSetUp
    public static void CreateTestData()
    {
        Account account = new Account();
        account.Name = 'Test Account';
        insert account;
        
        List<Update__c> activityStreamRecords = new List<Update__c>();
        for(integer i=0;i<5;i++)
        {
            Update__c activityStream = new Update__c();
            activityStream.Account__c = account.Id;
            activityStreamRecords.add(activityStream);
        }
        
        Contact contact = new Contact();
        contact.LastName = 'Test Contact';
        insert contact;
        
        for(integer i=0;i<5;i++)
        {
            Update__c activityStream = new Update__c();
            activityStream.Contact__c = contact.Id;
            activityStreamRecords.add(activityStream);
        }
        insert activityStreamRecords;
        
        Marketplace_Searches__c searchRecord = new Marketplace_Searches__c();
        searchRecord.Name = 'Test Search';
        searchRecord.Search_Status__c = 'Open';
        searchRecord.End_Date__c = System.now().Date().addDays(-1);
        insert searchRecord;
    }
    
    @isTest
    public static void testDeleteJunkUpdatesRecords()
    {
        List<Update__c> activityStreamRecords = [Select Id from Update__c];
        System.assert(activityStreamRecords.size() > 0);
        
        List<Account> accounts = [Select Id,Name from Account where Name = 'Test Account'];
        delete accounts;
        
        List<Contact> contacts = [Select Id,LastName from Contact where LastName = 'Test Contact'];
        delete contacts;
        
        activityStreamRecords = [Select Id from Update__c];
        System.assert(activityStreamRecords.size() > 0);
        
        System.Test.startTest();
        SchedulerToDeleteActivityStream sh1 = new SchedulerToDeleteActivityStream();      
        String sch = '0 0 23 * * ?';
        system.schedule('Test check', sch, sh1);
        System.Test.stopTest();
        
        activityStreamRecords = [Select Id from Update__c];
        System.assert(activityStreamRecords.size() == 0);
    }
    
    @isTest
    public static void testUpdateMarketplaceSearchStatus()
    {
        Marketplace_Searches__c searchRecord = [Select Id,Name,Search_Status__c from Marketplace_Searches__c limit 1];
        System.assertEquals('Open', searchRecord.Search_Status__c);
        
        System.Test.startTest();
        SchedulerToDeleteActivityStream sh1 = new SchedulerToDeleteActivityStream();      
        String sch = '0 0 23 * * ?';
        system.schedule('Test check', sch, sh1);
        System.Test.stopTest();
        
        searchRecord = [Select Id,Name,Search_Status__c from Marketplace_Searches__c limit 1];
        System.assertEquals('Archived', searchRecord.Search_Status__c);
    }
    
}