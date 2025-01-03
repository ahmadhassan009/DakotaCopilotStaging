public with sharing class TriggerOnUpdateService {

    public static void resetHerokuSyncFlag(List<Update__c> newUpdates, Map<Id,Update__c> oldUpdatesMap)
    {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('update');
        helperObj.resetHerokuSyncFlag((List<SObject>)newUpdates, (Map<Id, SObject>)oldUpdatesMap);
    }

    public static void deleteRecFromHeroku(Map<Id,Update__c> oldUpdatesMap)
    {
        System.enqueueJob(new DeleteRecFromHeroku(oldUpdatesMap.keySet(),'update'));
    }
}