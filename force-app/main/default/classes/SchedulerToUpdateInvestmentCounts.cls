global class SchedulerToUpdateInvestmentCounts implements Schedulable {
    
    global void execute(SchedulableContext ctx) {
        Integer publicInvestmentCount = [SELECT count() FROM Investment__c WHERE RecordType.DeveloperName = 'Public_Investment'];
        Integer filingInvestmentCount = [SELECT count() FROM Investment__c WHERE RecordType.DeveloperName = 'X13F_Filings'];
        
        Investment_Counts__c investCount = Investment_Counts__c.getInstance('Investment Record Counts');
        investCount.Public_Investment_Count__c = publicInvestmentCount;
        investCount.X13F_Fillings_Investment_Count__c = filingInvestmentCount;
        
        try {
            update investCount;
        } catch(Exception ex) {
            System.debug(ex.getMessage());
        }
    }
}