global with sharing class ScheduleSyncInvestmentFundsInHeroku implements Schedulable {
    global void execute(SchedulableContext sc) {

        Heroku_Sycn_Scheduler__mdt investmentFundSettings = Heroku_Sycn_Scheduler__mdt.getInstance('InvestmentFunds');
        Decimal chunkSize = 25;
        if(investmentFundSettings?.chunk_size__c != null) {
            chunkSize = investmentFundSettings.chunk_size__c;
        }
        // Schedule the batch job
        Database.executeBatch(new BatchToSyncInvestmentFundsInHeroku(), (Integer)chunkSize);
    }
}