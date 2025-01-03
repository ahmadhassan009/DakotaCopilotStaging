global class ScheduledToSyncFormD  implements Schedulable {    
    global void execute(SchedulableContext sc) {
        Database.executeBatch(new BatchToSyncFormD(0,false));
    } 
}