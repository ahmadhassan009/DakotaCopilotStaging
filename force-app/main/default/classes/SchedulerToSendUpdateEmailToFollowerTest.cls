@IsTest
public with sharing class SchedulerToSendUpdateEmailToFollowerTest {
    @IsTest
    static void testSchedulerToSendUpdateEmailToFollower() {
        Test.startTest();
        SchedulerToSendUpdateEmailToFollowers scc = new SchedulerToSendUpdateEmailToFollowers();
        SchToSendUpdateEmailToFollowersWeekly scc1 = new SchToSendUpdateEmailToFollowersWeekly();
        scc.execute(null);
        scc1.execute(null);
        Test.stopTest();   
    }
}