trigger TriggerOnSubMetroArea on Sub_Metro_Area__c (before insert, before update, after insert, after update, after delete) {
    TriggerOnSubMetroAreaHandler handler = new TriggerOnSubMetroAreaHandler(Trigger.new, Trigger.old, Trigger.oldMap);
    if(Trigger.isBefore)
    {
        if(Trigger.IsInsert)
        {
            handler.beforeInsert();
        }
        if(Trigger.IsUpdate)
        {
            handler.beforeUpdate();
        }
    }
    if(Trigger.isAfter)
    {
        if(Trigger.isInsert) {
            handler.afterInsert();
        }
        if(Trigger.isUpdate) {
            handler.afterUpdate();
        }
        if(Trigger.isDelete)
        {
            handler.afterDelete();
        }
    }
}