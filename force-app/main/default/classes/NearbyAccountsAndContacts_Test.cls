@isTest
public class NearbyAccountsAndContacts_Test { 
    @testSetup
    public static void createTestData()
    { 
        List<Account> accounts = new List<Account>();
        List<Contact> contacts = new List<Contact>();
        Metro_Area__C mtArea = new Metro_Area__c();
        mtArea.Name = 'New York';
        insert mtArea;
        
        for(integer i=0;i<5;i++)
        {
            Account acct = new Account();
            acct.Name = 'Test Account '+i;
            acct.AUM__c = 2000;
            acct.MetroArea__c = mtArea.Id;            
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
            cnct.Metro_Area__c = mtArea.Id;
            cnct.LastName = 'Test Contact '+ i;
            cnct.AccountId = accounts[i].Id;
            cnct.MailingLatitude = 40.7518+i;
            cnct.MailingLongitude = -73.9723+i;
            contacts.add(cnct);
        }
        Contact cnct = new Contact();
        cnct.Metro_Area__c = mtArea.Id;
        cnct.LastName = 'Test Contact '+ 10;
        cnct.AccountId = accounts[0].Id;
        contacts.add(cnct);
        
        insert contacts;
    }
    @IsTest
    public static void getRecordsInformationTest()
    {
        List<Account> accounts = new List<Account>();
        List<Contact> contacts = new List<Contact>();
        String metroAreaId = [SELECT Id
                              FROM Metro_Area__c
                              LIMIT 1].Id;
        Id notGeoCodedContact = [SELECT Id 
                                 FROM Contact
                                 WHERE MailingLatitude = null 
                                 AND MailingLongitude = null].Id;
        accounts = [SELECT Id 
                    FROM Account
                    LIMIT 3];
        contacts = [SELECT Id
                    FROM Contact
                    LIMIT 3];
        List<Id> accountIds = new List<Id>();
        List<Id> contactIds = new List<Id>();
        for(integer i=0;i<3;i++)
        {
            accountIds.add(accounts[i].Id);
            contactIds.add(contacts[i].Id);
        }
        if(notGeoCodedContact != null)
        {
            contactIds.add(notGeoCodedContact); 
        }
        String accIds = JSON.serialize(accountIds);
        String conIds = JSON.serialize(contactIds);
        NearbyAccountsAndContactsInMetroArea.getRecordsInformation(accIds, conIds,'[]', metroAreaId);
        
        
    }
    
    
    
    
}