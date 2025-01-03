global class BatchToUpdateHerokuSyncOfInvestments implements Database.Batchable<sObject>
{
    global Database.QueryLocator start(Database.BatchableContext BC)
    {
        String query ='select Id,Name,Heroku_Synced__c from Investment__c where Heroku_Synced__c=false';
        return Database.getQueryLocator(query);
    }

    global void execute(Database.BatchableContext BC, List<Investment__c> invsRecords)
    {
        for(Investment__c inv: invsRecords)
        {
            inv.Heroku_Synced__c = true;
        }
        update invsRecords;
    }

    global void finish(Database.BatchableContext BC){}
}