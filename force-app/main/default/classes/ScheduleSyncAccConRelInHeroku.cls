global class ScheduleSyncAccConRelInHeroku implements Schedulable {

    global void execute(SchedulableContext sc) {

        Heroku_Sycn_Scheduler__mdt accConRelSettings = Heroku_Sycn_Scheduler__mdt.getInstance('AccountContactRelation');
        Decimal chunkSize = 25;
        if(accConRelSettings?.chunk_size__c != null) {
            chunkSize = accConRelSettings.chunk_size__c;
        }
        // Schedule the batch job
        Database.executeBatch(new BatchToSyncAccConRelHeroku(), (Integer)chunkSize);
    }

}