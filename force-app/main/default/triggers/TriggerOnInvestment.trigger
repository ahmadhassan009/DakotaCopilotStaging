trigger TriggerOnInvestment on Investment__c (before insert, after delete, before update) {
    
    TriggerOnInvestmentHandler handler = new TriggerOnInvestmentHandler(Trigger.new, Trigger.oldMap);

    if (Trigger.isAfter)
    {
        if(Trigger.isDelete)
        {
            handler.afterDelete();
        }
    } 
    else if (Trigger.isBefore)
    {
        if(Trigger.isUpdate) {
            handler.beforeUpdate();
        }
        if(Trigger.isInsert)
        {
            handler.beforeInsert();
        }
    }
}