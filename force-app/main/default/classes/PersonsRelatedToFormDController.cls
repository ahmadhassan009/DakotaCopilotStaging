public with sharing class PersonsRelatedToFormDController {
    public static Id relatedPersonRecId = Schema.SObjectType.SEC_API_Related_Person__c.getRecordTypeInfosByDeveloperName().get('Related_Person').getRecordTypeId();
    public static Id recipientsRecId = Schema.SObjectType.SEC_API_Related_Person__c.getRecordTypeInfosByDeveloperName().get('Recipients').getRecordTypeId();
      
    @AuraEnabled
    public static Integer getPersonsRelatedToFormDCount(String recordId, Boolean isRecipient) {
        Id recTypeId = isRecipient==true ? recipientsRecId : relatedPersonRecId;
        return [ SELECT COUNT() FROM SEC_API_Related_Person__c WHERE Form_D_Offering__c =: recordId and recordtypeId =:recTypeId];       
    }

    @AuraEnabled
    public static List<SEC_API_Related_Person__c> getPersonsRelatedToFormDRecords(String recordId,Boolean isRecipient, String sortedBy, String sortOrder,String recordLimit,String offset, String nullOrder) {
        Id recTypeId = isRecipient==true ? recipientsRecId : relatedPersonRecId;
        String selectFields = isRecipient==true ? 'SELECT Recipient_Name__c, Recipient_CRD_Number__c,Associated_Broker_Dealer_Name__c,Associated_Broker_Dealer_CRD_Number__c,Recipient_Address__c,States_of_Solicitation__c,Foreign_Non_US__c,Full_Address__c ' : 'SELECT Related_Person_Name__c, Related_Person_Address__c, Relationship__c, Clarification_of_Response_Related_Person__c,Full_Address__c ';
        String query = selectFields + 'FROM SEC_API_Related_Person__c WHERE Form_D_Offering__c =: recordId and recordtypeId =:recTypeId ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;
        List<SEC_API_Related_Person__c> relatedRecords = Database.query(query);
        return relatedRecords;
    }

    @AuraEnabled
    public static Form_D_Offering__c getFormDName(String recordId) {
        return [
            SELECT Name
            FROM Form_D_Offering__c
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ];
    }
}