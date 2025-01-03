trigger TriggerOnAcct_Cnct_Relation on Account_Contact_Relation__c (before insert,before update) 
{
    TriggerOnAcct_Cnct_RelationHandler handler = new TriggerOnAcct_Cnct_RelationHandler(Trigger.new, Trigger.oldMap);
    
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