@isTest
public with sharing class ScheduleSyncUpdateInHeroku_Test {
    @isTest
    static void testSyncInvestmentsInHerokuScheduler() {
        Test.startTest();
        // Schedule the scheduler class
        String cronExpression = '0 0 0 * * ?'; // Set your desired cron expression for scheduling
        ScheduleSyncUpdatesInHeroku scheduler = new ScheduleSyncUpdatesInHeroku();
        String jobId = System.schedule('SyncUpdateJob', cronExpression, scheduler);
        Test.stopTest();
        // Perform assertions or verifications, if necessary
        System.assertNotEquals(null, jobId);   
    }
}