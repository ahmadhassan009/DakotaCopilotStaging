@isTest
public with sharing class BatchForPopulatingCPRTInContacts_Test {
    @TestSetup
    static void makeData(){

        Contact con = new Contact();
        con.LastName = 'Test Contact A';
        con.title = 'new test title';
        con.Phone = '8888888';
        con.Email = 'abc@gmail.com';
        con.MailingState = 'CA';
        insert con;
        
        Contact con2 = new Contact();
        con2.LastName = 'Con Without CPRA';
        con2.MailingState = 'CA';
        insert con2;
        
        CPRA_Tracking__c cpra =  new CPRA_Tracking__c();
        cpra.Contact__c = con.id;
        cpra.Contact_Field__c = 'Email';
        cpra.source__c = 'www.google.com';
        insert cpra;
        
        CPRA_Tracking__c cpra2 =  new CPRA_Tracking__c();
        cpra2.Contact__c = con.id;
        cpra2.Contact_Field__c = 'Title';
        cpra2.source__c = 'www.google.com';
        insert cpra2;
    }

    @isTest
    static void testBatchForPopulatingCPRTInContacts() 
    {     
        List<Contact> con = [SELECT id, California_Privacy_Regulation_Tracker__c FROM Contact where LastName = 'Test Contact A'];
        con[0].California_Privacy_Regulation_Tracker__c = null;
        update con[0];
        
        Test.startTest();
        BatchForPopulatingCPRTInContacts batchInstance = new BatchForPopulatingCPRTInContacts();
        Database.executeBatch(batchInstance);
        Test.stopTest();
        
        List<Contact> con2 = [SELECT id, California_Privacy_Regulation_Tracker__c FROM Contact where LastName = 'Test Contact A' AND California_Privacy_Regulation_Tracker__c !=null]  ;
        System.assertEquals(1, con2.size(), 'California Privacy Regulation Tracker field is not updated via batch');
        
    }
    
}