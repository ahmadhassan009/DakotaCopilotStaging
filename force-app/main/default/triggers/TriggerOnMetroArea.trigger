trigger TriggerOnMetroArea on Metro_Area__c (after update) {

    TriggerOnMetroAreaHandler handler = new TriggerOnMetroAreaHandler(Trigger.new, Trigger.oldMap);

    if(Trigger.isAfter)
    {
        if(Trigger.isUpdate)
        {
            handler.afterUpdate();
        }
    }
}