@isTest
public with sharing class TriggerOnInvestmentFundsService_Test {
    @testSetUp
    public static void createTestData()
    {
        TestDataFactory.createAccount();
        Account account = [Select Id, Name from Account where name='Test Acc'];
        id accId=account.Id;
        Investment_Funds__c investmentFunds=new Investment_Funds__c();
        investmentFunds.Name='Test fund';
        investmentFunds.Account__c=accId;
        insert investmentFunds;
        Account acc2 = New Account(
            Name = 'Test Acc',
            ACK_ID__c = '123456789'
        );
        insert acc2;
TestDataFactory.createHerokuAuthMetadata();
        Investment_Funds__c investmentFundss = [Select Id, Name,Form_5500_Account__c from Investment_Funds__c where name='Test fund'];
    	investmentFundss.Account__c=acc2.Id;
        update investmentFundss;
    }

    @isTest
    public static void testAccountTypeInInvestmentFunds()
    {
        Investment_Funds__c investmentFunds = [Select Id, Name,Form_5500_Account__c from Investment_Funds__c where name='Test fund'];
        System.assertEquals(investmentFunds.Form_5500_Account__c, true);
    } 
    
    @isTest
    public static void testdelete()
    {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Test.startTest();
        Investment_Funds__c investmentFunds = [Select Id, Name from Investment_Funds__c LIMIT 1];
        delete investmentFunds;
        Test.stopTest();
    }
    
}