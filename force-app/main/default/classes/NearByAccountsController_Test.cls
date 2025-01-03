@isTest
public class NearByAccountsController_Test {
    
    @testSetup
    public static void createTestData()
    {
        List<Account> accounts = new List<Account>();
        List<Contact> contacts = new List<Contact>();
        
        for(integer i=0;i<5;i++)
        {
            Account acct = new Account();
            acct.Name = 'Test Account '+i;
            acct.AUM__c = 2000;
            acct.Type = 'Public Pension Fund';
            acct.Website = 'www.google.com';
            acct.BillingLatitude = 40.7518 + i;
            acct.BillingLongitude = -73.9723 + i;
            accounts.add(acct);
        }
        insert accounts;
        
        for(integer i=0;i<5;i++)
        {
            Contact cnct = new Contact();
            cnct.LastName = 'Test Contact '+ i;
            cnct.AccountId = accounts[i].Id;
            cnct.MailingLatitude = 40.7518+i;
            cnct.MailingLongitude = -73.9723+i;
            contacts.add(cnct);
        }
        insert contacts;
    }
    
    @isTest
    public static void testGetCurrentRecordDetailsAccount()
    {
        Account acct = [Select Id,Name,Type from Account where Name = 'Test Account 0'];
        List<NearByAccountsController.NearByRecordsData> currentAccountDetails = NearByAccountsController.getCurrentRecordDetails(acct.Id,'Account');
        System.assertEquals(1, currentAccountDetails.size());
        System.assertEquals(acct.Type, currentAccountDetails[0].AccountType);
    }
    
    @isTest
    public static void testGetCurrentRecordDetailsContact()
    {
        Contact cnct = [Select Id,Name,Account.AUM__c from Contact where Name = 'Test Contact 0'];
        List<NearByAccountsController.NearByRecordsData> currentAccountDetails = NearByAccountsController.getCurrentRecordDetails(cnct.Id,'Contact');
        System.assertEquals(1, currentAccountDetails.size());
        System.assertEquals(cnct.Account.AUM__c, currentAccountDetails[0].AUM);
    }
    
    @isTest
    public static void testGetFieldsToBeDisplayedOnCard()
    {
        List<Fields_On_Map_Card__c> fieldsToBeDisplayed = NearByAccountsController.getFieldsToBeDisplayedOnCard();
    }
    
    @isTest
    public static void testGetNearByAccounts()
    {
        Account accountWithoutContact = new Account();
        accountWithoutContact.Name = 'GeoCoded Account Without Contact';
        accountWithoutContact.AUM__c = 5412;
        accountWithoutContact.Type = 'Public Pension Fund';
        accountWithoutContact.Website = 'www.google.com';
        accountWithoutContact.BillingLatitude = 34.7518;
        accountWithoutContact.BillingLongitude = -54.9723;
        insert accountWithoutContact;
        
        List<String> accountTypes = new List<String> { 'Public Pension Fund' };
        Account acct = [Select Id,Name,Type from Account where Name = 'Test Account 0'];
        List<NearByAccountsController.NearByRecordsData> neighboringAccountDetails = NearByAccountsController.getNearByAccounts(acct.Id,'Account', 0,10, accountTypes);
        System.assertEquals(6,neighboringAccountDetails.size());
        
        Contact cnct = [Select Id,Name,Account.AUM__c from Contact where Name = 'Test Contact 0'];
        List<NearByAccountsController.NearByRecordsData> neighboringContactDetails = NearByAccountsController.getNearByAccounts(cnct.Id,'Contact', 0,10, accountTypes);
        String picklistValues = NearByAccountsController.getAccountTypeValueSetFromMetadata();
        System.assertEquals(6,neighboringContactDetails.size());
    }

}