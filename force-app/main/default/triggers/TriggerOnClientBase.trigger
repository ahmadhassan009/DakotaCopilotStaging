trigger TriggerOnClientBase on Client_Base__c (before insert, after insert, before update, after update,after delete) {
    TriggerOnClientBaseHelper handler = new TriggerOnClientBaseHelper(Trigger.new, Trigger.oldMap);
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
    else if(Trigger.isAfter)
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