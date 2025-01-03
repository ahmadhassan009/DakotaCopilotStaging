@isTest
public class ConferenceSpeakerController_Test {

    @testSetup
    public static void createTestData()
    {
        TestDataFactory.createAccount();
        Contact cont=TestDataFactory.createContact();
        Conference__c conf=TestDataFactory.createConference();

        TestDataFactory.createConferenceSpeakerRecord(cont.Id,conf.Id);
    }
    
    @isTest
    public static void testGetConferenceSpeakerRecordsRelatedToContact()
    {
        Contact cont=[select Id FROM Contact WHERE Lastname = 'Community User']; 
        List<Conference_Speaker__c> returnedResult = ConferenceSpeakerController.getConferenceSpeakerRecordsRelatedToContact(cont.Id,'Start_Date__c','desc','LAST');
        System.assertEquals(5,returnedResult.size());
        
    }

    @isTest
    public static void testgetRecordsCountContact()
    {
        Contact cont=[select Id FROM Contact WHERE Lastname = 'Community User'];
        Integer count = ConferenceSpeakerController.getRecordsCount(cont.Id,'Contact');
        System.assertEquals(5,count);
    }
    @isTest
    public static void testgetRecordsCountConference()
    {
        Conference__c conf=[select Id FROM Conference__c WHERE Name = 'Test Conf']; 
        Integer count = ConferenceSpeakerController.getRecordsCount(conf.Id,'Conference');
        System.assertEquals(5,count);
    }

    @isTest
    public static void testGetConferenceSpeakerRecordsRelatedToConference()
    {
        Conference__c conf=[select Id FROM Conference__c WHERE Name = 'Test Conf']; 
        List<Conference_Speaker__c> returnedResult = ConferenceSpeakerController.getConferenceSpeakerRecordsRelatedToConference(conf.Id,'Title__c','desc','LAST');
        System.assertEquals(5,returnedResult.size());
        
    }

}