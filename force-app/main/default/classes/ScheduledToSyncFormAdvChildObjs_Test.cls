@isTest
public class ScheduledToSyncFormAdvChildObjs_Test {  
    @isTest
    static void testScheduledToSyncFormAdvChildObjs() {        
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test()); 
        Test.startTest();
        ScheduledToSyncFormAdvChildObjs sc = new ScheduledToSyncFormAdvChildObjs();
        sc.execute(null); 
        Test.stopTest();
    }
}