@isTest
public class RelatedConferenceController_Test {

    @testSetUp
    public static void createTestData()
    {
        Account acct = TestDataFactory.createAccount();
        Contact con = TestDataFactory.createContact();
        Metro_Area__c ma = TestDataFactory.createMetroArea();
        Conference__c conf = TestDataFactory.createConferenceRecord(ma.Id, acct.Id, con.Id);
    }

    @isTest
	public static void testGetMetroAreaName() {
        Metro_Area__c ma = [SELECT Id, Name FROM Metro_Area__c WHERE Name = 'Test Metro Area' Limit 1];
        System.assertEquals(RelatedConferenceController.getMetroAreaName(ma.Id),'Test Metro Area');
    }

    @isTest
    public static void testGetRelatedConferenceCount() {
        Metro_Area__c ma = [SELECT Id, Name FROM Metro_Area__c WHERE Name = 'Test Metro Area' Limit 1];
        System.assertEquals(RelatedConferenceController.getRelatedConferenceCount(ma.Id), 1);
    }

    @isTest
    public static void testGetRelatedConferencesToMetroArea() {
        Metro_Area__c ma = [SELECT Id, Name FROM Metro_Area__c WHERE Name = 'Test Metro Area' Limit 1];
        System.assertEquals(RelatedConferenceController.getRelatedConferencesToMetroArea(ma.Id).size(), 1);
    }

    @isTest
    public static void testGetAllRelatedConferencesRecords() {
        Metro_Area__c ma = [SELECT Id, Name FROM Metro_Area__c WHERE Name = 'Test Metro Area' Limit 1];
        System.assert(RelatedConferenceController.getAllRelatedConferencesRecords(ma.Id, 10, 0) != null);
    }

    @isTest
    public static void testGetAllRelatedSortedConferencesRecords() {
        Metro_Area__c ma = [SELECT Id, Name FROM Metro_Area__c WHERE Name = 'Test Metro Area' Limit 1];
        System.assert(RelatedConferenceController.getAllRelatedSortedConferencesRecords(ma.Id, 10, 0, 'Name', 'ASC') != null);
    }
}