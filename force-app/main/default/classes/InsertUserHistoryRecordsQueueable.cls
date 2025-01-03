public class InsertUserHistoryRecordsQueueable implements Queueable {
    private String userHistoryRecordsJSON;

    public InsertUserHistoryRecordsQueueable(String userHistoryRecordsJSON) {
        this.userHistoryRecordsJSON = userHistoryRecordsJSON;
    }

    public void execute(QueueableContext context) {
        List<User_History__c> userHistoryRecords = (List<User_History__c>) JSON.deserialize(userHistoryRecordsJSON, List<User_History__c>.class);
        if (userHistoryRecords.size() > 0) {
            insert userHistoryRecords;
        }
    }
}