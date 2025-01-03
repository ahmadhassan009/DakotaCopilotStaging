@isTest
public class TriggerOnMarketplaceSearches_Test {
    
    @isTest
    public static void testMarketplaceSearchesEvent()
    {
        Marketplace_Searches__c mrktplaceSr = new Marketplace_Searches__c();
        mrktplaceSr.Name = 'test search records';
        insert mrktplaceSr;
        System.assert(TriggerOnMarketplaceSearchesService.eventList.size()==1);
        
        mrktplaceSr.Amount__c = 123456;
        update mrktplaceSr;
        System.assert(TriggerOnMarketplaceSearchesService.eventList.size()==2);
    }
}