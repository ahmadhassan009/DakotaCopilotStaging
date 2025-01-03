public with sharing class BatchToSyncAccConRelHeroku implements Database.Batchable<sObject>, Database.AllowsCallouts, Database.Stateful {
    
    public Database.QueryLocator start(Database.BatchableContext context) {
        //getting mdt record

        HerokuSyncHelper helperObj = new HerokuSyncHelper('AccountContactRelation');
        if(String.isNotBlank(helperObj.salesforceFields)) {
            String accContRecQuery = 'SELECT '+ helperObj.salesforceFields +'  FROM AccountContactRelation WHERE  Heroku_Synced__c = false order by lastmodifieddate desc';
            // Query the records you want to process in the batch job
            return Database.getQueryLocator(accContRecQuery);
        }
        return null;
    }

    public void execute(Database.BatchableContext context, List<sObject> accConRelList) {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('AccountContactRelation');
        helperObj.processRequest(accConRelList,'POST');

    }

    public void finish(Database.BatchableContext context) {
        // Perform any post-processing tasks or cleanup
    }

}