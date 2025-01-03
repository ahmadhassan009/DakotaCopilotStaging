global class SchedulerToUpdateUserExportRecordCount implements Schedulable{
    global void execute(SchedulableContext ctx) {       
        Database.executeBatch(new BatchToUpdateUsersExportRecordsCount(), 50);  
    }
}