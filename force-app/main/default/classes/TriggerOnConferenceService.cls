public class TriggerOnConferenceService {

    @testVisible static private List<refreshComponents__e> eventList = new List<refreshComponents__e>();   
    public static void refreshConferencePanels(List<Conference__c> newConferencesList)
    {
        List<refreshComponents__e> refreshRecordEvents = new List<refreshComponents__e>();
        for (Conference__c conference : newConferencesList) {
                refreshRecordEvents.add(new refreshComponents__e(
                recordUsed__c = conference.Metro_Area__r.Id,
                UserUsed__c = UserInfo.getUserId(),
                userSession__c=UserInfo.getSessionId()
            ));
            eventList.addAll(refreshRecordEvents);
        }
        EventBus.publish(refreshRecordEvents);
    }
}