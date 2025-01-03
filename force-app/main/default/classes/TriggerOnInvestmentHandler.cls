public class TriggerOnInvestmentHandler {

    List<Investment__c> investmentList;
    Map<Id, Investment__c> oldInvestments;

    public TriggerOnInvestmentHandler (List<Investment__c> investmentList, Map<Id, Investment__c> oldInvestmentsMap)
    {
        this.investmentList = investmentList;
        this.oldInvestments = oldInvestmentsMap;
    }
    public void beforeInsert()
    {
        TriggerOnInvestmentService.refreshInvestmentPanels(this.investmentList);
    }
    public void beforeUpdate()
    {
        TriggerOnInvestmentService.refreshInvestmentPanels(this.investmentList);
        TriggerOnInvestmentService.resetHerokuSyncFlag(this.investmentList, this.oldInvestments);
    }

    public void afterDelete() {        
        if(System.Label.InvestmentDeleteHerokuTriggerOnOff=='on'){
            TriggerOnInvestmentService.deleteRecFromHeroku(this.oldInvestments);
        }
    }
}