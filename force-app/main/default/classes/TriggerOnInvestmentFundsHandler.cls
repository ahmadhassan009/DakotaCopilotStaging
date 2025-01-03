public with sharing class TriggerOnInvestmentFundsHandler {
    
    List<Investment_Funds__c> investmentFundsList;
    Map<Id, Investment_Funds__c> oldInvestmentFundsMap;
    public TriggerOnInvestmentFundsHandler(List<Investment_Funds__c> investmentFundsList,Map<Id, Investment_Funds__c> oldInvestmentFundsMap) {
        this.investmentFundsList=investmentFundsList;
        this.oldInvestmentFundsMap=oldInvestmentFundsMap;
    }

    public void beforeInsert()
    {
        TriggerOnInvestmentFundsService.populateform5500Checkbox(investmentFundsList,oldInvestmentFundsMap);
    }
    
    public void beforeUpdate()
    {
        TriggerOnInvestmentFundsService.populateform5500Checkbox(investmentFundsList,oldInvestmentFundsMap);
        TriggerOnInvestmentFundsService.resetHerokuSyncFlag(this.investmentFundsList, this.oldInvestmentFundsMap);
    }

    public void afterDelete() {
        TriggerOnInvestmentFundsService.deleteRecFromHeroku(this.oldInvestmentFundsMap);
    }
}