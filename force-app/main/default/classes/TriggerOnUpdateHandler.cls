public with sharing class TriggerOnUpdateHandler {
    List<Update__c> newUpdates;
    Map<Id, Update__c> oldUpdates;
    public TriggerOnUpdateHandler(List<Update__c> newUpdates, Map<Id, Update__c> oldUpdates) {
        this.newUpdates = newUpdates;
        this.oldUpdates = oldUpdates;
    }
    public void beforeUpdate() {
        TriggerOnUpdateService.resetHerokuSyncFlag(this.newUpdates, this.oldUpdates);
    }

    public void afterDelete() {
        TriggerOnUpdateService.deleteRecFromHeroku(this.oldUpdates);
    }
}