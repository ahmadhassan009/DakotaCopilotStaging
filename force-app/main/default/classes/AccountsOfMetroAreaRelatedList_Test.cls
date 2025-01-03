@IsTest
public class AccountsOfMetroAreaRelatedList_Test {
    
   @TestSetup
    public static void createTestData()
    {
        Metro_Area__c metro = new Metro_Area__c(name='Test MetroArea');
        insert metro;

    }
    
   @IsTest
    public static void testGetMetroAreaName()
    {
        Metro_Area__c metro = [Select Id, Name from Metro_Area__c where Name = 'Test MetroArea' Limit 1];
        System.assertEquals(AccountsOfMetroAreaRelatedListController.getMetroAreaName(metro.Id),'Test MetroArea');       
    }
    
    @IsTest 
   public static void testRelatedAccountsControllerTestMethods()
    {
        Metro_Area__c metro = [Select Id, Name from Metro_Area__c where Name = 'Test MetroArea' Limit 1];

        Account[] accts = new List<Account>();
        for(Integer i=0; i<5 ;i++) {
            Account a = new Account();
            a.Name = 'Account for Test Class : '+i;
            a.MetroArea__c = metro.Id;
            a.X100_Marketplace__c = true;
            a.Type='Hedge Fund of Funds';
            a.Asset_Classes__c='Hedge Fund';
            accts.add(a);
        }

        List<Account> accountToUpdate;
        Metro_Area__c[] AccountsRecordsInsertList = new List<Metro_Area__c>();
        insert accts;   
        
        Sub_Metro_Area__c sma = new Sub_Metro_Area__c(Account__c=accts[0].Id,Metro_Area__c=metro.Id);
        insert sma;
        
        accountToUpdate = [SELECT Id, Name FROM Account];
        Integer counter = 0;
        for(Account accObj : accountToUpdate) {
            accObj.Name = 'Updated Account for Test Class :' + counter;
            counter++;
        }
        update accountToUpdate;
        System.assertEquals(AccountsOfMetroAreaRelatedListController.getRelatedAccountCount(metro.Id),5);
        System.assert(AccountsOfMetroAreaRelatedListController.getRelatedAccountRecords(metro.Id) != null);
        System.assert(AccountsOfMetroAreaRelatedListController.getAllRelatedAccountRecords(metro.Id, 5, 0) != null);
        System.assert(AccountsOfMetroAreaRelatedListController.getAllRelatedSortedAccountsRecords(metro.Id, 5, 0, 'Name', 'asc') != null);

        Metro_Area__c metro2 = AccountsOfMetroAreaRelatedListController.getMetroAreaNameObj(metro.Id);
        system.assertEquals('Test MetroArea',metro2.Name);
        User currentUser = new User(Id=UserInfo.getUserId(), Portal_State__c='Everest');
        update currentUser;

        System.assertEquals(AccountsOfMetroAreaRelatedListController.getRelatedAccountCount(metro.Id),5);
        System.assert(AccountsOfMetroAreaRelatedListController.getRelatedAccountRecords(metro.Id) != null);
        System.assert(AccountsOfMetroAreaRelatedListController.getAllRelatedAccountRecords(metro.Id, 5, 0) != null);
        System.assert(AccountsOfMetroAreaRelatedListController.getAllRelatedSortedAccountsRecords(metro.Id, 5, 0, 'Name', 'asc') != null);
    }
}