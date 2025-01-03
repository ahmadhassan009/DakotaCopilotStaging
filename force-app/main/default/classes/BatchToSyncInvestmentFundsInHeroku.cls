public with sharing class BatchToSyncInvestmentFundsInHeroku implements Database.Batchable<sObject>, Database.AllowsCallouts, Database.Stateful {
    public Database.QueryLocator start(Database.BatchableContext context) {
        //getting mdt record

        HerokuSyncHelper helperObj = new HerokuSyncHelper('InvestmentFunds');
        if(String.isNotBlank(helperObj.salesforceFields)) {
            String investmentFundsQuery = 'SELECT '+ helperObj.salesforceFields +'  FROM Investment_Funds__c WHERE Heroku_Synced__c = false order by lastmodifieddate desc';
            return Database.getQueryLocator(investmentFundsQuery);
        }
        return null;
    }

    public void execute(Database.BatchableContext context, List<sObject> investmentFundsRecordsList) {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('InvestmentFunds');
        helperObj.processRequest(investmentFundsRecordsList,'POST');

    }

    public void finish(Database.BatchableContext context) {
        // Perform any post-processing tasks or cleanup
    }
}