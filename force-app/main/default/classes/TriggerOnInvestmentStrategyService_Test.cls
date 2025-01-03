@isTest
public class TriggerOnInvestmentStrategyService_Test {
    @testSetUp
    public static void createTestData()
    {
        List<Account> accounts = new List<Account>();
        for(integer i = 0; i< 100 ; i++) {
            Account acc = new Account();
            acc.Name = 'Test Account';
            acc.Product_Structure__c = 'BDC';
            accounts.add(acc);
        }
        insert accounts;
    }
    
    static void createInvestmentStratgies(String productStructure)
    {
        List<Account> accounts = [Select Id,Name from Account Limit 200];
        List<Investment_Strategy__c> investmentStrategies = new List<Investment_Strategy__c>();
        for(Account acct : accounts) {
            Investment_Strategy__c invr = new Investment_Strategy__c();
            invr.Account__c = acct.id;
            invr.Product_Structure__c = productStructure;
            investmentStrategies.add(invr);
        }
        for(Account acct : accounts) {
            Investment_Strategy__c invr = new Investment_Strategy__c();
            invr.Account__c = acct.id;
            invr.Product_Structure__c = productStructure;
            investmentStrategies.add(invr);
        }
        insert investmentStrategies;
    }
    @isTest
    public static void testUpdateRelatedAccountsFormD()
    {
        Account acc = TestDataFactory.createAccount();
        Form_D_Offering__c formD = new Form_D_Offering__c(
            Entity_Type__c = 'Limited Partnership',
            Act_of_1940__c = true,
            Name_Issuer__c ='test',
            Account__c = acc.Id,
            Filed_At__c = Datetime.valueOf('2024-01-01 12:00:00.0000+00:00')
        );
        insert formD;
        
        
        createInvestmentStratgies('ETF');
        List<Investment_Strategy__c> investmentStrategies = [Select Id,Account__c from Investment_Strategy__c LIMIT 1];
        Test.startTest();
        investmentStrategies[0].Account__c = acc.Id;
        update investmentStrategies;
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateProductStructureBDCOnAccount()
    {
        List<Account> accounts = [Select Id,Product_Structure__c from Account Limit 200];
        for(Account acct: accounts)
        {
            acct.Product_Structure__c = 'ETF;BDC';
        }
        update accounts;
        
        createInvestmentStratgies('ETF');
        List<Investment_Strategy__c> investmentStrategies = [Select Id,Product_Structure__c from Investment_Strategy__c LIMIT 200];
        Test.startTest();
        for(Investment_Strategy__c invst : investmentStrategies) {
            invst.Product_Structure__c = 'BDC';
        }
        update investmentStrategies;
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateProductStructureETFOnAccount()
    {
        List<Account> accounts = [Select Id,Product_Structure__c from Account Limit 200];
        for(Account acct: accounts)
        {
            acct.Product_Structure__c = 'BDC;ETF';
        }
        update accounts;
        
        createInvestmentStratgies('BDC');
        List<Investment_Strategy__c> investmentStrategies = [Select Id,Product_Structure__c from Investment_Strategy__c LIMIT 200];  
        
        Test.startTest();
        for(Investment_Strategy__c invst : investmentStrategies) {
            invst.Product_Structure__c = 'ETF';
        }
        update investmentStrategies;
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateProductStructureClosedEndOnAccount()
    {
        List<Account> accounts = [Select Id,Product_Structure__c from Account Limit 200];
        for(Account acct: accounts)
        {
            acct.Product_Structure__c = 'Closed-End Fund;BDC';
        }
        update accounts;
        
        createInvestmentStratgies('Closed-End Fund');
        List<Investment_Strategy__c> investmentStrategies = [Select Id,Product_Structure__c from Investment_Strategy__c LIMIT 200];  
        
        Test.startTest();
        for(Investment_Strategy__c invst : investmentStrategies) {
            invst.Product_Structure__c = 'BDC';
        }
        update investmentStrategies;
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateProductStructureIntervaFundOnAccount()
    {
        List<Account> accounts = [Select Id,Product_Structure__c from Account Limit 200];
        for(Account acct: accounts)
        {
            acct.Product_Structure__c = 'Interval Fund;BDC';
        }
        update accounts;
        
        createInvestmentStratgies('Closed-End Fund');
        List<Investment_Strategy__c> investmentStrategies = [Select Id,Product_Structure__c from Investment_Strategy__c LIMIT 200];  
        
        Test.startTest();
        for(Investment_Strategy__c invst : investmentStrategies) {
            invst.Product_Structure__c = 'BDC';
        }
        update investmentStrategies;
        Test.stopTest();
    }
    
    @isTest
    public static void testRemoveProductStructure()
    {
        createInvestmentStratgies('ETF');
        List<Investment_Strategy__c> investmentStrategies = [Select Id,Product_Structure__c from Investment_Strategy__c LIMIT 200];
        for(Investment_Strategy__c invst : investmentStrategies) 
        {
            invst.Product_Structure__c = 'ETF';
        }
        update investmentStrategies;
        
        investmentStrategies = [Select Id,Product_Structure__c from Investment_Strategy__c LIMIT 200];  
        Test.startTest();
        delete investmentStrategies;
        Test.stopTest();
    }

    @isTest
    public static void testDeleteInvestmentStrategy()
    {
        createInvestmentStratgies('ETF');
        List<Investment_Strategy__c> investmentStrategies = [Select Id,Product_Structure__c from Investment_Strategy__c LIMIT 200];
        
        Test.startTest();
        delete investmentStrategies;
        Test.stopTest();
    }

}