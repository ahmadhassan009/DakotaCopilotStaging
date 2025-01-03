@isTest
public class BatchToDeleteDuplicateDCRelations_Test 
{
    @testSetup
    public static void createTestData()
    {
        Account acct = TestDataFactory.createAccount();
        Contact cnct = TestDataFactory.createContact();
        
        List<Account_Contact_Relation__c> relationRecords = new List<Account_Contact_Relation__c>();
        for(integer i = 0; i<5; i++)
        {
            Account_Contact_Relation__c relation = new Account_Contact_Relation__c();
            relation.Account__c = acct.Id;
            relation.Contact__c = cnct.Id;
            relationRecords.add(relation);
        }
        
        Contact cnct2 = TestDataFactory.createContact();
        Account_Contact_Relation__c relation = new Account_Contact_Relation__c();
        relation.Account__c = acct.Id;
        relation.Contact__c = cnct2.Id;
        relationRecords.add(relation);
        
        insert relationRecords;
    }
    
    @isTest
    public static void testBatchToDeleteDuplicateDCRelations()
    {
        List<Account_Contact_Relation__c> relationRecords = [Select Id from Account_Contact_Relation__c];
        System.assertEquals(6,relationRecords.size());
        
        Test.startTest();
        BatchToDeleteDuplicateDCRelations btch = new BatchToDeleteDuplicateDCRelations();
        Database.executeBatch(btch);
        Test.stopTest();
        
        relationRecords = [Select Id from Account_Contact_Relation__c];
        System.assertEquals(2,relationRecords.size());
    }

}