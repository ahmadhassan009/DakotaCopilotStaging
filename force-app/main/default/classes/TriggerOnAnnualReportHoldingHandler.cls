public class TriggerOnAnnualReportHoldingHandler 
{
    List<Annual_Reports_and_Holdings_Data__c> annualReportHoldingList;
    Map<ID, Annual_Reports_and_Holdings_Data__c> oldAnnualReportHoldingMap;
    public TriggerOnAnnualReportHoldingHandler (List<Annual_Reports_and_Holdings_Data__c> annualReportHoldingList, Map<Id, Annual_Reports_and_Holdings_Data__c> oldAnnualReportHoldingMap)
    {
        this.annualReportHoldingList = annualReportHoldingList;
        this.oldAnnualReportHoldingMap = oldAnnualReportHoldingMap;
    }
    public void beforeInsert()
    {
        TriggerOnAnnualReportHoldingService.refreshAnnualReportHoldingPanels(this.annualReportHoldingList);
    }
    public void beforeUpdate()
    {
        TriggerOnAnnualReportHoldingService.refreshAnnualReportHoldingPanels(this.annualReportHoldingList);
    }
}