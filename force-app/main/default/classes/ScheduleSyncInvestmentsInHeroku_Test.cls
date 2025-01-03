@IsTest

public with sharing class ScheduleSyncInvestmentsInHeroku_Test {
    @IsTest
    static void testSyncInvestmentsInHerokuScheduler() {
        Test.startTest();
        // Schedule the scheduler class
        String cronExpression = '0 0 0 * * ?'; // Set your desired cron expression for scheduling
        ScheduleSyncInvestmentsInHeroku scheduler = new ScheduleSyncInvestmentsInHeroku();
        String jobId = System.schedule('SyncInvestmentsJob', cronExpression, scheduler);
        Test.stopTest();
        // Perform assertions or verifications, if necessary
        System.assertNotEquals(null, jobId);   
    }
}