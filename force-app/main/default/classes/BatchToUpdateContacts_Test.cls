@isTest
public with sharing class BatchToUpdateContacts_Test {
    
    @isTest
    public static void testBatchToUpdateContacts()
    {
        Contact conn = new Contact (
            LastName = 'Test Contact'
        );
        insert conn;
        List<Contact> connList = new List<Contact>();
        connList.add(conn);
        BatchToUpdateContacts btch = new BatchToUpdateContacts('\''+conn.Id+'\'');
        Database.BatchableContext bc;
        btch.start(bc);  
        btch.execute(bc, connList);
        btch.finish(bc);
        System.assertEquals(true, [SELECT Updated__c FROM Contact Limit 1].Updated__c);
    }
}