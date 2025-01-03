global with sharing class ScheduleSyncFundServiceProviderInHeroku implements Schedulable {
    global void execute(SchedulableContext sc) {

        Heroku_Sycn_Scheduler__mdt fundServiceProviderSettings = Heroku_Sycn_Scheduler__mdt.getInstance('FundServiceProviders');
        Decimal chunkSize = 25;
        if(fundServiceProviderSettings?.chunk_size__c != null) {
            chunkSize = fundServiceProviderSettings.chunk_size__c;
        }
        // Schedule the batch job
        Database.executeBatch(new BatchToSyncFundServiceProvidersInHeroku(), (Integer)chunkSize);
    }
}