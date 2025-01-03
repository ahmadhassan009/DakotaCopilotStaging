@isTest
public class SchedulerToUpdateSearchesStatus_Test {
    
    @testSetUp
    public static void CreateTestData()
    {

        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
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
        searchRecord.End_Date__c = System.now().Date().addDays(-2);
        searchRecord.Account__c = account.Id;
        insert searchRecord;

        Heroku_Credentials__c cs = New Heroku_Credentials__c();
        cs.Name = 'Authentication_Credentials';
        cs.Access_Token__c = '7mmWMaIKs2Cxvsiff7SX3SwLn/POtlHdhb+BB/9jtopu2w68Sw1Wf4Zq6a3GVfxeS/F8C6WcwyBg8NRRi+N/5w==';
        cs.Authentication_Key__c= 'lrGY/02l8WrqQftXLdFV3Q==';
        cs.Heroku_URL__c= 'https://marketplace-dakota-dev.herokuapp.com';
        cs.Expiry_Date__c= Datetime.now();
        cs.Password__c= 'zgDN+dXLx5wpSA9aJDFZOX1K6QEzkrU9c3RvNfxwAo0=';
        cs.Username__c= 'qa';
        insert cs;
    }
  
    
    @isTest
    public static void testUpdateMarketplaceSearchStatus()
    {
        Marketplace_Searches__c searchRecord = [Select Id,Name,Search_Status__c from Marketplace_Searches__c limit 1];
        System.assertEquals('Open', searchRecord.Search_Status__c);
        
        System.Test.startTest();
        SchedulerToUpdateSearchesStatus sc = new SchedulerToUpdateSearchesStatus();
        sc.execute(null); 
        System.Test.stopTest();
        
        searchRecord = [Select Id,Name,Search_Status__c from Marketplace_Searches__c limit 1];
        System.assertEquals('Archived', searchRecord.Search_Status__c);
    }
    
}