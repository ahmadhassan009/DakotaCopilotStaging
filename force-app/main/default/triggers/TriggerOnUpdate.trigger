trigger TriggerOnUpdate on Update__c (after insert, after update, after delete, before update) {

    TriggerOnUpdateHandler handler = new TriggerOnUpdateHandler(Trigger.new, Trigger.oldMap);

    if (Trigger.isAfter)
    {
        if(Trigger.isDelete)
        {
            handler.afterDelete();
        }
    } else if (Trigger.isBefore) {
        if(Trigger.isUpdate) {
            handler.beforeUpdate();
        }
    }
}