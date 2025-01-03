public with sharing class AssetClassRelatedToAccountController {
    /**
    * description: To get the total number of Asset Class Exposure records linked to a record
    * @param recordId Account record Id whose child Asset Class Exposure records are returned
    * 
    * @returns Integer Number of linked Asset Class Exposure records
    */
    @AuraEnabled
    public static Integer getAssetClassExposureRecordCount(Id recordId) {
        return [ SELECT COUNT() FROM Asset_Class_Exposure__c WHERE Account__c =: recordId ];
    }

    /**
    * description: To get the Asset Class Exposure records linked to a record
    * @param recordId Account record Id whose child Asset Class Exposure records are returned
    * @param sortedBy Field to sort by
    * @param sortOrder Sort Order of the field (ASC/DESC)
    * @param recLimit Record limit
    * @param offset Record offset
    * @param nullOrder Set the records with null values at either first or last
    * 
    * @returns List of Investment records
    */
    @AuraEnabled
    public static List<Asset_Class_Exposure__c> getAssetClassExposureRecords(Id recordId, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder) {
        String query = 'SELECT Id, Name, Fund_Balance__c, Asset_Class__c, 	Sub_Asset_Class__c, Funding_Year__c ' +
        'FROM Asset_Class_Exposure__c ' +
        'WHERE Account__c =: recordId ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + 
        ' LIMIT ' + recLimit + ' OFFSET ' + offset;

        List<Asset_Class_Exposure__c> assetClassRecords = Database.query(query);
        return assetClassRecords;
    }
}