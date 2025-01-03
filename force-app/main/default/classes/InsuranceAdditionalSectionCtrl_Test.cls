@isTest
public with sharing class InsuranceAdditionalSectionCtrl_Test {
    @testSetup
    public static void createTestData()
    {
        Account acc=TestDataFactory.createAccount();
        TestDataFactory.createInsuranceAdditionalInformationRecord(acc.Id);
    }

    @isTest
    public static void testGetInsuranceAdditionalInfoId()
    {
        Account acc=[select Id FROM Account WHERE Name = 'Test Acc'];
        Insurance_Additional_Information__c returnedResult = InsuranceAdditionalSectionController.getInsuranceAdditionalInfoId(acc.Id);
        System.assertNotEquals(null,returnedResult);
    }
}