@isTest
public class BatchToUpdateHerokuSyncOfInves_Test {

    @testSetUp
    public static void createData()
    {
        Account acc = TestDataFactory.createAccount();
        Investment__c inv = TestDataFactory.createInvestmentRecord(acc.Id);
    }
    
    @isTest
    public static void testUpdateAverageTicketSizeOnAccount()
    {        
        Test.startTest();
        Id batchInstanceId = Database.executeBatch(new BatchToUpdateHerokuSyncOfInvestments(), 50);
        Test.stopTest();
    }
}