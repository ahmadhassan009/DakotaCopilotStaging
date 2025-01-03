public with sharing class BatchToUpdateContactsOfRelatedAccounts implements Database.Batchable<sObject> {
    String accountIds = '';
    public  BatchToUpdateContactsOfRelatedAccounts(String accountList)
    {
        this.accountIds = accountList;
    }
    public Database.QueryLocator start(Database.BatchableContext bc) {
        String query = 'SELECT ContactId , Contact.Not_a_fit_for_MarketplaceII__c, Contact.Account.Not_a_fit_for_MarketplaceII__c FROM AccountContactRelation WHERE AccountId IN  ('+ accountIds + ')';
        return Database.getQueryLocator(query);

    }
    public void execute(Database.BatchableContext bc, List<AccountContactRelation> acRelationList){
        Set<Contact> conSet = new Set<Contact>();
        for(AccountContactRelation acRelation: acRelationList)
        {
            Contact con = new Contact();
            con.Id = acRelation.ContactId;
            con.Not_a_fit_for_MarketplaceII__c = acRelation.Contact.Account.Not_a_fit_for_MarketplaceII__c;
            conSet.add(con);
        }
        Database.update(new List<Contact>(conSet), true);
    }
    public void finish(Database.BatchableContext bc){
    } 
}