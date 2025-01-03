global class ScheduleSyncInvestmentsInHeroku implements Schedulable {

    global void execute(SchedulableContext sc) {

        Heroku_Sycn_Scheduler__mdt invstSettings = Heroku_Sycn_Scheduler__mdt.getInstance('Investments');
        Decimal chunkSize = 25;
        if(invstSettings?.chunk_size__c != null) {
            chunkSize = invstSettings.chunk_size__c;
        }
        // Schedule the batch job
        Database.executeBatch(new BatchToSyncInvestmentsInHeroku(), (Integer)chunkSize);
    }

}