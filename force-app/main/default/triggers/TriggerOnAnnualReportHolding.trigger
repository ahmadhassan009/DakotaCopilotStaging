trigger TriggerOnAnnualReportHolding on Annual_Reports_and_Holdings_Data__c (before insert,before update) 
{
    TriggerOnAnnualReportHoldingHandler handler = new TriggerOnAnnualReportHoldingHandler(Trigger.new, Trigger.oldMap);
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
}