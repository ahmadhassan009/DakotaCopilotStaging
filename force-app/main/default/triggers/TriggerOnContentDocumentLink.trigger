trigger TriggerOnContentDocumentLink on ContentDocumentLink (before insert, after insert) {
    TriggerOnContentDocumentLinkHandler handler = new TriggerOnContentDocumentLinkHandler(Trigger.new);
    if(Trigger.isBefore)
    {
        if(Trigger.IsInsert)
        {
            handler.beforeInsert();
        }
    }
    if(Trigger.isAfter)
    {
        if(Trigger.IsInsert)
        {
            handler.afterInsert();
        }
    }
   
}