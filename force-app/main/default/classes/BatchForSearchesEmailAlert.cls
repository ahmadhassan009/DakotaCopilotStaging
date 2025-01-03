public with sharing class BatchForSearchesEmailAlert  implements Database.Batchable<sObject> {

    public List<Contact> contacts;
    public Marketplace_Searches__c searchRecord;
    public BatchForSearchesEmailAlert(List<Contact> con,Marketplace_Searches__c sr)
    {
        this.contacts = con;
        this.searchRecord = sr;
    }

    public Iterable<sObject> start(Database.BatchableContext BC){       
        return this.contacts; 
    }

    public void execute(Database.BatchableContext BC, List<Contact> contacts){
        SearchesAssetClassNotificationEmail.sendSearchesAssetClassEmail(contacts,this.searchRecord);
    }
   
      public void finish(Database.BatchableContext BC){
    }
}