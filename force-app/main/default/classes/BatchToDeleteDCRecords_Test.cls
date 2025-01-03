@isTest
public class BatchToDeleteDCRecords_Test {

    @isTest
    public static void testBatchToDeleteDCRecords()
    {
        Account acct = new Account();
        acct.Name = 'Test Account';
        insert acct;
        
        Contact cnct = new Contact();
        cnct.LastName = 'Test Contact';
        cnct.AccountId = acct.Id;
        insert cnct;
        
        AccountContactRelation newAcctConRel = [Select Id,Roles from AccountContactRelation where ContactId = :cnct.Id];        
        newAcctConRel.Roles = 'DC Consultant';
        update newAcctConRel;
        
        Test.startTest();
        BatchToDeleteDCRecords btch = new BatchToDeleteDCRecords();
        Database.executeBatch(btch);
        Test.stopTest();
    }
}