@isTest
public with sharing class InvestmentStrategyRelatedToAccount_Test {
    @testSetup
    public static void createTestData()
    {
        TestDataFactory.createAccount();
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];
        Investment_Strategy__c invStr = new Investment_Strategy__c();
            invStr.Name = 'Test Perf Strategy';
            invStr.Investment_Strategy_Verified__c = true;
        	invStr.Account__c = acc.id;
            insert invStr;
        Investment_Strategy__c invStr2 = new Investment_Strategy__c();
            invStr2.Name = 'Test Perf Strategy2';
            invStr2.Investment_Strategy_Verified__c = true;
        	invStr2.Account__c = acc.id;
            insert invStr2;
        Performance__c perf = new Performance__c();
            perf.Name = 'Test Perf Strategy';
        	perf.Account__c = acc.id;
        	perf.Investment_Strategy__c = invStr.Id;
            insert perf;
        Performance__c perf2 = new Performance__c();
            perf2.Name = 'Test Perf Strategy2';
        	perf2.Account__c = acc.id;
        	perf2.Investment_Strategy__c = invStr2.Id;
            insert perf2;
        
    }

    @isTest
    public static void testGetRecordsCount()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc'];
        Integer count = InvestmentStrategyRelatedToAccountCont.getRecordsCount(acc.Id,'Performance');
        Integer count1 = InvestmentStrategyRelatedToAccountCont.getRecordsCount(acc.Id,'');
        System.assertEquals(2, count);
        System.assertEquals(2, count1);
    }
    
    @isTest
    public static void testGetInvestmentStrategyRecords()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc']; 
        System.assertEquals(2, (InvestmentStrategyRelatedToAccountCont.getInvestmentStrategyRecords(acc.Id, 'Name', 'desc','LAST','Performance')).size());
        System.assertEquals(2, (InvestmentStrategyRelatedToAccountCont.getInvestmentStrategyRecords(acc.Id, 'Name', 'desc','LAST','')).size());
    }
    
    @isTest
    public static void testGetAccountRelatedInvestmentRecords()
    {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Acc']; 
        System.assertEquals(2, (InvestmentStrategyRelatedToAccountCont.getAccountRelatedInvestmentRecords(acc.Id, 50,0,'LAST','Name', 'desc','Performance')).size());
        System.assertEquals(2, (InvestmentStrategyRelatedToAccountCont.getAccountRelatedInvestmentRecords(acc.Id, 50,0,'LAST','Name', 'desc','')).size());
    }
}