public class TriggerOnInvestmentService {

    @testVisible static private List<refreshComponents__e> eventList = new List<refreshComponents__e>();   
    public static void refreshInvestmentPanels(List<Investment__c> newInvestmentsList)
    {
        List<refreshComponents__e> refreshRecordEvents = new List<refreshComponents__e>();
        for (Investment__c inv : newInvestmentsList) {
            refreshRecordEvents.add(new refreshComponents__e(
                recordUsed__c = inv.Account__r.Id,
                UserUsed__c = UserInfo.getUserId(),
                userSession__c = UserInfo.getSessionId()
            ));
            eventList.addAll(refreshRecordEvents);
        }
        EventBus.publish(refreshRecordEvents);
    }
   
    public static void resetHerokuSyncFlag(List<Investment__c> newInvestments, Map<Id,Investment__c> oldInvestmentsMap)
    {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('Investments');
        helperObj.resetHerokuSyncFlag((List<SObject>)newInvestments, (Map<Id, SObject>)oldInvestmentsMap);
    }

    public static void deleteRecFromHeroku(Map<Id,Investment__c> oldInvestmentsMap)
    {
        System.enqueueJob(new DeleteRecFromHeroku(oldInvestmentsMap.keySet(),'Investments'));
    }
}