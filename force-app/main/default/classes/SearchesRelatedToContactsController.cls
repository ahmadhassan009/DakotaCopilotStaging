public with sharing class SearchesRelatedToContactsController {

    /**
    * description: To get the total number of Marketplace Search records linked to a Contact
    * @param recordId Contact record Id whose child Marketplace Search records are returned
    * 
    * @returns Integer Number of linked Marketplace Search records
    */
    @AuraEnabled
    public static Integer getContactRelatedSearchesCount(Id recordId) {
        return [
            SELECT COUNT()
            FROM Marketplace_Searches__c
            WHERE Contact__c = :recordId
        ];
    }
    
    /**
    * description: To get the Marketplace Search records linked to a record
    * @param recordId Contact record Id whose child Marketplace Search records are returned
    * @param sortedBy Field to sort by
    * @param sortOrder Sort Order of the field (ASC/DESC)
    * @param nullOrder Set the records with null values at either first or last
    * 
    * @returns List of Marketplace Search records
    */
    @AuraEnabled
    public static List<Marketplace_Searches__c> getContactRelatedSearchesRecords(Id recordId, String sortedBy, String sortOrder, String nullOrder)
    {
        String searchesQuery = 'SELECT Id, Name, Account__c, Account__r.Name, Asset_Class__c, Sub_Asset_Class__c, Amount__c, End_Date__c, Search_Status__c ';
        searchesQuery += ' FROM Marketplace_Searches__c WHERE Contact__c = :recordId ';
        searchesQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        List<Marketplace_Searches__c> returnedRecords = Database.query(searchesQuery); 
        return returnedRecords;    
    }
}