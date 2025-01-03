trigger TriggerOnContact on Contact (after insert, before insert, after update, before delete, after delete,before update) {
    if (System.Label.isContactTriggerActive == 'true') {        
        TriggerOnContactHandler handler = new TriggerOnContactHandler(Trigger.new, Trigger.oldMap, Trigger.newMap);
        
        if(Trigger.isBefore)
        {
            if(Trigger.isDelete)
            {
                handler.beforeDelete();
            }
            if(Trigger.isUpdate)
            {
                handler.beforeUpdate();
            }
        if(Trigger.isInsert)
            {
                handler.beforeInsert();
            }
        }
        
        if(Trigger.isAfter)
        {
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
    }
}