trigger TriggerOnAccountContactRelation on AccountContactRelation (after insert, after update, before update,after delete) {
    TriggerOnAccountContactRelationHandler handler = new TriggerOnAccountContactRelationHandler(Trigger.new, Trigger.oldMap);
    
    if(Trigger.isAfter)
    {
        if(Trigger.IsInsert)
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
    } else if (Trigger.isBefore) {
        if(Trigger.isUpdate) {
            handler.beforeUpdate();
        }
    }
}