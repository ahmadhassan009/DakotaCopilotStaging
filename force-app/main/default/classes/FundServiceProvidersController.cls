public with sharing class FundServiceProvidersController {
    /**
     * gets Account Id and returns related Fund Service Providers 
     */
    @AuraEnabled
    public static List<Fund_Service_Provider__c> getRecords(Id recordId, String sortedBy, String sortOrder, String nullOrder)
    {   
        if(sortedBy == 'Id') {
            sortedBy = 'Name';
        }
        String fundServiceProviderQuery = 'SELECT Id, Name,Service_Provider_Account__c,Additional_Details__c,Service_Provider_Account__r.Name,Service_Provider_Account__r.X100_Marketplace__c	, Provider_Other_Name__c, Service__c, Provider_Other_Direct_Comp__c,Payment_Type__c';
        fundServiceProviderQuery += ' FROM Fund_Service_Provider__c WHERE Account__c = :recordId ';
        fundServiceProviderQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10 OFFSET 0';
        List<Fund_Service_Provider__c> returnedRecords = Database.query(fundServiceProviderQuery); 
        return returnedRecords;
    }

    @AuraEnabled
    public static List<Fund_Service_Provider__c> getAllRecords(Id recordId, String sortedBy, String sortOrder,String recordLimit,String offset, String nullOrder)
    {   
        if(sortedBy == 'Id') {
            sortedBy = 'Name';
        }
        String fundServiceProviderQuery = 'SELECT Id, Name,Service_Provider_Account__c,Additional_Details__c,Service_Provider_Account__r.Name	,Service_Provider_Account__r.X100_Marketplace__c, Provider_Other_Name__c, Service__c, Provider_Other_Direct_Comp__c,Payment_Type__c';
        fundServiceProviderQuery += ' FROM Fund_Service_Provider__c WHERE Account__c = :recordId ';
        fundServiceProviderQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;
        List<Fund_Service_Provider__c> returnedRecords = Database.query(fundServiceProviderQuery); 
        return returnedRecords;
    }

     /**
     * gets Account Id and returns count of direct/indirect Fund Service Providers
     */
    @AuraEnabled
    public static Integer getRecordsCount(String recordId)
    {
        return [SELECT count() FROM Fund_Service_Provider__c  WHERE Account__c = :recordId];
    }

    @AuraEnabled
    public static String getRecordsRelaedAccountName(String recordId)
    {
        return [SELECT Name From Account  WHERE Id = :recordId].Name;
    }
}