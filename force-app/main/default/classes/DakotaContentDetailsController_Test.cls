@isTest
public class DakotaContentDetailsController_Test {
    @isTest
    public static void getRecordTypeTest()
    {
        Dakota_Content__c dakotaContentRecord = new Dakota_Content__c();
        dakotaContentRecord.Name = 'Test Dakota Content';
        insert dakotaContentRecord;

        Dakota_Content__c returnedResult = DakotaContentDetailsController.getRecordType(dakotaContentRecord.Id);
        System.assertEquals(returnedResult.RecordType.Name,'Content');
    }
}