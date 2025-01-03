@isTest
public class BatchToUpdateAccProdStructure_Test {
 @isTest
    public static void testBatchToUpdateAcounts()
    {
        Account acc = new Account (
            Name = 'Test Acc',
            Mutual_Fund__c = true,
            ETF__c = true,
            Limited_Partnership__c = true,
            Separate_Account__c = true,
            CIT__c = true
        );
        insert acc;
        List<Account> accList = new List<Account>();
        accList.add(acc);
        BatchToUpdateAccountsProductStructure btch = new BatchToUpdateAccountsProductStructure('\''+acc.Id+'\'');
        Database.BatchableContext bc;
        btch.start(bc);  
        btch.execute(bc, accList);
        btch.finish(bc);
    }
}