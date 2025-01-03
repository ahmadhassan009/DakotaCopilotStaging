global class BatchToUpdateContacts implements Database.Batchable<sObject> {
    String contactIds = '';
    global BatchToUpdateContacts(String contactList)
    {
        this.contactIds = contactList;
    }
    global Database.QueryLocator start(Database.BatchableContext bc) {
        String query = 'SELECT id,Updated__c FROM Contact WHERE id IN  ('+ contactIds + ')';
        return Database.getQueryLocator(query);
    }
    global void execute(Database.BatchableContext bc, List<Contact> contacts){
        for(Contact con: contacts)
        {
            con.Updated__c = true;
        }
        Database.update(contacts, false);
    }
    global void finish(Database.BatchableContext bc){
    } 
}