@isTest
public with sharing class BatchForSearchesEmailAlert_Test {

    @testSetUp
    public static void createData()
    {             
        Account acct = new Account();
        acct.Name = 'Test Account';
        acct.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        insert acct;
        
        Marketplace_Searches__c search = new Marketplace_Searches__c();
        search.Name = 'Test Search';
        search.Asset_Class__c = 'International Equities';
        search.Send_Alert__c = false;
        search.Account__c = acct.Id;
        insert search;
        
        List<Contact> contacts = new List<Contact>();
        for(integer i=0 ; i<50; i++)
        {
            Contact cnct = new Contact();
            cnct.LastName = 'Test';
            cnct.LastName = 'Test Contact '+i;
            cnct.Account = acct;
            cnct.Searches_Email__c = true;
            cnct.Searches_Asset_Class__c = 'International Equities';
            cnct.email = 'draftcrm@rolustech.com';
            contacts.add(cnct);
        }
        insert contacts;
    }

    @IsTest
    public static void testSendSearchesAssetClassEmail(){
        Marketplace_Searches__c search = [Select Id,Name,Asset_Class__c,Account__c,Account__r.Name,Consultant__c,
                                        Consultant__r.Name,Contact__c,Contact__r.Name,Sub_Asset_Class__c,
                                        Description__c,End_Date__c,Amount__c,Emerging_Manager_Search__c,Search_URL__c,
                                        Search_Status__c,Requirements__c,Additional_Information__c,Pacing_Information__c
                                        from Marketplace_Searches__c where Name = 'Test Search' Limit 1];
        List<Contact> con = [Select Id,FirstName,Searches_Email__c, email  from Contact where Searches_Email__c = true and Searches_Asset_Class__c = 'International Equities'];                                
        Test.startTest();
        BatchForSearchesEmailAlert b = new BatchForSearchesEmailAlert(con,search); 
        database.executebatch(b,50);
        Test.stopTest();
        String taskSubject = 'New Search Alert for '+ search.Account__r.Name;
        List <Task> tasks = [Select Id, Subject from Task where Subject =:taskSubject];
        System.assert(tasks.size()==50);      
    }
}