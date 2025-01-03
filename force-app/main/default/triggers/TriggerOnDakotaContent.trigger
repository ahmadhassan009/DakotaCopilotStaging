trigger TriggerOnDakotaContent on Dakota_Content__c (after insert, before update, before insert,after update,after delete,before delete) {
    TriggerOnDakotaContentHandler handler = new TriggerOnDakotaContentHandler(Trigger.new, Trigger.oldMap);
    
    if(Trigger.isBefore)
    {
        if(Trigger.IsInsert)
        {
            handler.beforeInsert();
        }
        if(Trigger.IsUpdate)
        {
            handler.beforeUpdate();
        }
        if(Trigger.isDelete)
        {
            handler.beforeDelete();
        }
    }
    
    if(Trigger.isAfter)
    {
        if(Trigger.IsInsert)
        {
            handler.afterInsert();
        }
        if(Trigger.IsUpdate)
        {
            handler.afterUpdate();
        }
        if(Trigger.IsDelete)
        {
            handler.afterDelete();
        }
    }
}