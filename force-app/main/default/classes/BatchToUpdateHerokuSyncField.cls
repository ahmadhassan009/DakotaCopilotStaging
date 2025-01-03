public with sharing class BatchToUpdateHerokuSyncField implements Database.Batchable<sObject>, Database.AllowsCallouts, Database.Stateful {
    public Database.QueryLocator start(Database.BatchableContext context) {
        //getting mdt record
        String cDate = (String.isNotBlank(System.Label.Heroku_Synced_Created_Date))?'AND CreatedDate >='+System.Label.Heroku_Synced_Created_Date:'';
            String updateQuery = 'SELECT Id,Heroku_Synced__c  FROM Update__c WHERE  Heroku_Synced__c = true '+cDate+' order by lastmodifieddate desc';
            
            return Database.getQueryLocator(updateQuery);
    }

    public void execute(Database.BatchableContext context, List<Update__c> updateList) {
        try {
            for(Update__c up : updateList)
            {
                up.Heroku_Synced__c = false;
            }
        } catch (Exception ex) {
            System.debug(ex.getMessage());
        }

        update updateList;

    }

    public void finish(Database.BatchableContext context) {
        // Perform any post-processing tasks or cleanup
    }
}