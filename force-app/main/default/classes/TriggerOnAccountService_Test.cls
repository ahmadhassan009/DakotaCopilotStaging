@isTest
public class TriggerOnAccountService_Test {
    
    @testSetUp
    public static void createTestData()
    {
        Id investmentRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        Metro_Area__c metro = new Metro_Area__c(name='Test MetroArea');
        insert metro;        
        
        Account acc = new Account();
        acc.Name = 'Test Account';
        acc.RecordTypeId = investmentRecordTypeId;
        acc.X100_Marketplace__c = true;
        acc.MetroArea__c = metro.Id;
        acc.Data_Integerations__c = '';
        insert acc;
        
        Id contactInvestmentRecordTypeId = Schema.getGlobalDescribe().get('Contact').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
        Contact con = new Contact();
        con.LastName = 'Test Contact';
        con.AccountId = acc.Id;
        con.RecordTypeId = contactInvestmentRecordTypeId;
        con.Updated__c = false;
        insert con;
        
        Dakota_Content__c dc =  new Dakota_Content__c();
        dc.Name = 'Test Dakota Content';
        insert dc;
        
        //////859///
        Account accDC = New Account();
        accDC.Name = 'Test Acc76';
        accDC.ACK_ID__c= '98765';
        insert accDC;

        Account getAcc = [Select Id,Name,Type from Account where Id = :accDC.Id limit 1];

        Fund_Service_Provider__c serviceProvider=new Fund_Service_Provider__c();
        serviceProvider.Name='Test Fund Service';
        serviceProvider.Account__c=getAcc.Id;
        serviceProvider.Payment_Type__c='Direct';
        insert serviceProvider;

        Investment_Funds__c investmentFunds=new Investment_Funds__c();
        investmentFunds.Name='Test Fund Investment';
        investmentFunds.Account__c=getAcc.Id;
        insert investmentFunds;
        
        Account_Contact_Relation__c acctCnctRelation=new Account_Contact_Relation__c();
        acctCnctRelation.Name='Test';
        acctCnctRelation.Account__c=getAcc.Id;
        acctCnctRelation.Contact__c=con.Id;
        insert acctCnctRelation;
    }
    
    @isTest
    public static void testCreateNewAccountActivityStream()
    {
        Account account = [Select Id, Name, Description from Account where Name = 'Test Account' Limit 1];
        
        List<Update__c> historyRecordList = [Select Id, Field_Name__c from Update__c 
                                             where Type__c='Marketplace Data Updates' and Account__c=:account.Id];
        System.assert(historyRecordList.size()==1);
    }
    
    @isTest
    public static void testPopulateNumberOfAccountsOnMetroArea()
    {
        Test.startTest();
        Metro_Area__c metro = new Metro_Area__c(name='Test MetroArea 2');
        insert metro;
        
        Account account = [Select Id, Name,RecordTypeId,MetroArea__c,X100_Marketplace__c from Account where Name = 'Test Account'];
        account.MetroArea__c = metro.Id;
        account.X100_Marketplace__c = true;
        update account;        
        
        metro = [Select Id,Name,Sort_Order__c from Metro_Area__c where Name = 'Test MetroArea 2'];
        System.assertEquals(1, metro.Sort_Order__c);
        
        Id marketplaceAccountRecordType = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
        account = [Select Id, Name,RecordTypeId,X100_Marketplace__c from Account where Name = 'Test Account'];
        account.MetroArea__c = metro.Id;
        account.X100_Marketplace__c = false;
        account.RecordTypeId = marketplaceAccountRecordType;
        update account;
        
        metro = [Select Id, Name, Sort_Order_Everest__c,Sort_Order__c from Metro_Area__c where Name = 'Test MetroArea 2'];
        System.assertEquals(1, metro.Sort_Order_Everest__c);
        System.assertEquals(0, metro.Sort_Order__c);
        
        Account_Contact_Relation__c accConRel = [Select Id from Account_Contact_Relation__c];
        delete accConRel;
        delete account;
        
        metro = [Select Id,Name,Sort_Order_Everest__c from Metro_Area__c where Name = 'Test MetroArea 2'];
        System.assertEquals(0, metro.Sort_Order_Everest__c);
        Test.stopTest();
    }
    
    @isTest
    public static void testSyncParentIdOfAccount()
    {   
        Account account = [Select Id, Name,ParentId,Parent_Account__c from Account where Name = 'Test Account'];
        
        Account parentAcc = new Account();
        parentAcc.Name = 'Parent Account';
        insert parentAcc; 
        
        account.ParentId = parentAcc.Id;
        update account;
        
        account = [Select Id, Name,ParentId,Parent_Account__c from Account where Name = 'Test Account'];
        System.assertEquals(parentAcc.Id, account.Parent_Account__c);
    }
    
    @isTest
    public static void testUpdateRelatedContactAndAccounts()
    {
        Test.startTest();
        Account parentAcc = new Account();
        parentAcc.Name = 'General Consultant Account';
        insert parentAcc; 
        
        Account account = [Select Id, Name,ParentId,Updated__c from Account where Name = 'Test Account'];
        account.Name = 'test acc';
        account.General_Consultant__c = parentAcc.Id;
        update account;
        
        parentAcc.Name = 'test parent acc';
        update parentAcc;
        
        Test.stopTest();
        
        Contact conn = [SELECT Id, Updated__c FROM Contact WHERE LastName = 'Test Contact'];
        System.assertEquals(true, conn.Updated__c);
        
        account = [Select Id,Updated__c from Account where Name = 'test acc'];  
        System.assertEquals(true, account.Updated__c);   
    }
    
    @isTest
    public static void testUpdateProductStructure_ETF_MF()
    {
        Account account = [Select Id,Updated__c from Account where Name = 'Test Account' LIMIT 1];   
        Investment_Strategy__c invr = new Investment_Strategy__c();
        invr.Account__c = account.id;
        insert invr;
        
        Test.startTest();
        account.ETF__c = true;
        update account;
        account.ETF__c = false;
        update account;
        invr.Product_Structure__c = 'ETF';
        update invr;
        
        account.Mutual_Fund__c = true;
        update account;
        account.Mutual_Fund__c = false;
        update account;
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateProductStructure_LP_CIT_SA()
    {
        Account account = [Select Id,Updated__c from Account where Name = 'Test Account' LIMIT 1];   
        Investment_Strategy__c invr = new Investment_Strategy__c();
        invr.Account__c = account.id;
        insert invr;
        
        Test.startTest();
        account.Limited_Partnership__c = true;
        update account;
        account.Limited_Partnership__c = false;
        update account;
        
        account.CIT__c = true;
        update account;
        account.CIT__c = false;
        update account;
        
        account.Separate_Account__c = true;
        update account;
        account.Separate_Account__c = false;
        update account;
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateProductStructure_IntervalFund()
    {
        Account account = [Select Id,Name from Account where Name = 'Test Account' LIMIT 1];   
        Investment_Strategy__c invr = new Investment_Strategy__c();
        invr.Account__c = account.id;
        insert invr;
        
        Test.startTest();
        account.Interval_Fund__c = true;
        update account;
        
        account = [Select Id,Product_Structure__c from Account where Name = 'Test Account' LIMIT 1]; 
        System.assert(account.Product_Structure__c.contains('Interval Fund'));
        
        account.Interval_Fund__c = false;
        update account;
        
        account = [Select Id,Product_Structure__c from Account where Name = 'Test Account' LIMIT 1]; 
        System.assert(account.Product_Structure__c == null);
    }

    
    @isTest 
    public static void testUpdateCountryField()
    {
        Account acc = [Select Id,BillingAddress,BillingCountry from Account where Name='Test Account' Limit 1];
        acc.BillingCountry = 'U.S.';
        update acc;
        Account updatedAcc = [Select Id,BillingAddress,BillingCountry from Account where Name='Test Account' Limit 1];
        System.assert(updatedAcc.BillingCountry == 'USA');
    }
    
	    @isTest 
    public static void testSetAccTypeOfChildFundServiceAndFundInvestment1()
    {
        Test.startTest();
        
        Account getAcc = [Select Id,Name,Type from Account where Name='Test Acc76' limit 1];
        getAcc.ACK_ID__c = '';
        update getAcc;
        Account accUpdated = [Select Id,Name,Type from Account where Name='Test Acc76' limit 1];
        Fund_Service_Provider__c fundServiceProviderOther=[select id,name,Form_5500_Account__c from Fund_Service_Provider__c where Account__c =:accUpdated.Id limit 1];
        Investment_Funds__c investmentFundsOther=[select id,name,Form_5500_Account__c from Investment_Funds__c where Account__c =:accUpdated.Id limit 1];
        Account_Contact_Relation__c acctCnctRelation=[select Id,Form_5500_Account__c from Account_Contact_Relation__c where Account__c =:accUpdated.Id limit 1];
        
        System.assertEquals(fundServiceProviderOther.Form_5500_Account__c,false); 
        System.assertEquals(investmentFundsOther.Form_5500_Account__c,false); 
        System.assertEquals(acctCnctRelation.Form_5500_Account__c,false);
        
        Account getAcc2 = [Select Id,Name,Type from Account where Name='Test Acc76' limit 1];
        getAcc2.ACK_ID__c = '123456789';
        update getAcc2;
        
        Account accUpdated2 = [Select Id,Name,Type from Account where Name='Test Acc76' limit 1];
        Fund_Service_Provider__c fundServiceProviderDC=[select id,name,Form_5500_Account__c from Fund_Service_Provider__c where Account__c =:accUpdated2.Id limit 1];
        Investment_Funds__c investmentFundsDC=[select id,name,Form_5500_Account__c from Investment_Funds__c where Account__c =:accUpdated2.Id limit 1];
        Account_Contact_Relation__c acctCnctRelationForm5500 =[select Id,Form_5500_Account__c from Account_Contact_Relation__c where Account__c =:accUpdated.Id limit 1];  
        
        System.assertEquals(fundServiceProviderDC.Form_5500_Account__c,true); 
        System.assertEquals(investmentFundsDC.Form_5500_Account__c,true);
        System.assertEquals(acctCnctRelationForm5500.Form_5500_Account__c,true); 
        Test.stopTest();       
    }

    @isTest 
    public static void testSetAccTypeOfChildFundServiceAndFundInvestment2()
    {
        Test.startTest(); 
        
        Account getAcc2 = [Select Id,Name,Type from Account where Name='Test Acc76' limit 1];
        getAcc2.ACK_ID__c = '123456789';
        update getAcc2;

        Account accUpdated2 = [Select Id,Name,Type from Account where Name='Test Acc76' limit 1];
        Fund_Service_Provider__c fundServiceProviderDC=[select id,name,Form_5500_Account__c from Fund_Service_Provider__c where Account__c =:accUpdated2.Id limit 1];
        Investment_Funds__c investmentFundsDC=[select id,name,Form_5500_Account__c from Investment_Funds__c where Account__c =:accUpdated2.Id limit 1];
        System.assertEquals(fundServiceProviderDC.Form_5500_Account__c,true); 
        System.assertEquals(investmentFundsDC.Form_5500_Account__c,true); 

        Test.stopTest();      
    }

    @isTest 
    public static void testUpdateRelatedContacts()
    {
        Test.startTest(); 
        Account acc = [Select Id,Name,Type from Account where Name='Test Account' limit 1];
        acc.Not_a_fit_for_MarketplaceII__c = true;
        update acc;
        Test.stopTest();
        Contact con  = [SELECT Id, Not_a_fit_for_MarketplaceII__c FROM Contact where AccountId = :acc.Id];
        if(con != null) {
            System.assertEquals(true, con.Not_a_fit_for_MarketplaceII__c);
        }      
    }
}