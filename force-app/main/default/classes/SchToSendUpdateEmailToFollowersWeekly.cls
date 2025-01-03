global class SchToSendUpdateEmailToFollowersWeekly implements Schedulable {
    global void execute(SchedulableContext sc) {
        Database.executeBatch(new BatchToSendUpdateEmailWeekly(), 50);
    }
}