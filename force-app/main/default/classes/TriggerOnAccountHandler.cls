public class TriggerOnAccountHandler {
    List<Account> accountList;
    Map<Id, Account> oldAccountMap;
    
    public TriggerOnAccountHandler(List<Account> accountList, Map<Id, Account> oldAccountMap)
    {
        this.accountList = accountList;
        this.oldAccountMap = oldAccountMap;
    }
    
    public void afterInsert()
    {
        TriggerOnAccountService.refreshAccountPannels(accountList);
        TriggerOnAccountService.createNewAccountActivityStream(accountList);
        TriggerOnAccountService.populateNumberOfAccountsOnMetroArea(accountList, oldAccountMap);
        TriggerOnAccountService.updateInsertDataIntegerationsCheckbox(accountList, oldAccountMap);
    }
    
    public void beforeInsert()
    {
        TriggerOnAccountService.updateCountryField(accountList, oldAccountMap);
        TriggerOnAccountService.syncParentIdOfAccount(accountList, oldAccountMap);
        TriggerOnAccountService.updateProductStructure(accountList, oldAccountMap);
    }
    
    public void afterDelete()
    {
        TriggerOnAccountService.populateNumberOfAccountsOnMetroArea(accountList, oldAccountMap);
    }
    
    public void afterUpdate()
    {
        TriggerOnAccountService.populateNumberOfAccountsOnMetroArea(accountList, oldAccountMap);
        TriggerOnAccountService.updateRelatedContactAndAccounts(accountList, oldAccountMap);
        TriggerOnAccountService.updateInsertDataIntegerationsCheckbox(accountList, oldAccountMap);
        TriggerOnAccountService.updateRelatedContacts(accountList, oldAccountMap);
        TriggerOnAccountService.createUpdateRecord(accountList, oldAccountMap);
    }
    
    public void beforeUpdate()
    {
        TriggerOnAccountService.updateCountryField(accountList, oldAccountMap);
        TriggerOnAccountService.syncParentIdOfAccount(accountList, oldAccountMap);
        TriggerOnAccountService.updateProductStructure(accountList, oldAccountMap);      
        TriggerOnAccountService.populateform5500CheckboxOfChildFundServiceAndFundInvestment(accountList, oldAccountMap);
    }
}