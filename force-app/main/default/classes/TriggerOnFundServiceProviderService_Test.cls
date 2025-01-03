@isTest
public with sharing class TriggerOnFundServiceProviderService_Test {
    @testSetUp
    public static void createTestData()
    {
        TestDataFactory.createAccount();
        Account account = [Select Id, Name from Account where name='Test Acc'];
        id accId=account.Id;
        Fund_Service_Provider__c serviceProvider=new Fund_Service_Provider__c();
        serviceProvider.Name='Test fund';
        serviceProvider.Account__c=accId;
        serviceProvider.Payment_Type__c='Direct';
        insert serviceProvider;
TestDataFactory.createHerokuAuthMetadata();
        Account acc2 = New Account(
            Name = 'Test Acc',
            ACK_ID__c = '123456789'
        );
        insert acc2;

        Fund_Service_Provider__c fundServiceProvider = [Select Id, Name,Form_5500_Account__c from Fund_Service_Provider__c where name='Test fund'];
    	fundServiceProvider.Account__c=acc2.Id;
        update fundServiceProvider;
    }

    @isTest
    public static void testAccountTypeInFundServiceProvider()
    {
        Fund_Service_Provider__c fundServiceProvider = [Select Id, Name,Form_5500_Account__c from Fund_Service_Provider__c where name='Test fund'];
        System.assertEquals(fundServiceProvider.Form_5500_Account__c, true);
    }   
    
    @isTest
    public static void testdelete()
    {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Test.startTest();
        Fund_Service_Provider__c fundServiceProvider = [Select Id, Name from Fund_Service_Provider__c LIMIT 1];
        delete fundServiceProvider;
        Test.stopTest();
    }
}