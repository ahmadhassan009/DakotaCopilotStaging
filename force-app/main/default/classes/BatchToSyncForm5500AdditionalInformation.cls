public with sharing class BatchToSyncForm5500AdditionalInformation implements Database.Batchable<sObject>, Database.AllowsCallouts, Database.Stateful {
    public Database.QueryLocator start(Database.BatchableContext context) {
        //getting mdt record

        HerokuSyncHelper helperObj = new HerokuSyncHelper('Form5500AdditionalInformation');
        if(String.isNotBlank(helperObj.salesforceFields)) {
            String Form5500AdditionalInformationQuery = 'SELECT '+ helperObj.salesforceFields +'  FROM Form_5500_Additional_Information__c WHERE Heroku_Synced__c = false order by lastmodifieddate desc';
            // Query the records you want to process in the batch job
            return Database.getQueryLocator(Form5500AdditionalInformationQuery);
        }
        return null;
    }

    public void execute(Database.BatchableContext context, List<sObject> Form5500AdditionalInformationList) {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('Form5500AdditionalInformation');
        helperObj.processRequest(Form5500AdditionalInformationList,'POST');

    }

    public void finish(Database.BatchableContext context) {
        // Perform any post-processing tasks or cleanup
    }
}