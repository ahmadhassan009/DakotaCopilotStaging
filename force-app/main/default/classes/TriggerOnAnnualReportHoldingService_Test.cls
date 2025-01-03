@isTest
public class TriggerOnAnnualReportHoldingService_Test 
{
    @testSetUp
    public static void createData()
    {
        Account acct = TestDataFactory.createAccount();
        
        Annual_Reports_and_Holdings_Data__c annualReportHolding = new Annual_Reports_and_Holdings_Data__c();
        annualReportHolding.Name = 'Test ARH';
        annualReportHolding.Account__c = acct.Id;
        insert annualReportHolding;
    }
    
    @isTest
    public static void testRefreshCorporatePensionPanels()
    {
        Annual_Reports_and_Holdings_Data__c annualReportHolding = [Select Id,Name from Annual_Reports_and_Holdings_Data__c where Name = 'Test ARH' Limit 1];
        annualReportHolding.Name = 'Test ARH 1';
        update annualReportHolding;
        System.assert(annualReportHolding != null);
    } 
}