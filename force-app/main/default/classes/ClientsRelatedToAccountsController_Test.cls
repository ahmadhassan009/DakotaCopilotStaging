@isTest
public class ClientsRelatedToAccountsController_Test {

    @testSetup
    public static void createTestDate()
    {
        Metro_Area__c metroarea = new Metro_Area__c();
        metroarea.Name = 'Test MetroArea';
        insert metroarea;
        
        Id investmentRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        Account acct = new Account();
        acct.Name = 'Test Parent Account';
        acct.MetroArea__c = metroarea.Id;
        acct.RecordTypeId = investmentRecordTypeId;
        insert acct;
        
        List<Account> generalConsultantAccounts = new List<Account>();
        for(integer i =0;i<5;i++)
        {
            Account account = new Account();
            account.Name = 'Test GC Account '+i;
            account.General_Consultant_2__c = acct.Id;
            generalConsultantAccounts.add(account);
        }
        insert generalConsultantAccounts;
        
        List<Account> privateConsultantAccounts = new List<Account>();
        for(integer i =0;i<5;i++)
        {
            Account account = new Account();
            account.Name = 'Test PE Account '+i;
            account.Private_Equity_Consultant__c = acct.Id;
            privateConsultantAccounts.add(account);
        }
        insert privateConsultantAccounts;
        
        List<Account> realEstateConsultantAccounts = new List<Account>();
        for(integer i =0;i<5;i++)
        {
            Account account = new Account();
            account.Name = 'Test RE Account '+i;
            account.Real_Estate_Consultant__c = acct.Id;
            realEstateConsultantAccounts.add(account);
        }
        insert realEstateConsultantAccounts;
    }
    
    @isTest
    public static void testGetAccountName()
    {
        Account acct = [Select Id,Name from Account where MetroArea__c != null Limit 1];
        String name = ClientsRelatedToAccountsController.getAccountName(acct.Id);
        System.assertEquals('Test Parent Account', name);
    }
    
    @isTest
    public static void testGetCountOfAllClientAccounts()
    {
        Account acct = [Select Id,Name from Account where MetroArea__c != null Limit 1];
        Integer totalRecords = ClientsRelatedToAccountsController.getCountOfAllClientAccounts(acct.Id);
        System.assertEquals(15, totalRecords);
    }
    
    @isTest
    public static void testGetClientAccounts()
    {
        Account acct = [Select Id,Name from Account where MetroArea__c != null Limit 1];
        List<Account> accounts = ClientsRelatedToAccountsController.getClientAccounts(acct.Id, 'AUM__c', 'desc', 'LAST');
        System.assertEquals(10, accounts.size());
    }
    
    @isTest
    public static void testGetAllClientAccounts()
    {
        Account acct = [Select Id,Name from Account where MetroArea__c != null Limit 1];
        List<Account> accounts = ClientsRelatedToAccountsController.getAllClientAccounts(acct.Id);
        System.assertEquals(15, accounts.size());
    }
}