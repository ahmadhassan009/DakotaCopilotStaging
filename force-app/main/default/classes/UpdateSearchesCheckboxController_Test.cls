@isTest
public class UpdateSearchesCheckboxController_Test {

    @testSetup
    public static void createTestData()
    {
        Marketplace_Searches__c searchRecord = new Marketplace_Searches__c();
        searchRecord.Name = 'Test Search';
        searchRecord.Asset_Class__c = 'Emerging Market Equities';
        searchRecord.Send_Alert__c = false;
        insert searchRecord;
    }
    
    @isTest
    public static void testUpdateSearchesCheckbox()
    {
        Marketplace_Searches__c searchRecord = [Select Id,Name,Send_Alert__c from Marketplace_Searches__c limit 1];
        System.assertEquals(false,searchRecord.Send_Alert__c);
        UpdateSearchesCheckboxController.recordId = searchRecord.Id;
        UpdateSearchesCheckboxController.UpdateSearchesCheckbox();
        
        searchRecord = [Select Id,Name,Send_Alert__c from Marketplace_Searches__c limit 1];
        System.assertEquals(true,searchRecord.Send_Alert__c);
    }
}