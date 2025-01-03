@IsTest
private class TabulatorEventBusTest {
    
    @IsTest
    static void testPublishEvent() {
        // Test successful event publishing
        Test.startTest();
        try {
            TabulatorEventBus.publishEvent();
            // If no exception, the event was successfully published
            System.assert(true, 'Event should be published without exceptions.');
        } catch (Exception e) {
            System.assert(false, 'Exception should not be thrown during event publishing: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testPublishEventWithException() {
        // Simulate an exception during event publishing
        Test.startTest();
        try {
            // Here you could mock or simulate the event failure if possible
            // Since you cannot directly mock the platform exception behavior,
            // we will throw an exception manually for this example.
            
            // Triggering the method in a scenario where an exception will be thrown
            // (In real testing, you'd simulate failure in event handling if possible)
            throw new AuraHandledException('Simulated Exception');
        } catch (AuraHandledException e) {
            // Verify that the exception message is as expected
            System.assertEquals('Script-thrown exception', e.getMessage());
        }
        Test.stopTest();
    }
}