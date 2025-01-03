public with sharing class InvestmentStrategyRelatedToAccountCont {
    

    @AuraEnabled
    public static Integer getRecordsCount(String recordId, String relatedListName) {
        if (relatedListName == 'Performance') {
            return [ SELECT COUNT() FROM Performance__c WHERE Account__c = :recordId  AND Investment_Strategy__r.Investment_Strategy_Verified__c = true ]; //
        } else {
            return [ SELECT COUNT() FROM Investment_Strategy__c WHERE Account__c = :recordId ]; //
        }
    }

    @AuraEnabled
    public static List<PerformanceRecords> getInvestmentStrategyRecords(String recordId, String sortedBy, String sortOrder, String nullOrder,String relatedListName) {
        if (relatedListName == 'Performance') {
            String educationQuery = 'SELECT Id,Investment_Strategy__r.OwnerId,Yield_DPI__c,MOIC__c,TVPI__c,As_of_Date__c,Capital_Drawn__c,Net_IRR__c,Vintage__c, Name, Account__c, Asset_Class_picklist__c, Sub_Asset_Class__c ';
            educationQuery += 'FROM Performance__c WHERE Account__c = :recordId  AND Investment_Strategy__r.Investment_Strategy_Verified__c = true';
            educationQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10 OFFSET 0';
            List<Performance__c> returnedRecords = Database.query(educationQuery); 
            return getPerformanceRecordsToReturn(returnedRecords, relatedListName);
        } else {
            String educationQuery = 'SELECT Id,OwnerId,Closed_Amount__c, Name, Account__c, CUSIP__c, Ticker__c, Asset_Class_picklist__c, Sub_Asset_Class__c ';
            educationQuery += 'FROM Investment_Strategy__c WHERE Account__c = :recordId ';
            educationQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10 OFFSET 0';
            List<Investment_Strategy__c> returnedRecords = Database.query(educationQuery); 
            return getInvestmentsRecordsToReturn(returnedRecords, relatedListName);
        }
    }

    @AuraEnabled
    public static Integer getPerformanceRecordsCount() {
        return [ SELECT COUNT() FROM Performance__c WHERE Investment_Strategy__r.Investment_Strategy_Verified__c = true ]; //
    }

    @AuraEnabled
    public static List<PerformanceRecords> getPerformanceRecords( Integer recordLimit, Integer offset, String nullOrder, String sortedBy, String sortOrder) {
        String performanceQuery = 'SELECT Id,Investment_Strategy__r.OwnerId,Yield_DPI__c,MOIC__c,TVPI__c,As_of_Date__c,Capital_Drawn__c,Net_IRR__c,Vintage__c, Name, Account__c, Asset_Class_picklist__c, Sub_Asset_Class__c ';
		performanceQuery += 'FROM Performance__c WHERE Investment_Strategy__r.Investment_Strategy_Verified__c = true';
        performanceQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder  + ' LIMIT '+recordLimit+' OFFSET '+offset;
        List<Performance__c> returnedRecords = Database.query(performanceQuery); 
        return getPerformanceRecordsToReturn(returnedRecords, 'Performance'); 
    }

    @AuraEnabled
    public static List<PerformanceRecords> getAccountRelatedInvestmentRecords(String recordId, Integer recordLimit, Integer offset, String nullOrder, String sortedBy, String sortOrder, String relatedListName) {
        if (relatedListName == 'Performance') {
            String educationQuery = 'SELECT Id,Investment_Strategy__r.OwnerId,Yield_DPI__c,MOIC__c,TVPI__c,As_of_Date__c,Capital_Drawn__c,Net_IRR__c,Vintage__c, Name, Account__c, Asset_Class_picklist__c, Sub_Asset_Class__c ';
            educationQuery += 'FROM Performance__c WHERE Account__c = :recordId AND Investment_Strategy__r.Investment_Strategy_Verified__c = true';
            educationQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT '+recordLimit+' OFFSET '+offset;
            List<Performance__c> returnedRecords = Database.query(educationQuery); 
            return getPerformanceRecordsToReturn(returnedRecords, relatedListName);
        } else {
            String educationQuery = 'SELECT Id,OwnerId,Closed_Amount__c, Name, Account__c, CUSIP__c, Ticker__c, Asset_Class_picklist__c, Sub_Asset_Class__c ';
            educationQuery += 'FROM Investment_Strategy__c WHERE Account__c = :recordId ';
            educationQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT '+recordLimit+' OFFSET '+offset;
            List<Investment_Strategy__c> returnedRecords = Database.query(educationQuery); 
            return getInvestmentsRecordsToReturn(returnedRecords, relatedListName);
        }
    }

    @AuraEnabled
    public static List<PerformanceRecords> getPerformanceRecordsToReturn(List<Performance__c> returnedRecords, String relatedListName) {
        List<PerformanceRecords> performanceRecordsToReturn = new List<PerformanceRecords>();
        for (Performance__c perf: returnedRecords) {
            PerformanceRecords perfRec = new PerformanceRecords();
            perfRec.Id = perf.Id;
            perfRec.Yield_DPI = perf.Yield_DPI__c;
            perfRec.MOIC = perf.MOIC__c;
            perfRec.TVPI = perf.TVPI__c;
            perfRec.As_of_Date = perf.As_of_Date__c;
            perfRec.Capital_Drawn = perf.Capital_Drawn__c;
            perfRec.Net_IRR = perf.Net_IRR__c;
            perfRec.Vintage = perf.Vintage__c;
            perfRec.Name = perf.Name;
            perfRec.Asset_Class_picklist = perf.Asset_Class_picklist__c;
            perfRec.Sub_Asset_Class = perf.Sub_Asset_Class__c;
            performanceRecordsToReturn.add(perfRec);
        }
        return performanceRecordsToReturn;
    }

    @AuraEnabled
    public static List<PerformanceRecords> getInvestmentsRecordsToReturn(List<Investment_Strategy__c> returnedRecords, String relatedListName) {
        List<PerformanceRecords> performanceRecordsToReturn = new List<PerformanceRecords>();
        for(Investment_Strategy__c strategy: returnedRecords) {
            PerformanceRecords perfRec = new PerformanceRecords();
            perfRec.Id = strategy.Id;
            perfRec.Closed_Amount = strategy.Closed_Amount__c;
            perfRec.Name = strategy.Name;
            perfRec.CUSIP = strategy.CUSIP__c;
            perfRec.Ticker = strategy.Ticker__c;
            perfRec.Asset_Class_picklist = strategy.Asset_Class_picklist__c;
            perfRec.Sub_Asset_Class = strategy.Sub_Asset_Class__c;
            performanceRecordsToReturn.add(perfRec);
        }
        return performanceRecordsToReturn;
    }

	public Class PerformanceRecords {
        @AuraEnabled public String Id {get;set;}
        @AuraEnabled public Decimal Yield_DPI {get;set;} 
        @AuraEnabled public Decimal MOIC {get;set;} 
        @AuraEnabled public Decimal TVPI {get;set;} 
        @AuraEnabled public Date As_of_Date {get;set;}
		@AuraEnabled public Decimal Capital_Drawn {get;set;}
        @AuraEnabled public Decimal Net_IRR {get;set;}
        @AuraEnabled public String Vintage {get;set;}
        @AuraEnabled public Decimal Closed_Amount {get;set;}
        @AuraEnabled public String Name {get;set;}
        @AuraEnabled public String CUSIP {get;set;}
        @AuraEnabled public String Ticker {get;set;}
        @AuraEnabled public String Asset_Class_picklist {get;set;}
        @AuraEnabled public String Sub_Asset_Class {get;set;}
        @AuraEnabled public Boolean addActions {get;set;}
        
    }
}