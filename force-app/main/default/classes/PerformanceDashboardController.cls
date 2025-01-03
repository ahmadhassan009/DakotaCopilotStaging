public with sharing class PerformanceDashboardController {

    public class HedgeFundData {
        @AuraEnabled public List<Investment_Strategy__c> parentInvStr { get; set; }
        @AuraEnabled public Map<Id, List<Performance__c>> relatedPerformanceMap { get; set; }
    }

    @AuraEnabled
    public static Integer fetchPerformanceRecordsCount(String searchValue, List<String> vintageFilterValue, List<String> subAssetClassValue, List<String> assetClassFilterValue) {
        try {
            Integer totalCount = 0;
            Id pfRecordTypeId = Schema.SObjectType.Performance__c.getRecordTypeInfosByDeveloperName().get('Private_Fund').getRecordTypeId();
            String soqlSearchPerformanceRecords = 'SELECT Id, Account__c, Account__r.Name, Name, Asset_Class_picklist__c,'; 
            soqlSearchPerformanceRecords += ' Sub_Asset_Class__c, Vintage__c, Performance_AUM__c,';
            soqlSearchPerformanceRecords += ' Net_IRR__c, Yield_DPI__c, TVPI__c, As_of_Date__c,';
            soqlSearchPerformanceRecords += ' Rate_Of_Return__c, Performance_Fee__c, Mgmt_Fee__c,';
            soqlSearchPerformanceRecords += ' Performance_Verified__c FROM Performance__c'; 
            soqlSearchPerformanceRecords += ' WHERE RecordTypeId = :pfRecordTypeId AND Asset_Class_picklist__c != \'Hedge Fund\' AND Investment_Strategy__r.Investment_Strategy_Verified__c = true';
            if (String.isNotBlank(searchValue)) {
                searchValue = '%' + searchValue + '%';
                soqlSearchPerformanceRecords += ' AND (Account_Name__c LIKE :searchValue OR Name LIKE :searchValue OR Asset_Class_picklist__c LIKE :searchValue OR Sub_Asset_Class__c LIKE :searchValue OR Vintage__c LIKE :searchValue)';
            }
            if (vintageFilterValue != null && vintageFilterValue?.size() > 0) {
                soqlSearchPerformanceRecords += ' AND Vintage__c IN :vintageFilterValue';
            }
            if (subAssetClassValue != null && subAssetClassValue?.size() > 0) {
                soqlSearchPerformanceRecords += ' AND Sub_Asset_Class__c IN :subAssetClassValue';
            }
            if (assetClassFilterValue != null && assetClassFilterValue?.size() > 0) {
                soqlSearchPerformanceRecords += ' AND Asset_Class_picklist__c IN :assetClassFilterValue';
            }
            List<Performance__c> performances = Database.query(soqlSearchPerformanceRecords);
            totalCount = performances?.size();
            return totalCount;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Performance__c> fetchPerformanceRecords(String searchValue, List<String> vintageFilterValue, List<String> subAssetClassValue, List<String> assetClassFilterValue, String sortedBy, String sortOrder, String nullOrder, Integer recordLimit, Integer offset) {
        try {
            Id pfRecordTypeId = Schema.SObjectType.Performance__c.getRecordTypeInfosByDeveloperName().get('Private_Fund').getRecordTypeId();
            String soqlSearchPerformanceRecords = 'SELECT Id, Account__c, Account__r.Name, Name, Asset_Class_picklist__c,'; 
            soqlSearchPerformanceRecords += ' Sub_Asset_Class__c, Vintage__c, Performance_AUM__c,';
            soqlSearchPerformanceRecords += ' Net_IRR__c, Yield_DPI__c, TVPI__c, As_of_Date__c,';
            soqlSearchPerformanceRecords += ' Rate_Of_Return__c, Performance_Fee__c, Mgmt_Fee__c,';
            soqlSearchPerformanceRecords += ' Performance_Verified__c FROM Performance__c'; 
            soqlSearchPerformanceRecords += ' WHERE RecordTypeId = :pfRecordTypeId AND Asset_Class_picklist__c != \'Hedge Fund\' AND Investment_Strategy__r.Investment_Strategy_Verified__c = true';
            if (String.isNotBlank(searchValue)) {
                searchValue = '%' + searchValue + '%';
                soqlSearchPerformanceRecords += ' AND (Account_Name__c LIKE :searchValue OR Name LIKE :searchValue OR Asset_Class_picklist__c LIKE :searchValue OR Sub_Asset_Class__c LIKE :searchValue OR Vintage__c LIKE :searchValue)';
            }
            if (vintageFilterValue != null && vintageFilterValue?.size() > 0) {
                soqlSearchPerformanceRecords += ' AND Vintage__c IN :vintageFilterValue';
            }
            if (subAssetClassValue != null && subAssetClassValue?.size() > 0) {
                soqlSearchPerformanceRecords += ' AND Sub_Asset_Class__c IN :subAssetClassValue';
            }
            if (assetClassFilterValue != null && assetClassFilterValue?.size() > 0) {
                soqlSearchPerformanceRecords += ' AND Asset_Class_picklist__c IN :assetClassFilterValue';
            }
            soqlSearchPerformanceRecords += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;
            List<Performance__c> performances = Database.query(soqlSearchPerformanceRecords);
            return performances;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}