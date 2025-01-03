@isTest
public with sharing class ScheduledToDeleteInvestment13FData_Test {
    @testSetUp
    public static void createData()
    {
        Account acc = TestDataFactory.createAccount();
        Investment_Strategy__c investmentStategy = new Investment_Strategy__c (
            Name = 'Test Strategy',
            Product_Structure__c = 'Common Stock'
        );
        insert investmentStategy;

        Id recordType13FId = [SELECT Id FROM RecordType WHERE Name = '13F Filings' AND SObjectType = 'Investment__c' LIMIT 1].Id;

        Investment__c inv = new Investment__c (
                    Account__c = acc.Id,
                    Name = 'Test Investment',
                    RecordTypeId = recordType13FId,
                    Investment_Strategy__c = investmentStategy.Id,
                    Fund_Balance__c = 1000,
                    Funding_Year_Number__c = 2022,
                    isRecordCloned__c=true
                );
        insert inv;

        TestDataFactory.createHerokuAuthMetadata();
       
    }
    
    @isTest
    public static void testFetchManagerPresentationRecords(){

        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Test.startTest();
        ScheduledToDeleteInvestment13FData sc = new ScheduledToDeleteInvestment13FData();
        sc.execute(null); 
        Test.stopTest();
    }
    
}