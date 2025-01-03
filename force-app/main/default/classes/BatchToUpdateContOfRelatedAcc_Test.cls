@isTest
public with sharing class BatchToUpdateContOfRelatedAcc_Test {
    @TestSetup
    static void makeData(){
        Account account1 = new Account();
        account1.Name = 'Test Account 1';
        account1.Not_a_fit_for_MarketplaceII__c = true;
        insert account1;

        

        Contact conn = new Contact (
            LastName = 'Test Contact',
            AccountId = account1.Id
        );
        
        Contact conn2 = new Contact (
            LastName = 'Test Contact',
            AccountId = account1.Id
        );

        List<Contact> conList = new List<Contact>{conn,conn2};
        insert conList;
    }
    
     @isTest
     public static void testBatchToUpdateRelatedContacts()
     {
         Account acc = [SELECT Id FROM Account WHERE Name = 'Test Account 1'];
         BatchToUpdateContactsOfRelatedAccounts btch = new BatchToUpdateContactsOfRelatedAccounts('\''+acc.Id+'\'');
         List<AccountContactRelation> acRelationList = new List<AccountContactRelation>([SELECT ContactId , Contact.Not_a_fit_for_MarketplaceII__c, Contact.Account.Not_a_fit_for_MarketplaceII__c FROM AccountContactRelation WHERE AccountId = :acc.Id]);
         
         Database.BatchableContext bc;
         btch.start(bc);  
         btch.execute(bc, acRelationList);
         btch.finish(bc);
         System.assertEquals(true, [SELECT Id, Not_a_fit_for_MarketplaceII__c FROM Contact Limit 1].Not_a_fit_for_MarketplaceII__c);
     }
}