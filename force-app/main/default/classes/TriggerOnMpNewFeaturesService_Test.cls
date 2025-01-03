@isTest
public with sharing class TriggerOnMpNewFeaturesService_Test {
    @TestSetup
    public static void createTestData()
    {
        TestDataFactory.createMpNewFeaturesRecords();
    }

     @IsTest
    public static void setMpNewFeaturesName()
    {
        MP_New_Features__c mpNewFeaturesRecord = [SELECT Id, Name, Title__c FROM MP_New_Features__c Limit 1];
        System.assertEquals(mpNewFeaturesRecord.Name, mpNewFeaturesRecord.Title__c);

        mpNewFeaturesRecord.Title__c = 'Houston Firefighters’ Retirement Commits $135M to Private Credit, Private Equity; Terminates BlackRock Fund';
        update mpNewFeaturesRecord;
        MP_New_Features__c mpNewFeaturesRecordUpdated = [SELECT Id, Name, Title__c FROM MP_New_Features__c Limit 1];
        String expectedName = mpNewFeaturesRecordUpdated.Title__c.substring(0,80);
        System.assertEquals(expectedName, mpNewFeaturesRecordUpdated.Name);
    }
}