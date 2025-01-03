@isTest
public with sharing class BatchToUpdateHerokuSyncField_test {
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
            activityStream.Heroku_Synced__c = true ;
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
    static void testBatchable() {

        // Initialize the batch class
        BatchToUpdateHerokuSyncField batch = new BatchToUpdateHerokuSyncField();

        // Call the batchable process
        Test.startTest();
        Database.executeBatch(batch);
        Test.stopTest();

    }
}