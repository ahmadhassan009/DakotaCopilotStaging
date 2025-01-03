@IsTest
public with sharing class ScheduleSyncFundServiceProvider_Test {
    @IsTest
    static void testScheduleSyncFundServiceProviderInHeroku() {
        Test.startTest();
        // Schedule the scheduler class
        String cronExpression = '0 0 0 * * ?'; // Set your desired cron expression for scheduling
        ScheduleSyncFundServiceProviderInHeroku scheduler = new ScheduleSyncFundServiceProviderInHeroku();
        String jobId = System.schedule('ScheduleSyncFundServiceProviderInHeroku', cronExpression, scheduler);
        Test.stopTest();
        // Perform assertions or verifications, if necessary
        System.assertNotEquals(null, jobId);   
    }
}