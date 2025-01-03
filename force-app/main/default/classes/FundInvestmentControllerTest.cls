@isTest
public class FundInvestmentControllerTest {
    
    @testSetUp
    public static void createTestData() {
        Account acc = TestDataFactory.createAccount();
        Investment_Funds__c funInv = TestDataFactory.createFundInvestmentRecord(acc.Id);
    }

    @isTest
    public static void testGetFundInvestmentsRecordCount() {
        Account acct = [Select Id,Name from Account where Name = 'Test Acc' Limit 1];
        System.assertEquals(1, FundInvestmentController.getFundInvestmentsRecordCount(acct.Id));
    }

    @isTest
    public static void testGetFundInvestmentsRecords() {
        Account acct = [Select Id,Name from Account where Name = 'Test Acc' Limit 1];
        List<Investment_Funds__c> fundInvList = FundInvestmentController.getFundInvestmentsRecords(acct.Id, 'Row_Order_P1__c', 'ASC', 'LAST');
        System.assert(fundInvList.size() > 0);
    }
}