public with sharing class DakotaContentDetailsController {
    @AuraEnabled
    public static Dakota_Content__c getRecordType(Id recordId)
    {  
        return [
            SELECT RecordType.Name
            FROM Dakota_Content__c
            WHERE Id =: recordId
        ];
    }
}