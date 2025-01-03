public with sharing class triggerOnCPRATrackingHelper {
    List<CPRA_Tracking__c> newCPRATrackingeList;
    Map<ID, CPRA_Tracking__c> oldCPRATrackingMap;
    public triggerOnCPRATrackingHelper(List<CPRA_Tracking__c> newCPRATrackingeList, Map<ID, CPRA_Tracking__c> oldCPRATrackingMap) {
        this.newCPRATrackingeList = newCPRATrackingeList;
        this.oldCPRATrackingMap = oldCPRATrackingMap;
    }
    public void afterInsert()
    {
        TriggerOnCPRATrackingService.updateCPRTrackerInContact(this.newCPRATrackingeList,this.oldCPRATrackingMap);
    }
    public void afterUpdate()
    {
        TriggerOnCPRATrackingService.updateCPRTrackerInContact(this.newCPRATrackingeList,this.oldCPRATrackingMap);
    }
    public void afterDelete()
    {
        TriggerOnCPRATrackingService.updateCPRTrackerInContact(this.newCPRATrackingeList,this.oldCPRATrackingMap);
    }
}