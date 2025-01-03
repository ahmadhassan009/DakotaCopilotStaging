trigger TriggerOnConference on Conference__c (before insert, before update) {

    TriggerOnConferenceHandler handler = new TriggerOnConferenceHandler(Trigger.new);
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