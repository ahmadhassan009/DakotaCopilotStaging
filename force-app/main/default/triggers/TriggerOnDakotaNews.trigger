trigger TriggerOnDakotaNews on Dakota_News__c (before insert, before update) {
    TriggerOnDakotaNewsHandler handler = new TriggerOnDakotaNewsHandler(Trigger.new, Trigger.oldMap);

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