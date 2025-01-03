@isTest
public class AnnualReportsAndHoldingsController_Test 
{
    @testSetUp
    public static void createTestData()
    {
        Account acct = TestDataFactory.createAccount();
        Annual_Reports_and_Holdings_Data__c annualReportHolding = TestDataFactory.createAnnualReportAndHolding(acct.Id);
        
        TestDataFactory.createContentVersion();
        
        Id docId = [SELECT Id FROM ContentDocument].Id;
        ContentDocumentLink cdl = New ContentDocumentLink();
        cdl.LinkedEntityId = annualReportHolding.Id;
        cdl.ContentDocumentId = docId;
        cdl.shareType = 'V';
        insert cdl;
    }
    
    @isTest
    public static void testGetRelatedAnnualReportsAndHoldingsCount()
    {
        Account acct = [Select Id,Name from Account where Name = 'Test Acc' Limit 1];
        System.assertEquals(1, AnnualReportsAndHoldingsController.getRelatedAnnualReportsAndHoldingsCount(acct.Id));
    }
    
    @isTest
    public static void testGetCorporatePensionHoldingRecords()
    {
        Account acct = [Select Id,Name from Account where Name = 'Test Acc' Limit 1];
        List<AnnualReportsAndHoldingsController.AnnualReportsAndHoldingsData> annualReportHoldings = AnnualReportsAndHoldingsController.getAnnualReportsAndHoldingsRecords(acct.Id,'Name','asc',10,0);
        
        System.assert(annualReportHoldings.size() > 0);
        System.assert(annualReportHoldings[0].AR_Attachments.size() > 0);
    }
}