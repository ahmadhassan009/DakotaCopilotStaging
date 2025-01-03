public with sharing class PublicPlanMinutesInAccountsController {
    /**
     * gets Account Id and returns all related Public Plan minutes
     */
    @AuraEnabled
    public static List<Public_Plan_Minute__c> getRecords(String recordId, String sortBy, String sortOrder,  String nullOrder, Integer recordLimit, Integer offset)
    {
        return database.query('SELECT Id, Name, Posted_Date__c, Meeting_Minute_URL__c, Meeting_Date__c FROM Public_Plan_Minute__c WHERE Account__c = :recordId  ORDER BY '+sortBy+' '+sortOrder+ ' NULLS ' + nullOrder  + ' LIMIT :recordLimit OFFSET '+offset);
    }

    /**
     * gets Account Id and returns count of related Public Plan minutes
     */
    @AuraEnabled
    public static Integer getRecordsCount(String recordId)
    {
        return [SELECT count() FROM Public_Plan_Minute__c WHERE Account__c = :recordId];
    }

    @AuraEnabled
    public static String getRecordsRelatedAccountName(String recordId)
    {
        return [SELECT Name FROM Account WHERE Id = :recordId LIMIT 1].Name;
    }
}