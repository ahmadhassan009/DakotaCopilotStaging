global class ScheduleSyncUpdatesInHeroku implements Schedulable {

    global void execute(SchedulableContext sc) {
        Heroku_Sycn_Scheduler__mdt invstSettings = Heroku_Sycn_Scheduler__mdt.getInstance('update');
        Decimal chunkSize = 25;
        if(invstSettings?.chunk_size__c != null) {
            chunkSize = invstSettings.chunk_size__c;
        }
        Database.executeBatch(new BatchToSyncUpdateHeroku(), (Integer)chunkSize);
    }
}