@IsTest
public with sharing class ScheduleSyncPicklistsInHeroku_Test {
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createHerokuAuthMetadata();
    }

    @IsTest
    static void testScheduleSyncPicklistsInHeroku() 
    {
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Test.startTest();
        ScheduleSyncPicklistsInHeroku scheduler = new ScheduleSyncPicklistsInHeroku();
        scheduler.execute(null);
        Test.stopTest();   
    }
}