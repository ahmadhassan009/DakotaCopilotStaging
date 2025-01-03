public with sharing class BatchToSyncUpdateHeroku implements Database.Batchable<sObject>, Database.AllowsCallouts, Database.Stateful {
    
    public Database.QueryLocator start(Database.BatchableContext context) {
        //getting mdt record

        HerokuSyncHelper helperObj = new HerokuSyncHelper('update');
        if(String.isNotBlank(helperObj.salesforceFields)) {
            String cDate = (String.isNotBlank(System.Label.Heroku_Synced_Created_Date))?'AND CreatedDate >='+System.Label.Heroku_Synced_Created_Date:'';
            
            String updateQuery = 'SELECT '+ helperObj.salesforceFields +'  FROM Update__c WHERE  Heroku_Synced__c = false '+cDate+' order by lastmodifieddate desc LIMIT 50000';
            
            System.debug(updateQuery);
            // Query the records you want to process in the batch job
            return Database.getQueryLocator(updateQuery);
        }
        return null;
    }

    public void execute(Database.BatchableContext context, List<Update__c> updateList) {
        for(Update__c up : updateList)
        {
            up.Heroku_Synced__c = false;
        }
        HerokuSyncHelper helperObj = new HerokuSyncHelper('update');
        helperObj.processRequest(updateList,'POST');

    }

    public void finish(Database.BatchableContext context) {
        // Perform any post-processing tasks or cleanup
    }

}