public with sharing class InvestmentHoldingsController {
    
    @AuraEnabled
    public static  Map<String, String> getRecordsTypeIds()
    {
        Map<String, Schema.RecordTypeInfo> investmentholdingRecTypes = Schema.getGlobalDescribe().get('Investment_Holdings__c').getDescribe().getRecordTypeInfosByDeveloperName();
        List<String> recordTypes = new List<String>{'Alternative_Holdings', 'Equity_Holdings', 'Fixed_Income_Holdings', 'Preferred_Stock_Holdings'};
        Map<String, String> recordTypeIdMap=new Map<String, String>();
        for(string rectype: recordTypes)
        {
            Id recordTypeId = investmentholdingRecTypes.get(rectype).getRecordTypeId();
            recordTypeIdMap.put(rectype,recordTypeId);
        }
        return recordTypeIdMap;
    }
    
    @AuraEnabled
    public static Integer getRecordsCount(String recordId,String recordTypeId)
    {
        return [ SELECT COUNT() FROM Investment_Holdings__c  WHERE Account__c = :recordId AND RecordTypeId =:recordTypeId];
    }

    @AuraEnabled
    public static List<Investment_Holdings__c> getInvestmentHoldingsRecords(String recordId,String recordTypeId, String sortedBy, String sortOrder, String nullOrder)
    {
        String investmentHoldingsQuery = 'SELECT Id, Name, Investment_Firm__c, Funding_Year__c, Issuer_Name__c, Issue_Description__c, Private_Placement_Indicator__c, Fund_Balance__c, Initial_Investment__c, Effective_Rate_of_Interest__c, Date_Acquired__c ';
        investmentHoldingsQuery += ' FROM Investment_Holdings__c WHERE Account__c = :recordId AND RecordTypeId =:recordTypeId ';
        investmentHoldingsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        List<Investment_Holdings__c> returnedRecords = Database.query(investmentHoldingsQuery); 
        return returnedRecords;
    }

    @AuraEnabled
    public static List<Investment_Holdings__c> getInvestmentHoldingsRecordsViewAll(String recordId,String recordTypeId, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder)
    {
        String investmentHoldingsQuery = 'SELECT Id, Name, Investment_Firm__c, Funding_Year__c, Issuer_Name__c, Issue_Description__c, Private_Placement_Indicator__c, Fund_Balance__c, Initial_Investment__c, Effective_Rate_of_Interest__c, Date_Acquired__c ';
        investmentHoldingsQuery += ' FROM Investment_Holdings__c WHERE Account__c = :recordId AND RecordTypeId =:recordTypeId ';
        investmentHoldingsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
        List<Investment_Holdings__c> returnedRecords = Database.query(investmentHoldingsQuery); 
        return returnedRecords;
    }

    @AuraEnabled
    public static Map<String,Integer> getRecordTypeCounts(String recordId)
    {
        Map<String, Integer> recordTypeCountsMap = new Map<String, Integer>();
        List<AggregateResult> aggregateResults = [SELECT COUNT(Id) recordCount, RecordType.DeveloperName devName FROM Investment_Holdings__c WHERE Account__c = :recordId GROUP BY RecordType.DeveloperName];

        for (AggregateResult result : aggregateResults) {
            recordTypeCountsMap.put((String) result.get('devName'), (Integer) result.get('recordCount'));
        }
        return recordTypeCountsMap;
    }

}