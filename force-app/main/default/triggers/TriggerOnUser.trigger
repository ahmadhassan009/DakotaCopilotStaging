trigger TriggerOnUser on User (after insert, after update,before update ) {
    if (System.Label.isUserTriggerActive == 'true' || Test.isRunningTest()) {
        TriggerOnUserHandler handler = new TriggerOnUserHandler(Trigger.new, Trigger.newMap, Trigger.oldMap);
    
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
        }
        if(Trigger.isBefore)
        {
            if(Trigger.IsUpdate)
            {
                handler.beforeUpdate();
            }
        }
    }
}