global class ScheduledToDeleteInvestment13FData  implements Schedulable,Database.AllowsCallouts {

    global void execute(SchedulableContext sc) {        
        Database.executeBatch(new BatchToDeleteInvestment13FData(),8000);
    }    
    
}