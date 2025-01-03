@isTest
public class AssetClassRelatedToAccountCtrl_Test {
    @TestSetup
    public static void createTestData() {
        Account acc = TestDataFactory.createAccount();
        List<Asset_Class_Exposure__c> inv = TestDataFactory.createAssetClassExposureRecord(acc.Id);
    }

    @isTest
    public static void testGetAssetClassExposureRecordCount() {
        Account acct = [ SELECT Id,Name FROM Account WHERE Name = 'Test Acc' Limit 1 ];
        System.assertEquals(5, AssetClassRelatedToAccountController.getAssetClassExposureRecordCount(acct.Id));
    }

    @isTest
    public static void testgGetAssetClassExposureRecords() {
        Account acct = [SELECT Id,Name FROM Account WHERE Name = 'Test Acc' Limit 1 ];
        List<Asset_Class_Exposure__c> assetList = AssetClassRelatedToAccountController.getAssetClassExposureRecords(acct.Id, 'Name', 'ASC', 10, 0, 'LAST');
        System.assertEquals(5, assetList.size());
    }
}