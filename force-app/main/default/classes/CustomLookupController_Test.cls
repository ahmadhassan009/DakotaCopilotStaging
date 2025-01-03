@isTest
public with sharing class CustomLookupController_Test {
    @TestSetup
    static void makeData(){
        TestDataFactory.createAccount();
    }
    @IsTest
    public static void testFetchAccounts()
    {
        System.assert(CustomLookupController.fetchAccounts('Test').size() > 0);
    }

    @IsTest
    public static void testFetchUniversityRecords()
    {
        System.assert(CustomLookupController.fetchUniversityRecords('Test')!=null);
    }
}