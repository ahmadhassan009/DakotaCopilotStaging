trigger triggerOnCPRATracking on CPRA_Tracking__c (after insert, after update, after delete) {
triggerOnCPRATrackingHelper handler = new triggerOnCPRATrackingHelper(Trigger.new, Trigger.oldMap);
    if (Trigger.isAfter)
    {
        if(Trigger.IsInsert)
        {
            handler.afterInsert();
        }
        if(Trigger.IsUpdate)
        {
            handler.afterUpdate();
        }
        if(Trigger.IsDelete)
        {
            handler.afterDelete();
        }
    }
}