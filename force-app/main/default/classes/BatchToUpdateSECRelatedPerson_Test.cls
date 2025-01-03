@IsTest
public with sharing class BatchToUpdateSECRelatedPerson_Test {
    @TestSetup
    static void setupTestData() {
        Form_D_Offering__c formD = new Form_D_Offering__c(
            SEC_Id__c='12345',
            Previous_Accession_No__c= '12396'
        );
        insert formD;

        Form_D_Offering__c formDRecord=[select id,SEC_Id__c,Previous_Accession_No__c from Form_D_Offering__c limit 1];

        SEC_API_Related_Person__c recipient = new SEC_API_Related_Person__c(
            Related_Person_Name__c = 'test Jake',
            Form_D_Offering__c = formDRecord.Id
        );
        insert recipient;
    }
    
    @IsTest
    static void testBatchJob() {      
        
        Test.startTest();
        Database.executeBatch(new BatchToUpdateSECRelatedPerson());
        Test.stopTest();
    }
}