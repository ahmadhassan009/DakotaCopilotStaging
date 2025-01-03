global class  SyncForm5500AdditionalInformationHeroku implements Schedulable{
    global void execute(SchedulableContext sc) {

        Heroku_Sycn_Scheduler__mdt Form5500AdditionalInformationSettings = Heroku_Sycn_Scheduler__mdt.getInstance('Form5500AdditionalInformation');
        Decimal chunkSize = 25;
        if(Form5500AdditionalInformationSettings?.chunk_size__c != null) {
            chunkSize = Form5500AdditionalInformationSettings.chunk_size__c;
        }
        System.debug('Form5500AdditionalInformationSettings'+Form5500AdditionalInformationSettings);
        // Schedule the batch job
        Database.executeBatch(new BatchToSyncForm5500AdditionalInformation(), (Integer)chunkSize);
    }
}