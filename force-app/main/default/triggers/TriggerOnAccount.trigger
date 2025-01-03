trigger TriggerOnAccount on Account (after insert, before insert, after delete, after update, before update) {
    
    TriggerOnAccountHandler handler = new TriggerOnAccountHandler(Trigger.new, Trigger.oldMap);
    
    if(Trigger.isAfter)
    {
        if(Trigger.IsInsert)
        {
            handler.afterInsert();
        }
        if(Trigger.IsDelete)
        {
            handler.afterDelete();
        }
        if(Trigger.IsUpdate)
        {
            handler.afterUpdate();
        }
    }
    
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
}