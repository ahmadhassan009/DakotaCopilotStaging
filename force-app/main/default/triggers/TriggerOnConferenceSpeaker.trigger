trigger TriggerOnConferenceSpeaker on Conference_Speaker__c (before insert,before update) {
    TriggerOnConferenceSpeakerHandler handler = new TriggerOnConferenceSpeakerHandler(Trigger.new, Trigger.oldMap);
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