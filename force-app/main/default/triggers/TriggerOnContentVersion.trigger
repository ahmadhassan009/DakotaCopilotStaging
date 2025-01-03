trigger TriggerOnContentVersion on ContentVersion (after insert) {
    TriggerOnContentVersionHandler handler = new TriggerOnContentVersionHandler(Trigger.new);
    if(Trigger.isAfter)
    {
        if(Trigger.isInsert)
        {
            handler.afterInsert();
        }
    }
}