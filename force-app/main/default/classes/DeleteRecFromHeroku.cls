public with sharing class DeleteRecFromHeroku implements Queueable, Database.AllowsCallouts {
         
    Set<Id> deletedRecSet = new Set<Id>();
    String objectName;
    public DeleteRecFromHeroku(Set<Id> deletedRecSet,String objectName) {
        this.deletedRecSet = deletedRecSet;
        this.objectName = objectName;
    }

    public void execute(QueueableContext context)
    {  
        HerokuSyncHelper helperObj = new HerokuSyncHelper(objectName);
        helperObj.processRequestForDelete(deletedRecSet,'DELETE');        
    }

}