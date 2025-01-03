global class BatchToUpdatePardotInContacts implements Database.Batchable<sObject> {
    String contactIds = '';
    global BatchToUpdatePardotInContacts(String contactList)
    {
        this.contactIds = contactList;
    }
    global Database.QueryLocator start(Database.BatchableContext bc) 
    {
        String query = 'SELECT Id,RecordType.Name,Pardot_Domain__c FROM Contact WHERE id IN  ('+ contactIds + ')';
        return Database.getQueryLocator(query);
    }
    global void execute(Database.BatchableContext bc, List<Contact> contacts)
    {
        for(Contact con: contacts)
        {
            if(con.RecordType.Name == 'Investment Allocator Contact')
            {
                con.Pardot_Domain__c = 'Investment Sales';
            } 
            else
            {
                con.Pardot_Domain__c=null;
            }
        }
        Database.update(contacts, false);
    }
    global void finish(Database.BatchableContext bc){
    } 
}