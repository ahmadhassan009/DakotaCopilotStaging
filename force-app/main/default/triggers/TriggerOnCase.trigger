trigger TriggerOnCase on Case (before insert,before update, after insert) {

    TriggerOnCaseHandler handler = new TriggerOnCaseHandler(Trigger.new, Trigger.oldMap);

    if(Trigger.isBefore)
    {
        if(Trigger.isInsert)
        {
            handler.beforeInsert();
        }
        if(Trigger.isUpdate)
        {
            handler.beforeUpdate();
        }
    }
    if(Trigger.isAfter)
    {
        if(Trigger.isInsert)
        {
            handler.afterInsert();
        }
    }
}