@isTest
public with sharing class BatchToUpdateDuplicateInsuranceCont_Test {
    
    @isTest
    public static void testBatchToUpdateDuplicateInsuranceContacts()
    {
        Account parentAcc = new Account (
            Name = 'Tes Parent Account'
        );
        insert parentAcc;
        Account childAcc = new Account (
            Name = 'Tes Child Account',
         //   Parent_Account__c = parentAcc.id,
            Type ='Insurance Company General Account',
            Copyright__c = 'A.M.'
        );
        insert childAcc;
        List<Contact> testContacts = new List<Contact>();
        for(integer i=0; i< 10; i++)
        {
            Contact con = new Contact (
                LastName = 'Test Contact',
                AccountId = childAcc.id
            );
            testContacts.add(con);
        }
        
        insert testContacts;

        Test.startTest();
        Id batchInstanceId = Database.executeBatch(new BatchToUpdateDuplicateInsuranceContacts(), 50);
        Test.stopTest();
    }
}