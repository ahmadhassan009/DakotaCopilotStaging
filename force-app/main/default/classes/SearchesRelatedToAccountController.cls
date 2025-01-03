public with sharing class SearchesRelatedToAccountController {
    /**
     * gets Account Id OR Consultant and returns related Marketplace Searches records.
     */
    @AuraEnabled
    public static List<Marketplace_Searches__c> getAccountRelatedSearchesRecords(Id recordId, String sortedBy, String sortOrder, String nullOrder)
    {
        String seacrhesQuery = 'SELECT Id, Name, Account__c, Account__r.Name, Search_Status__c, Asset_Class__c, Amount__c, Search_Winner__c, Search_Winner__r.Name';
        seacrhesQuery += ' FROM Marketplace_Searches__c WHERE Account__c = :recordId OR Consultant__c = :recordId ';
        seacrhesQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        List<Marketplace_Searches__c> returnedRecords = Database.query(seacrhesQuery); 
        return returnedRecords;    
    }

    /**
     * gets Account Id and returns count of related Marketplace Searches records. 
     */
    @AuraEnabled
    public static Integer getAccountRelatedSearchesCount(Id recordId) {
        return [
            SELECT COUNT()
            FROM Marketplace_Searches__c
            WHERE Account__c = :recordId OR Consultant__c = :recordId
        ];
    }

    /**
     * gets Account Id and returns Account Name
     */
    @AuraEnabled
    public static Account getAccountName(Id recordId) {
        return [
            SELECT Name
            FROM Account
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ];
    }

    /**
     * gets Account Id OR Consultant and returns all related Marketplace Searches records.
     */
    @AuraEnabled
    public static List<Marketplace_Searches__c> getAllAccountRelatedSearchesRecords(Id recordId, Integer recordLimit, Integer offset)
    {
        return [SELECT Id, Name, Account__c, Account__r.Name, Search_Status__c, Asset_Class__c, Amount__c, Search_Winner__c, Search_Winner__r.Name
            FROM Marketplace_Searches__c
            WHERE Account__c = :recordId OR Consultant__c = :recordId
            ORDER BY Name LIMIT :recordLimit OFFSET :offset];
    }

    /**
     * gets Account Id OR Consultant and returns all sorted related Marketplace Searches records.
     */
    @AuraEnabled
    public static List<Marketplace_Searches__c> getAllRelatedSortedSearchesRecords (Id recordId, Integer recordLimit, Integer offset, String sortBy, String sortOrder) {
        String allSearchesQuery = 'SELECT Id, Name, Account__c, Account__r.Name, Search_Status__c, Asset_Class__c, Amount__c, Search_Winner__c, Search_Winner__r.Name';
        allSearchesQuery += ' FROM Marketplace_Searches__c WHERE Account__c = :recordId OR Consultant__c = :recordId ';
        allSearchesQuery += ' ORDER BY '+sortBy+' '+sortOrder+' LIMIT :recordLimit offset '+offset;
        List<Marketplace_Searches__c> SearchesListToReturn = Database.query(allSearchesQuery);
        return SearchesListToReturn;
    }
}