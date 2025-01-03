@isTest
public with sharing class AlternativeHoldingsController_Test {
    @testSetup
    public static void createTestData()
    {
        Investment_Holdings__c ih = new Investment_Holdings__c ();
        ih.name = 'Test Investment holding';
        insert ih;
    }

    @isTest
    public static void testGetAlternativeHoldingsInfoId()
    {
        Investment_Holdings__c ih = [select Id FROM Investment_Holdings__c WHERE Name = 'Test Investment holding' LIMIT 1];
        Investment_Holdings__c returnedResult = AlternativeHoldingsController.getAlternativeHoldingsInfoId(ih.Id);
        System.assertNotEquals(null,returnedResult);
    }
}