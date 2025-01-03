trigger TriggerOnInvestmentStrategy on Investment_Strategy__c (after insert, before insert, after update,before update, before delete,after delete) {
    TriggerOnInvestmentStrategyHandler handler = new TriggerOnInvestmentStrategyHandler(Trigger.new, Trigger.oldMap);
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
    if(Trigger.isBefore)
    {
        if(Trigger.IsDelete)
        {
            handler.beforeDelete();
        }        
    }
}