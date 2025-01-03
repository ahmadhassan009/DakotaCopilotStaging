global class BatchToDeleteDuplicateDCRelations implements Database.Batchable<sObject>
{
    global Database.QueryLocator start(Database.BatchableContext BC)
    {
        String query ='SELECT Id, Name,Combined_Rec_Ids__c FROM Account_Contact_Relation__c';
        return Database.getQueryLocator(query);
    }
    
    global void execute(Database.BatchableContext BC, List<Account_Contact_Relation__c> queriedRelations)
    {
        Map<String,String> uniqueDCRelations = new Map<String,String>();
        for(Account_Contact_Relation__c relation : queriedRelations)
        {
            uniqueDCRelations.put(relation.Combined_Rec_Ids__c,relation.Id);
        }
        List<Account_Contact_Relation__c> relationsToBeDeleted = [Select Id from Account_Contact_Relation__c where Combined_Rec_Ids__c In :uniqueDCRelations.keySet() 
                                                                 and Id Not In :uniqueDCRelations.values()];
        delete relationsToBeDeleted;
    }
    
    global void finish(Database.BatchableContext BC){}
}