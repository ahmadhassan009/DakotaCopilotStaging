trigger EventSlackTrigger on Event (after insert, after update, after delete) {

    TriggerOnEventHandler handler = new TriggerOnEventHandler(Trigger.new, Trigger.old, Trigger.oldMap);
    //DPS-171 Only work on these trigger events
    if (Trigger.isInsert || Trigger.isUpdate || Trigger.isDelete) {
        if(handler.checkIfUserExists()) {
            return;
        }
    }
    //DSC-772: Refactor EventSlackTrigger
    if(Trigger.isInsert)
    {
        handler.afterInsert();
    }
    if(Trigger.isUpdate)
    {
        handler.afterUpdate();
    }
    if(Trigger.isDelete)
    {
        handler.afterDelete();
    }
}