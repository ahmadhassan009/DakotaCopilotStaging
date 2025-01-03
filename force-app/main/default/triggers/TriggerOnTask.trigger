trigger TriggerOnTask on Task (before insert) {
    TriggerOnTaskHandler handler = new TriggerOnTaskHandler(Trigger.new);
    if(Trigger.isBefore)
    {
        if(Trigger.IsInsert)
        {
            handler.beforeInsert();
        }
    }
}