@IsTest
public class BatchFolderSharingPermissions_Test {
    @IsTest
    public static void checkBatchFolderTest(){
      Test.startTest();
      BatchFolderSharingPermissions b = new BatchFolderSharingPermissions(); 
      database.executebatch(b,50);
      Test.stopTest();
    }
}