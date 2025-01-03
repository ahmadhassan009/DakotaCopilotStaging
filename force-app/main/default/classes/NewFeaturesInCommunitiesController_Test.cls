@isTest
public class NewFeaturesInCommunitiesController_Test {

    @testSetup
    public static void createTestData()
    {
        TestDataFactory.createMpNewFeaturesRecords();
    }
    
    @isTest
    public static void testgetRecords()
    {
        List<MP_New_Features__c> returnedResult = NewFeaturesInCommunitiesController.getRecordOfMpNewFeatures();
        System.assertEquals(5,returnedResult.size());
        List<MP_New_Features__c> returnedLimitedResult = NewFeaturesInCommunitiesController.getlimitedRecordOfMpNewFeatures();
        System.assertEquals(5,returnedLimitedResult.size());
        Integer count = NewFeaturesInCommunitiesController.getRecordCountOfMpNewFeatures();
        System.assertEquals(5,count);
    }

}