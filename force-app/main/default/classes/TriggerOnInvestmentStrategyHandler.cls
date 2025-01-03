public class TriggerOnInvestmentStrategyHandler {
    List<Investment_Strategy__c> investmentStrategyList;
    Map<Id, Investment_Strategy__c> oldInvestmentStrategyMap;
    
    public TriggerOnInvestmentStrategyHandler(List<Investment_Strategy__c> investmentStrategyList, Map<Id, Investment_Strategy__c> oldInvestmentStrategyMap)
    {
        this.investmentStrategyList = InvestmentStrategyList;
        this.oldInvestmentStrategyMap = oldInvestmentStrategyMap;
    }
    public void afterInsert()
    {
        TriggerOnInvestmentStrategyService.updateProductStructureonAccount(investmentStrategyList, oldInvestmentStrategyMap);
        TriggerOnInvestmentStrategyService.updateRelatedAccountsFormD(investmentStrategyList, oldInvestmentStrategyMap);
    }
    
    public void afterUpdate()
    {
        TriggerOnInvestmentStrategyService.updateProductStructureonAccount(investmentStrategyList, oldInvestmentStrategyMap);
        TriggerOnInvestmentStrategyService.removeProductStructure(investmentStrategyList, oldInvestmentStrategyMap);
        TriggerOnInvestmentStrategyService.updateRelatedAccountsFormD(investmentStrategyList, oldInvestmentStrategyMap);
    }
    
    public void beforeDelete()
    {
        TriggerOnInvestmentStrategyService.removeProductStructure(investmentStrategyList, oldInvestmentStrategyMap);
    }

    public void afterDelete()
    {        
        TriggerOnInvestmentStrategyService.updateRelatedAccountsFormD(investmentStrategyList, oldInvestmentStrategyMap);
    }

}