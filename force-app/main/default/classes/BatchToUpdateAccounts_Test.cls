@isTest
public with sharing class BatchToUpdateAccounts_Test {
   
    @isTest
    public static void testBatchToUpdateAcounts()
    {
        Account acc = new Account (
            Name = 'Test Acc'
        );
        insert acc;
        List<Account> accList = new List<Account>();
        accList.add(acc);
        BatchToUpdateAccounts btch = new BatchToUpdateAccounts('\''+acc.Id+'\'');
        Database.BatchableContext bc;
        btch.start(bc);  
        btch.execute(bc, accList);
        btch.finish(bc);
        System.assertEquals(true, [SELECT Updated__c FROM Account Limit 1].Updated__c);
    }
}