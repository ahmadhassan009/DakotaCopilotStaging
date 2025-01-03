global class BatchToUpdateAccounts implements Database.Batchable<sObject> {
    String accountIds = '';
    global BatchToUpdateAccounts(String accountList)
    {
        this.accountIds = accountList;
    }
    global Database.QueryLocator start(Database.BatchableContext bc) {
        String query = 'SELECT id,Updated__c FROM Account WHERE id IN  ('+ accountIds + ')';
        return Database.getQueryLocator(query);
    }
    global void execute(Database.BatchableContext bc, List<Account> accounts){
        for(Account acc: accounts)
        {
            acc.Updated__c = true;
        }
        Database.update(accounts, false);
    }
    global void finish(Database.BatchableContext bc){
    } 
}