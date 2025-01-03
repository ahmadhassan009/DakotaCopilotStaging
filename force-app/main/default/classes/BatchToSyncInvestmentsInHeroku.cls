public with sharing class BatchToSyncInvestmentsInHeroku implements Database.Batchable<sObject>, Database.AllowsCallouts, Database.Stateful {
    
    public Database.QueryLocator start(Database.BatchableContext context) {
        //getting mdt record

        HerokuSyncHelper helperObj = new HerokuSyncHelper('Investments');
        if(String.isNotBlank(helperObj.salesforceFields)) {
            String invstQuery = 'SELECT '+ helperObj.salesforceFields +'  FROM Investment__c WHERE Heroku_Synced__c = false order by lastmodifieddate desc limit 10000';
            // Query the records you want to process in the batch job
            return Database.getQueryLocator(invstQuery);
        }
        return null;
    }

    public void execute(Database.BatchableContext context, List<sObject> invstRecordsList) {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('Investments');
        helperObj.processRequest(invstRecordsList,'POST');

    }

    public void finish(Database.BatchableContext context) {
        // Perform any post-processing tasks or cleanup
    }

}