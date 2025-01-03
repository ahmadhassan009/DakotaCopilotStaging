@isTest
public class AssetAllocationDetailsController_Test {
 	@isTest
    public static void testGetChartDetails() {
        Test.startTest();

        Account acc = new Account();
        acc.Name = 'Test Account ';
        acc.Type = 'RIA';
        insert acc;

        Asset_Allocation__c assetAllocation = new  Asset_Allocation__c();

        assetAllocation.Account__c = acc.Id; 
        assetAllocation.Equities__c=100; 
        assetAllocation.Fixed_Income__c=90;
        assetAllocation.Notes__c='Test Allocation Notes';
        assetAllocation.Alternatives__c=70;
        assetAllocation.Cash__c=60;
        assetAllocation.Commodities__c=50;
        assetAllocation.Hedge_Funds__c=40;
        assetAllocation.Private_Equity__c=30;
        assetAllocation.Real_Estate__c=20;
        assetAllocation.Private_Credit__c=10;
        assetAllocation.Real_Assets__c=0;
        assetAllocation.Type__c='Target'; 
        insert assetAllocation;

        System.assertEquals(true, AssetAllocationDetailsController.getChartDetails(acc.Id, 'Target') != null);

        Test.stopTest();
    }
}