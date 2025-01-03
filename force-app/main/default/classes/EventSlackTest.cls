@isTest
public class EventSlackTest {
    
   static testMethod void TestEventSlackTrigger() {

        Test.startTest(); 
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());   

        Event event = new Event();
        event.Set_Up_By_new__c = UserInfo.getUserId();
        event.StartDateTime = Date.today();
        event.DurationInMinutes = 60;
        event.RecordTypeId = [SELECT Id FROM RecordType WHERE SobjectType = 'Event' AND Name = 'Dakota Marketplace Event' LIMIT 1].Id;
        insert event;
        
        event.DurationInMinutes = 30;
        update event;
        
        delete event;
        
        Test.stopTest();

    }
}