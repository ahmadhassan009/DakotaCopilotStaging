global class SchedulerToSendUpdateEmailToFollowers implements Schedulable {
    global void execute(SchedulableContext sc) {
        Database.executeBatch(new batchToSendUpdateEmailToFollowers(), 50);
    }
}