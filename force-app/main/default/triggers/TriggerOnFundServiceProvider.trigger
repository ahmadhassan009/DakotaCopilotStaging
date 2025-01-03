trigger TriggerOnFundServiceProvider on Fund_Service_Provider__c (before insert, after delete, before update) {

    TriggerOnFundServiceProviderHandler handler = new TriggerOnFundServiceProviderHandler(Trigger.new, Trigger.oldMap);
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
    else if (Trigger.isAfter) {
        if(Trigger.isDelete)
        {
            handler.afterDelete();
        }
    }
    

}