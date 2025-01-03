@isTest
public class ScheduledToSyncInvestAdvisorFirms_Test {  
    @TestSetup
    static void setupTestData() {
        FormADVDateAndOffset__c cs = New FormADVDateAndOffset__c();
        cs.Name = 'DateAndOffset';
        cs.Date__c =  '2022-02-01';
        cs.Offset__c =  0;
        insert cs;
    }
    
    
    @isTest
    static void testScheduledToSyncFormADV() {        
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test()); 

        Test.startTest();
        ScheduledToSyncInvestmentAdvisorFirms sc = new ScheduledToSyncInvestmentAdvisorFirms();
        sc.execute(null); 
        Test.stopTest();
    }
}