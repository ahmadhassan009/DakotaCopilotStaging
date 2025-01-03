trigger TriggerOnEvent on Event (before insert) {
    TriggerOnEventHandler handler = new TriggerOnEventHandler(Trigger.new, Trigger.old, Trigger.oldMap);
    if(Trigger.isBefore)
    {
        if(Trigger.IsInsert)
        {
            handler.beforeInsert();
        }
    }
}