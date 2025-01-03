public class TriggerOnAccountContactRelationHandler {
    List<AccountContactRelation> AccountContactRelationList;
    Map<Id, AccountContactRelation> oldAccountContactRelationMap;
    
    public TriggerOnAccountContactRelationHandler(List<AccountContactRelation> AccountContactRelationList, Map<Id, AccountContactRelation> oldAccountContactRelationMap)
    {
        this.AccountContactRelationList = AccountContactRelationList;
        this.oldAccountContactRelationMap = oldAccountContactRelationMap;
    }
    
    public void afterInsert()        
    {
        TriggerOnAccountContactRelationService.refreshAccountContactRelation(AccountContactRelationList);
        TriggerOnAccountContactRelationService.updateNotaFitForDakotaTalentFlagInContacts(AccountContactRelationList);
    }
	
    public void afterUpdate()
    {
        TriggerOnAccountContactRelationService.refreshAccountContactRelation(AccountContactRelationList);
        TriggerOnAccountContactRelationService.updateNotaFitForDakotaTalentFlagInContacts(AccountContactRelationList);
        
    }
    public void beforeUpdate() {
        TriggerOnAccountContactRelationService.resetHerokuSyncFlag(AccountContactRelationList, oldAccountContactRelationMap);
    }

    public void afterDelete() {
        TriggerOnAccountContactRelationService.deleteRecFromHeroku(oldAccountContactRelationMap);
    }
}