@isTest
public with sharing class PerformanceRelatedToInvestmentFirm_Test {
    
    @isTest
    public static void testGetCurrentUser()
    {
        Boolean result = PerformanceRelatedToInvestmentFirm.getCurrentUser('0017600000RVAXpAAP');
        System.assertEquals(false, result);
    }
    
    @isTest
    public static void testGetCurrentUserForInvestment()
    {
        Boolean result = PerformanceRelatedToInvestmentFirm.getCurrentUserForInvestment('0017600000RVAXpAAP');
        System.assertEquals(false, result);
    }
    
    @isTest
    public static void testGetCurrentUserAccountId()
    {
        Id result = PerformanceRelatedToInvestmentFirm.getCurrentUserAccountId();
        System.assertEquals(null, result);
    }
    
    @isTest
    public static void testGetManagerPersentationName()
    {
        List<Manager_Presentation__c> result = PerformanceRelatedToInvestmentFirm.getManagerPersentationName(new List<String>());
        System.assertEquals(0, result.size());
    }
    
    @isTest
    public static void testGetlayoutData()
    {
        Test.startTest();
        Investment_Strategy__c invr = new Investment_Strategy__c();
        invr.Name = 'Test 1';
        insert invr;
        Map<String,List<List<String>>> result = PerformanceRelatedToInvestmentFirm.getlayoutData(invr.Id);
        System.assertEquals(3, result.size());
        Test.stopTest();
    }
    
    @isTest
    public static void testGetAccount()
    {
        Test.startTest();
        User currUser = [ SELECT Id, AccountId, Account.Name FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        User currUser1 = PerformanceRelatedToInvestmentFirm.getAccount();
        System.assertEquals(currUser,currUser1);
        Test.stopTest();
    }
    
      @isTest
    public static void testIsSourceSelfReported()
    {
        Test.startTest();
        Investment_Strategy__c invr = new Investment_Strategy__c();
        invr.Name = 'Test 1';
        insert invr;
        System.assertEquals(true, PerformanceRelatedToInvestmentFirm.isSourceSelfReported(invr.Id));
        Test.stopTest();
    }
    
    
}