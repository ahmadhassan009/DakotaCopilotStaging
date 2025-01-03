@IsTest
public with sharing class ScheduleSyncAccConRelInHeroku_Test {
    @IsTest
    static void testScheduleSyncAccConRelInHeroku() {
        Test.startTest();
        // Schedule the scheduler class
        String cronExpression = '0 0 0 * * ?'; // Set your desired cron expression for scheduling
        ScheduleSyncAccConRelInHeroku scheduler = new ScheduleSyncAccConRelInHeroku();
        String jobId = System.schedule('SyncAccountContactRelationJob', cronExpression, scheduler);
        Test.stopTest();
        // Perform assertions or verifications, if necessary
        System.assertNotEquals(null, jobId);   
    }
}