@isTest
public class RelatedAccountsMetaController_Test {
    @testSetup
    public static void createTestData()
    { 
        List<Account> accounts = new List<Account>();
        List<Contact> contacts = new List<Contact>();
        Metro_Area__C mtArea = new Metro_Area__c();
        mtArea.Name = 'New York';
        insert mtArea;

        Id InvestmentRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        for(integer i=0;i<5;i++)
        {
            Account acct = new Account();
            acct.Name = 'Test Account '+i;
            acct.AUM__c = 2000;
            acct.MetroArea__c = mtArea.Id;            
            acct.Type = 'Public Pension Fund';
            acct.Website = 'www.google.com';
            acct.Phone = '123456';
            acct.BillingStreet = '123 Ave. Building';
            acct.BillingCity = 'New York';
            acct.BillingState = 'NY';
            acct.BillingPostalCode = '19011';
            acct.BillingCountry = 'USA';
            acct.BillingLatitude = 40.7518 + i;
            acct.BillingLongitude = -73.9723 + i;
            acct.X100_Marketplace__c = true;
            acct.Marketplace_Verified_Date__c = Date.newInstance(2022, 01, 01);
            acct.RecordTypeId = InvestmentRecordTypeId;
            acct.Investment_Focus_single__c = 'Hedge Fund';
            accounts.add(acct);
        }
        insert accounts;

        Id contactInvestmentRecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
        for(integer i=0;i<5;i++)
        {
            Contact cnct = new Contact();
            cnct.Metro_Area__c = mtArea.Id;
            cnct.LastName = 'Test Contact '+ i;
            cnct.AccountId = accounts[i].Id;
            cnct.MailingLatitude = 40.7518+i;
            cnct.MailingLongitude = -73.9723+i;
            cnct.RecordTypeId = contactInvestmentRecordTypeId;
            contacts.add(cnct);
        }

        Contact cnct = new Contact();
        cnct.Metro_Area__c = mtArea.Id;
        cnct.LastName = 'Test Contact '+ 10;
        cnct.AccountId = accounts[0].Id;
        cnct.RecordTypeId = contactInvestmentRecordTypeId;
        contacts.add(cnct);
        
        insert contacts;
    }
    @isTest
    public static void testRelatedAccountsMetaMethods()
    {
        String metroAreaId = [SELECT Id
                              FROM Metro_Area__c
                              LIMIT 1].Id;

        System.assert(RelatedAccountsMetaController.getRelatedAccountsMetadata(true, metroAreaId).size() > 0);
        System.assertEquals('New York', RelatedAccountsMetaController.getDefaultValueOfMarker(metroAreaId).Name);
        System.assert(RelatedAccountsMetaController.getRelatedAccountsAssetMetadata() != null);
        System.assert(RelatedAccountsMetaController.getProfileName() != null);
        System.assert(RelatedAccountsMetaController.getOrderedMetroAreaMetaDataForDakotaTalent(metroAreaId).size() > 0);
        System.assert(RelatedAccountsMetaController.getTotalCountOfAccountTypeRecords(metroAreaId) > 0);
        System.assert(RelatedAccountsMetaController.getTotalCountOfAccountInvFocusRecords(metroAreaId) > 0);
    }
    

}