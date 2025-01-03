@IsTest
public class FolderSharingPermissions_Test {
    
    @IsTest
    public static void testFolderSharingPermissions() {
        Test.startTest();
        FolderSharingPermissions myClass = new FolderSharingPermissions();
        String chron = '0 0 20 * * ? *';
        System.schedule('Folder Sharing Permissions', chron, myClass);
        Integer scheduledJobCount = [SELECT COUNT() FROM CronJobDetail WHERE Name = 'Folder Sharing Permissions'];
        System.assert(scheduledJobCount == 1, 'Error in Folder Sharing Permissions cron job');
        Test.stopTest();
    }
}