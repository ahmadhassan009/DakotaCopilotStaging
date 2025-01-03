trigger TriggerOnFormD on Form_D_Offering__c (after insert, after update,after delete) {
    
    TriggerOnFormDHandler handler = new TriggerOnFormDHandler(Trigger.new,Trigger.oldMap);

    if (Trigger.isAfter)
    {
        if(Trigger.isInsert)
        {
            handler.afterCreate();
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