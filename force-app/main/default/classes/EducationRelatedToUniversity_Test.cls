@isTest
public with sharing class EducationRelatedToUniversity_Test {
    @testSetup
    public static void createTestData()
    {
        University_Alumni__c acc = TestDataFactory.createUniversity();
        Contact cont = TestDataFactory.createContact();
        cont.Marketplace_Verified_Contact__c = true;
        update cont;
        TestDataFactory.createEducationRecordForUniversity(acc.Id, cont.Id);
    }
    
    @isTest
    public static void testGetEducationRecords()
    {
        University_Alumni__c acc = [SELECT Id FROM University_Alumni__c WHERE Name = 'Test Acc']; 
        List<Education__c> returnedResult = EducationRelatedToUniversityController.getEducationRecords(acc.Id, 'Name', 'desc','LAST');
        System.assertEquals(5, returnedResult.size());
    }

    @isTest
    public static void testGetEducationRecordsViewAll()
    {
        University_Alumni__c acc = [SELECT Id FROM University_Alumni__c WHERE Name = 'Test Acc']; 
        List<Education__c> returnedResult = EducationRelatedToUniversityController.getEducationRecordsViewAll(acc.Id, 'Name', 'desc',50,0,'LAST');
        System.assertEquals(5, returnedResult.size());
    }

    @isTest
    public static void testGetRecordsCount()
    {
        University_Alumni__c acc = [SELECT Id FROM University_Alumni__c WHERE Name = 'Test Acc'];
        Integer count = EducationRelatedToUniversityController.getRecordsCount(acc.Id);
        System.assertEquals(5, count);
    }

    @isTest
    public static void testGetUniversityAlumniName()
    {
        University_Alumni__c acc = [SELECT Id FROM University_Alumni__c WHERE Name = 'Test Acc'];
        University_Alumni__c accName = EducationRelatedToUniversityController.getUniversityAlumniName(acc.Id);
        System.assertEquals('Test Acc', accName.Name);
    }
}