trigger TriggerOnFollow on Follow__c (before insert, after insert) {
    TriggerOnFavoriteHandler handler = new TriggerOnFavoriteHandler(Trigger.new);
    
    if(Trigger.isBefore)
    {
        if(Trigger.IsInsert)
        {
            handler.beforeInsert();
        }
    }
}