trigger TriggerOnInvestmentFunds on Investment_Funds__c (before insert,after delete, before update) {
    TriggerOnInvestmentFundsHandler handler = new TriggerOnInvestmentFundsHandler(Trigger.new, Trigger.oldMap);
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
    }
    else if(Trigger.isAfter) {
        if(Trigger.isDelete)
        {
            handler.afterDelete();
        }
    }
}