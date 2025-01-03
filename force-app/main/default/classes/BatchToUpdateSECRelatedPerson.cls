global with sharing class BatchToUpdateSECRelatedPerson implements Database.Batchable<sObject>{

    global Database.QueryLocator start(Database.BatchableContext bc)
    {
        return Database.getQueryLocator([select id,name from Form_D_Offering__c limit 50000]);
    }
    global void execute(Database.BatchableContext bc, List<Form_D_Offering__c> relatedPersonRecords)
    {   
        try {   
            delete relatedPersonRecords;
        } catch(Exception ex) {
            System.debug(ex.getMessage());
        } 
    }
    
    global void finish(Database.BatchableContext BC) {
        List<Form_D_Offering__c> relatedPersonRecords = [select id,name from Form_D_Offering__c limit 1];
        if(relatedPersonRecords.size()>0) {
            Database.executeBatch(new BatchToUpdateSECRelatedPerson(),8000);
        }
    }
}