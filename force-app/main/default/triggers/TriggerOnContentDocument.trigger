trigger TriggerOnContentDocument on ContentDocument (before delete) {
     TriggerOnContentDocumentHandler handler = new TriggerOnContentDocumentHandler(Trigger.old);
    if(Trigger.isBefore)
    {
        if(Trigger.IsDelete)
        {
            handler.beforeDelete();
        }
    }
}