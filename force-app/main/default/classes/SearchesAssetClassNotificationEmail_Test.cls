@isTest
public class SearchesAssetClassNotificationEmail_Test {
    
    @testSetup
    public static void createTestData()
    {
        Account acct = new Account();
        acct.Name = 'Test Account';
        acct.Search_Asset_Class__c = 'Emerging Market Equities';
        insert acct;
        
        List<Contact> contacts = new List<Contact>();
        for(integer i=0;i<10;i++)
        {
            Contact cnct = new Contact();
            cnct.Email = 'testemail@gmail.com';
            cnct.FirstName = 'Test';
            cnct.LastName = 'Contact '+i;
            cnct.AccountId = acct.Id;
            cnct.Searches_Email__c = true;
            cnct.Searches_Asset_Class__c = 'Private Credit';
            contacts.add(cnct);
        }
        insert contacts;
        
        Marketplace_Searches__c searchRecord = new Marketplace_Searches__c();
        searchRecord.Name = 'Test Search';
        searchRecord.Asset_Class__c = 'Private Credit';
        searchRecord.Amount__c = 500;
        searchRecord.End_Date__c = System.now().Date();
        searchRecord.Contact__c = contacts[0].Id;
        searchRecord.Description__c = 'Test Description';
        searchRecord.Asset_Class__c = 'Global Equities';
        searchRecord.Search_URL__c = 'www.google.com';
        searchRecord.Requirements__c = '<p>Test Requirements</p>';
        searchRecord.Additional_Information__c = '<p>Test Additional Information</p>';
        searchRecord.Pacing_Information__c = '<p>Test Pacing Information</p>';
        searchRecord.Search_Status__c = 'Pacing';
        
        insert searchRecord;
        Marketplace_Searches__c searchRecordPacing = new Marketplace_Searches__c();
        searchRecordPacing.Name = 'Test Search Pacing';
        searchRecordPacing.Asset_Class__c = 'Private Credit';
        searchRecordPacing.Amount__c = 500;
        searchRecordPacing.End_Date__c = System.now().Date();
        searchRecordPacing.Contact__c = contacts[0].Id;
        searchRecordPacing.Description__c = 'Test Description';
        searchRecordPacing.Search_URL__c = 'www.google.com';
        searchRecordPacing.Asset_Class__c = 'Global Equities';
        searchRecordPacing.Sub_Asset_Class__c = 'Global Equity;Global Equity Income';
        searchRecordPacing.Requirements__c = '<p>Test Requirements</p>';
        searchRecordPacing.Additional_Information__c = '<p>Test Additional Information</p>';
        searchRecordPacing.Pacing_Information__c = '<p>Test Pacing Information</p>';
        
        insert searchRecordPacing;
    }
    
    @isTest
    public static void testSendSearchesAssetClassEmail()
    {
        Marketplace_Searches__c searchRecord = [Select Id,Name,Asset_Class__c,Account__c,Account__r.Name,Consultant__c,Consultant__r.Name,Contact__c,Contact__r.Name,Contact__r.Account.Name,
                                                Description__c,End_Date__c,Amount__c,Sub_Asset_Class__c,Search_URL__c,Search_Status__c,Requirements__c,Additional_Information__c,Pacing_Information__c from Marketplace_Searches__c WHERE Name = 'Test Search' limit 1];
        List<Contact> contacts = [Select Id,FirstName,Searches_Asset_Class__c,Email from Contact where Searches_Email__c = true];
        
        SearchesAssetClassNotificationEmail.sendSearchesAssetClassEmail(contacts,searchRecord);
        System.assert(Limits.getEmailInvocations() > 0);
        
        List<Task> tasksCreated = [Select Id,Subject from Task where WhatId = :searchRecord.Id];
        System.assert(tasksCreated.size() > 0);
    }
    @isTest
    public static void testSendSearchesAssetClassEmailPacing()
    {
        Marketplace_Searches__c searchRecord = [Select Id,Name,Asset_Class__c,Account__c,Account__r.Name,Consultant__c,Consultant__r.Name,Contact__c,Contact__r.Name,Contact__r.Account.Name,
                                                Description__c,End_Date__c,Amount__c,Sub_Asset_Class__c,Search_URL__c,Search_Status__c,Requirements__c,Additional_Information__c,Pacing_Information__c from Marketplace_Searches__c WHERE Name = 'Test Search Pacing' limit 1];
        List<Contact> contacts = [Select Id,FirstName,Searches_Asset_Class__c,Email from Contact where Searches_Email__c = true];
        
        SearchesAssetClassNotificationEmail.sendSearchesAssetClassEmail(contacts,searchRecord);
        System.assert(Limits.getEmailInvocations() > 0);
        
        List<Task> tasksCreated = [Select Id,Subject from Task where WhatId = :searchRecord.Id];
        System.assert(tasksCreated.size() > 0);
    }
}