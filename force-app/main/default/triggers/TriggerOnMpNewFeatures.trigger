trigger TriggerOnMpNewFeatures on MP_New_Features__c (before insert, before update) {
    TriggerOnMpNewFeaturesHandler handler = new TriggerOnMpNewFeaturesHandler(Trigger.new, Trigger.oldMap);

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