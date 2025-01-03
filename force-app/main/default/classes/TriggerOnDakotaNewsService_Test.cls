@isTest
public with sharing class TriggerOnDakotaNewsService_Test {
    @TestSetup
    public static void createTestData()
    {
        TestDataFactory.createDakotaNews();
    }

     @IsTest
    public static void testSetDakotaNewsName()
    {
        Dakota_News__c dakotaNewsRecord = [SELECT Id, Name, Title__c FROM Dakota_News__c Limit 1];
        System.assertEquals(dakotaNewsRecord.Name, dakotaNewsRecord.Title__c);

        dakotaNewsRecord.Title__c = 'Houston Firefighters’ Retirement Commits $135M to Private Credit, Private Equity; Terminates BlackRock Fund';
        update dakotaNewsRecord;
        Dakota_News__c dakotaNewsRecordUpdated = [SELECT Id, Name, Title__c FROM Dakota_News__c Limit 1];
        String expectedName = dakotaNewsRecordUpdated.Title__c.substring(0,80);
        System.assertEquals(expectedName, dakotaNewsRecordUpdated.Name);
    }
}