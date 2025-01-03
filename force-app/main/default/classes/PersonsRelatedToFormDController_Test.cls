@isTest
public class PersonsRelatedToFormDController_Test {
    
    @testSetUp
    public static void createTestData() {
        
        Form_D_Offering__c formD = new Form_D_Offering__c(
            SEC_Id__c='12345',
            Previous_Accession_No__c= '12396'
        );
        insert formD;

        Form_D_Offering__c formDRecord=[select id,SEC_Id__c,Previous_Accession_No__c from Form_D_Offering__c limit 1];
        Id relatedPersonRecId = Schema.SObjectType.SEC_API_Related_Person__c.getRecordTypeInfosByDeveloperName().get('Related_Person').getRecordTypeId();
        Id recipientsRecId = Schema.SObjectType.SEC_API_Related_Person__c.getRecordTypeInfosByDeveloperName().get('Recipients').getRecordTypeId();
         
        SEC_API_Related_Person__c relatedPerson = new SEC_API_Related_Person__c(
            Related_Person_Name__c = 'test Jake',
            Form_D_Offering__c = formDRecord.Id,
            recordTypeId = relatedPersonRecId
        );
        insert relatedPerson;

        SEC_API_Related_Person__c recipient = new SEC_API_Related_Person__c(
            Recipient_Name__c = 'test Jake',
            Form_D_Offering__c = formDRecord.Id,
            recordTypeId = recipientsRecId
        );
        insert recipient;
    }

    @isTest
    public static void testGetPersonsRelatedToFormDCount() {
        Form_D_Offering__c formDRecord=[select id,SEC_Id__c,Previous_Accession_No__c from Form_D_Offering__c limit 1];
        System.assertEquals(true, PersonsRelatedToFormDController.getPersonsRelatedToFormDCount(formDRecord.Id,true)>0);
        System.assertEquals(true, PersonsRelatedToFormDController.getPersonsRelatedToFormDCount(formDRecord.Id,false)>0);
    }

    @isTest
    public static void testGetPersonsRelatedToFormDRecords() {
        Form_D_Offering__c formDRecord=[select id,SEC_Id__c,Previous_Accession_No__c from Form_D_Offering__c limit 1];
        System.assertEquals(true, PersonsRelatedToFormDController.getPersonsRelatedToFormDRecords(formDRecord.Id,true,'Recipient_Name__c','asc','50','0','FIRST').size() > 0);
    }

    @isTest
    public static void testGetFormDName() {
        Form_D_Offering__c formDRecord=[select id,SEC_Id__c,Previous_Accession_No__c from Form_D_Offering__c limit 1];
        System.assertEquals(true, PersonsRelatedToFormDController.getFormDName(formDRecord.Id)!=null);
    }
}