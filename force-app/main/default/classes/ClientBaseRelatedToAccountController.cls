public with sharing class ClientBaseRelatedToAccountController {
    /**
     * gets Account Id and returns all related Client Base. 
     */
    @AuraEnabled
    public static List<Client_Base__c> getAccountRelatedClientBaseRecords(Id recordId, String sortBy, String sortOrder, String nullOrder)
    {
        return database.query('SELECT Id, Name,AUM__c, Type__c, Number_of_Clients__c FROM Client_Base__c WHERE Account__c = :recordId  ORDER BY '+sortBy+' '+sortOrder+ ' NULLS ' + nullOrder + ' LIMIT 10');
    }

    /**
     * gets Account Id and returns count of related Client Base.
     */
    @AuraEnabled
    public static Integer getAccountRelatedClientBaseCount(Id recordId) {
        return [
            SELECT COUNT()
            FROM Client_Base__c
            WHERE Account__c = :recordId
        ];
    }
}