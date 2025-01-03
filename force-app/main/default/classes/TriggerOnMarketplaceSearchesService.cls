public class TriggerOnMarketplaceSearchesService {
    @testVisible private static List<refreshComponents__e> eventList = new List<RefreshComponents__e>();
    
    public static void refreshMarketPlaceSearchesPanels(List<Marketplace_Searches__c> newSearches)
    {
        List<refreshComponents__e> refreshRecordEvents = new List<refreshComponents__e>();
        for (Marketplace_Searches__c search : newSearches) {
            refreshRecordEvents.add(new refreshComponents__e(
                recordUsed__c = search.Metro_Area__r.Id,
                UserUsed__c = UserInfo.getUserId(),
                userSession__c=UserInfo.getSessionId()
            ));
            eventList.addAll(refreshRecordEvents);
        }
        EventBus.publish(refreshRecordEvents);
    }
}