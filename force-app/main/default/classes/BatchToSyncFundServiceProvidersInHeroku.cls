public with sharing class BatchToSyncFundServiceProvidersInHeroku implements Database.Batchable<sObject>, Database.AllowsCallouts, Database.Stateful {
    public Database.QueryLocator start(Database.BatchableContext context) {
        //getting mdt record

        HerokuSyncHelper helperObj = new HerokuSyncHelper('FundServiceProviders');
        if(String.isNotBlank(helperObj.salesforceFields)) {
            String fundServiceProviderQuery = 'SELECT '+ helperObj.salesforceFields +'  FROM Fund_Service_Provider__c WHERE Heroku_Synced__c = false order by lastmodifieddate desc';
            return Database.getQueryLocator(fundServiceProviderQuery);
        }
        return null;
    }

    public void execute(Database.BatchableContext context, List<sObject> fundServiceProviderRecordsList) {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('FundServiceProviders');
        helperObj.processRequest(fundServiceProviderRecordsList,'POST');

    }

    public void finish(Database.BatchableContext context) {
        // Perform any post-processing tasks or cleanup
    }
}