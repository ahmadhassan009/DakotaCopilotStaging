@isTest
public class DakotaNewsRelatedToPublicPlanMin_Test 
{
    @TestSetup
    public static void createTestData() 
    {
        Account acc = TestDataFactory.createAccount();
        TestDataFactory.createDakotaNewsRecords();
        
        Public_Plan_Minute__c publicPlanMin = new Public_Plan_Minute__c();
        publicPlanMin.Name = 'Test Plan';
        publicPlanMin.Account__c = acc.Id;
        insert publicPlanMin;

        List<Dakota_News__c> dakotaNewsRecords = [SELECT Id,Name,Public_Plan_Minute__c FROM Dakota_News__c];
        for(Dakota_News__c dkNews : dakotaNewsRecords)
        {
            dkNews.Public_Plan_Minute__c = publicPlanMin.Id;
        }
        update dakotaNewsRecords;
    }
    
    @isTest
    public static void testGetDakotaNewsRecordCount() 
    {
        Public_Plan_Minute__c publicPlanMin = [ SELECT Id,Name FROM Public_Plan_Minute__c WHERE Name = 'Test Plan' Limit 1 ];
        System.assertEquals(5, dakotaNewsRelatedToPublicPlanMinute.getDakotaNewsRecordCount(publicPlanMin.Id));
    }
    
    @isTest
    public static void testGetDakotaNewsRecords() 
    {
        Public_Plan_Minute__c publicPlanMin = [ SELECT Id,Name FROM Public_Plan_Minute__c WHERE Name = 'Test Plan' Limit 1 ];
        List<Dakota_News__c> newsList = dakotaNewsRelatedToPublicPlanMinute.getDakotaNewsRecords(publicPlanMin.Id, 'Name', 'ASC', 10, 0, 'LAST');
        System.assertEquals(5, newsList.size());
    }
}