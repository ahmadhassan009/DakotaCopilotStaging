trigger TriggerOnMarketplaceSearches on Marketplace_Searches__c (before insert,after insert, after update, before delete, after delete){
    
    TriggerOnMarketplaceSearchesHandler handler = new TriggerOnMarketplaceSearchesHandler(Trigger.new, Trigger.oldMap);
    if(Trigger.isAfter)
    {
        if(Trigger.isInsert)
        {
            handler.afterInsert();
        }
        if(Trigger.isUpdate)
        {
            handler.afterUpdate();
        }
    }
    
}