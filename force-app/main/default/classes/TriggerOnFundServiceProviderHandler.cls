public class TriggerOnFundServiceProviderHandler {
    
    
    List<Fund_Service_Provider__c> fundServiceProviderList;
    Map<Id, Fund_Service_Provider__c> oldFundServiceMap;

    public TriggerOnFundServiceProviderHandler(List<Fund_Service_Provider__c> fundServiceProviderList,Map<Id, Fund_Service_Provider__c> oldFundServiceMap) {

        this.fundServiceProviderList=fundServiceProviderList;
        this.oldFundServiceMap=oldFundServiceMap;
    }

    public void beforeInsert()
    {
        TriggerOnFundServiceProviderService.populateform5500Checkbox(fundServiceProviderList,oldFundServiceMap);
    }
    
    public void beforeUpdate()
    {
        TriggerOnFundServiceProviderService.populateform5500Checkbox(fundServiceProviderList,oldFundServiceMap);
        TriggerOnFundServiceProviderService.resetHerokuSyncFlag(this.fundServiceProviderList, this.oldFundServiceMap);
    }

    public void afterDelete() {
        TriggerOnFundServiceProviderService.deleteRecFromHeroku(this.oldFundServiceMap);
    }
    
}