trigger TriggerOnMemberNotes on Member_Comments__c (after insert, after delete) {

    TriggerOnMemberNotesHandler handler;

    if(Trigger.isAfter)
    {
        if(Trigger.isInsert)
        {
            handler = new TriggerOnMemberNotesHandler(Trigger.new, Trigger.old, Trigger.oldMap);
            handler.afterInsert();
        }
    }

    if(Trigger.isAfter)
    {
        if(Trigger.isDelete)
        {
            handler = new TriggerOnMemberNotesHandler(null, Trigger.old, Trigger.oldMap);
            handler.afterDelete();
        }
    }
}