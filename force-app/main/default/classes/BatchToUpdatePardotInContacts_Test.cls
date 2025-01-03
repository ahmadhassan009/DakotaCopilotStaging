@isTest
public with sharing class BatchToUpdatePardotInContacts_Test {
    
    @isTest
    public static void testBatchToUpdatePardotInContacts()
    {
        Contact conn = new Contact (
            LastName = 'Test Contact'
        );
       conn.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();

        insert conn;
        List<Contact> connList = new List<Contact>();
        connList.add(conn);
        BatchToUpdatePardotInContacts btch = new BatchToUpdatePardotInContacts('\''+conn.Id+'\'');
        Database.BatchableContext bc;
        btch.start(bc);  
        btch.execute(bc, connList);
        btch.finish(bc);
        System.assert([SELECT Updated__c FROM Contact WHERE Pardot_Domain__c=null Limit 1].size()>0);
    }
}