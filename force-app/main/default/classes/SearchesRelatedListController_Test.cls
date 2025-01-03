@isTest
public class SearchesRelatedListController_Test {
    @testSetup
    public static void createTestData()
    {
        Metro_Area__c ma1 = new Metro_Area__c();
        ma1.Name = 'Test MA1';
        ma1.Country__c = 'United States';
        ma1.State__c = 'New York';
        ma1.Sort_Order__c = 10;
        ma1.Number_of_Contacts__c = 5;
        insert ma1;
        
        Account acc = new Account ();
        acc.MetroArea__c = ma1.id;
        acc.Name = 'Test Account';
        acc.BillingState = 'Ontario';
        acc.Type = 'MS Team';
		acc.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        insert acc;
        
        Marketplace_Searches__c msObj = new Marketplace_Searches__c();
        msObj.Name = 'Test Marketplace Search';
        msObj.Account__c = acc.Id;
        msObj.Metro_Area__c = ma1.Id;
        insert msObj;
        

    }
    @isTest
    public static void testGetMetroAreaName()
    {
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'Test Metro Area';
        insert metroArea;
        system.assertEquals(SearchesRelatedListController.getMetroAreaName(metroArea.Id),'Test Metro Area');       
    }
    
    @isTest
    public static void testGetRelatedSearchesCountForState()
    {
       system.assertEquals(1,SearchesRelatedListController.getRelatedSearchesCountForState('New York'));       
    }
    
     @isTest
    public static void testGetRelatedSearcheRecordsForState ()
    {
       system.assertEquals(1,SearchesRelatedListController.getRelatedSearcheRecordsForState ('New York',10,0,'Name','ASC').size());       
    }

    @isTest 
    public static void testRelatedSearchesControllerTestMethods()
    {
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'Test Metro Area';
        insert metroArea;

        Account[] accts = new List<Account>();
        for(Integer i=0; i<5 ;i++) {
            Account a = new Account();
            a.Name = 'Account for Test Class : '+i;
            a.MetroArea__c = metroArea.Id;
            a.X100_Marketplace__c = true;
            a.Type='Hedge Fund of Funds';
            a.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
            accts.add(a);
        }

        List<Account> accountToUpdate;
        Marketplace_Searches__c[] searchesRecordsInsertList = new List<Marketplace_Searches__c>();
        
        insert accts;        
        accountToUpdate = 
            [SELECT Id, Name FROM Account 
            WHERE Name LIKE 'Account for Test Class : %' ORDER BY Name];

        Integer counter = 0;
        for(sObject accObj : accountToUpdate) {
            Marketplace_Searches__c msObj = new Marketplace_Searches__c();
            msObj.Name = 'Marketplace Search for Test Class:'+counter;
            msObj.Account__c = (Id) accObj.get('Id');
            msObj.Metro_Area__c = metroArea.Id;
            searchesRecordsInsertList.add(msObj);
            counter++;
        }
        insert searchesRecordsInsertList;

        system.assertEquals(SearchesRelatedListController.getRelatedSearchesCount(metroArea.Id),5);
        system.assert(SearchesRelatedListController.getRelatedSearchesRecords(metroArea.Id) != null);
        system.assert(SearchesRelatedListController.getAllRelatedSearchesRecords(metroArea.Id, 5, 0) != null);
        system.assert(SearchesRelatedListController.getAllRelatedSortedSearchesRecords(metroArea.Id, 5, 0, 'Name', 'asc') != null);
    }
}