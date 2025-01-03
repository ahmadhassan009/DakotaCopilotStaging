global class BatchToDeleteDCRecords implements Database.Batchable<sObject> 
{
    global Database.QueryLocator start(Database.BatchableContext bc) {
        String role = 'DC Consultant';
        String query = 'Select Id,ContactId,AccountId from AccountContactRelation where Roles = :role and CreatedDate = Today';
        return Database.getQueryLocator(query);
    }
    global void execute(Database.BatchableContext bc, List<AccountContactRelation> accountContactRelations){
        Database.delete(accountContactRelations,false);
    }
    global void finish(Database.BatchableContext bc){}
}