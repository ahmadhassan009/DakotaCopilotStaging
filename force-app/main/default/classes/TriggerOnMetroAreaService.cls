public with sharing class TriggerOnMetroAreaService {
    public static void updateAccountsAndContacts(List<Metro_Area__c> newMetroAreas, Map<Id, Metro_Area__c> oldMetroAreas) {
        List<Id> metroAreaIds = new List<Id>();
        for(Metro_Area__c mt: newMetroAreas)
        {
            if(mt.Name != oldMetroAreas.get(mt.Id).Name)
            {
                metroAreaIds.add(mt.Id);
            }
        }
        
        if(metroAreaIds!=null && metroAreaIds.size()>0)
        {
            List<Contact> contacts = [SELECT Id,Updated__c,Metro_Area__c 
                                      FROM Contact 
                                      WHERE Metro_Area__c IN: metroAreaIds];
            List<String> contactsTobeUpdated = new List<String>();
            
            List<Account> accs = [SELECT Id, Updated__c, MetroArea__c
                                  FROM Account 
                                  WHERE MetroArea__c IN: metroAreaIds];
            List<String> accsTobeUpdated = new List<String>();
            
            if(accs!=null && accs.size()>0){
                for(Account account: accs)
                {
                    accsTobeUpdated.add('\''+account.Id+'\'');
                }
            }
            if(contacts!=null && contacts.size()>0){
                for(Contact conn: contacts)
                {
                    contactsTobeUpdated.add('\''+conn.Id+'\'');
                }
            }
            if(contactsTobeUpdated !=null && contactsTobeUpdated.size()>0)
            {
                Database.executeBatch(new BatchToUpdateContacts(String.join(contactsTobeUpdated, ',' )),50);
            }
            if(accsTobeUpdated!=null && accsTobeUpdated.size()>0)
            {
                Database.executeBatch(new BatchToUpdateAccounts(String.join(accsTobeUpdated, ',' )),50);
            }
        }
    }
}