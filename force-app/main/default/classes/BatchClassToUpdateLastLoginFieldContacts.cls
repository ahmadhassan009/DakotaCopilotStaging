global class BatchClassToUpdateLastLoginFieldContacts implements Database.Batchable<sObject> {
    global Database.QueryLocator start(Database.BatchableContext BC) {
        String query = '';
        if(Test.isRunningTest()) {
            query = 'SELECT Id, Username, Name, ContactId, LastLoginDate FROM User WHERE is_community_user__c =true AND isActive = true limit 50';
        } else {
            query = 'SELECT Id, Username, Name, ContactId, LastLoginDate FROM User WHERE is_community_user__c =true AND isActive = true';

        }
        return Database.getQueryLocator(query);
    }
    
    global void execute(Database.BatchableContext BC, List<User> userList) {
        List<Contact> contactsToUpdate = new List<Contact>();
        for(User u : userList) {
            if(u.LastLoginDate != null && u.ContactId !=null)
            contactsToUpdate.add(new Contact(Id = u.ContactId, User_Last_Login_Date__c = u.LastLoginDate.date()));
            
        }
        if(contactsToUpdate.size() > 0)
        update contactsToUpdate;

    }
    
    global void finish(Database.BatchableContext BC) {
        // Perform any post-processing tasks
    }
}