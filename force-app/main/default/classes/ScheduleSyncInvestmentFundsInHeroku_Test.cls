@IsTest
public with sharing class ScheduleSyncInvestmentFundsInHeroku_Test {
    @IsTest
    static void testScheduleSyncInvestmentFundsInHeroku() {
        Test.startTest();
        // Schedule the scheduler class
        String cronExpression = '0 0 0 * * ?'; // Set your desired cron expression for scheduling
        ScheduleSyncInvestmentFundsInHeroku scheduler = new ScheduleSyncInvestmentFundsInHeroku();
        String jobId = System.schedule('ScheduleSyncInvestmentFundsInHeroku', cronExpression, scheduler);
        Test.stopTest();
        // Perform assertions or verifications, if necessary
        System.assertNotEquals(null, jobId);   
    }
}