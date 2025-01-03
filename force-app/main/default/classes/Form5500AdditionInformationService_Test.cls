@isTest
public with sharing class Form5500AdditionInformationService_Test {
    @testSetUp
    public static void createTestData()
    {
        TestDataFactory.createAccount();
        TestDataFactory.createHerokuAuthMetadata();
        Account account = [Select Id, Name from Account where name='Test Acc'];
        id accId=account.Id;
        Form_5500_Additional_Information__c additionalInformation = new Form_5500_Additional_Information__c(
            Account__c=accId
        );
        insert additionalInformation;

        Account acc2 = New Account(
            Name = 'Test Acc',
            ACK_ID__c = '123456789'
        );
        insert acc2;

        Form_5500_Additional_Information__c additionalInformation1 = [Select Id, Name from Form_5500_Additional_Information__c LIMIT 1];
    	additionalInformation1.Account__c=acc2.Id;
        update additionalInformation1;
    }

    @isTest
    public static void testAdditionalInformation()
    {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Test.startTest();
        Form_5500_Additional_Information__c additionalInformation = [Select Id, Name from Form_5500_Additional_Information__c LIMIT 1];
        delete additionalInformation;
        Test.stopTest();
    }
}