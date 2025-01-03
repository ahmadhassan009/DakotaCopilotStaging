trigger TriggerOnKnowledgeBase on Knowledge_Base__c (before insert,before update) {
    TriggerOnKnowledgeBaseHandler handler = new TriggerOnKnowledgeBaseHandler(Trigger.new,Trigger.oldMap);
    
    if(Trigger.isBefore)
    {
        if(Trigger.IsInsert || Trigger.isUpdate)
        {
            handler.beforeInsert();
        }
    }
}