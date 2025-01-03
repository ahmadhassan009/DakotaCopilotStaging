public class TriggerOnMarketplaceSearchesHandler {
    List<Marketplace_Searches__c> newRecords;
    Map<Id,Marketplace_Searches__c> oldRecords;
    
    public TriggerOnMarketplaceSearchesHandler( List<Marketplace_Searches__c> newValues, Map<Id,Marketplace_Searches__c> oldValues) {
        this.newRecords = newValues;
        this.oldRecords = oldValues;
    }
    
    public void afterInsert()
    {
        TriggerOnMarketplaceSearchesService.refreshMarketPlaceSearchesPanels(newRecords); 
    }
    public void afterUpdate()
    {
        TriggerOnMarketplaceSearchesService.refreshMarketPlaceSearchesPanels(newRecords); 
    }

}