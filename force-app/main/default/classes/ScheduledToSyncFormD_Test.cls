@isTest
public class ScheduledToSyncFormD_Test {  
    @TestSetup
    static void setupTestData() {
        FormDSyncedDate__c cs = New FormDSyncedDate__c();
        cs.Name = 'StartDate';
        cs.StartDate__c =  '2022-02-01';
        insert cs;
    }
    
    
    @isTest
    static void testScheduledToSyncFormD() {        
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test()); 

        Test.startTest();
        ScheduledToSyncFormD sc = new ScheduledToSyncFormD();
        sc.execute(null); 
        Test.stopTest();
    }
}