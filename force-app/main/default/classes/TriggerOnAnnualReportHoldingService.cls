public class TriggerOnAnnualReportHoldingService 
{
    @testVisible static private List<refreshComponents__e> eventList = new List<RefreshComponents__e>();   
    public static void refreshAnnualReportHoldingPanels(List<Annual_Reports_and_Holdings_Data__c> newAnnualReportHoldingsList)
    {
        List<refreshComponents__e> refreshRecordEvents = new List<refreshComponents__e>();
        for (Annual_Reports_and_Holdings_Data__c annualReportHolding : newAnnualReportHoldingsList) {
            refreshRecordEvents.add(new refreshComponents__e(
                recordUsed__c = annualReportHolding.Account__r.Id,
                UserUsed__c = UserInfo.getUserId(),
                userSession__c=UserInfo.getSessionId()
            ));
            eventList.addAll(refreshRecordEvents);
        }
        EventBus.publish(refreshRecordEvents);
    }
}