@IsTest
public class UserLicenseNotification_Test {
    
    @IsTest
    public static void testUserLicenseNotificationEmail(){
        
        test.startTest ();
        UserLicenseNotification myClass = new UserLicenseNotification();
        String chron = '0 0 20 ? 1/1 FRI *';
        System.schedule('User License Notification', chron, myClass);
        Integer scheduledJobCount = [SELECT COUNT() FROM CronJobDetail WHERE Name = 'User License Notification'];
        System.assert(scheduledJobCount == 1, 'Error in user license notification cron job');
        test.stopTest ();
    }

    @IsTest
    public static void testLimitWithContextSwitch() {
        Test.startTest();
        UserLicenseNotification.sendUserLicenseNotificationEmail(false);
        Integer invocations = Limits.getEmailInvocations();
        Test.stopTest();
        System.assertEquals(1,invocations,'Limits method is reflecting the sendemail call that was made in runtime context.');
    }
}