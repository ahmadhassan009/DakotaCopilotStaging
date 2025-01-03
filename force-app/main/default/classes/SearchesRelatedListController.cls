public with sharing class SearchesRelatedListController {
    @AuraEnabled
    public static List<Marketplace_Searches__c> getRelatedSearchesRecords(Id recordId)
    {
        return [SELECT Id, Name, Account__c, Account__r.Name, Account_Type__c, toLabel(Search_Status__c), Asset_Class__c, Sub_Asset_Class__c, Search_Winner__c, Search_Winner__r.Name
            FROM Marketplace_Searches__c
            WHERE Metro_Area__c = :recordId
            LIMIT 10 OFFSET 0];
    }

    @AuraEnabled
    public static Integer getRelatedSearchesCount(Id recordId) {
        return [
            SELECT COUNT()
            FROM Marketplace_Searches__c
            WHERE Metro_Area__c =: recordId
        ];
    }

    @AuraEnabled(cacheable=true)
    public static String getMetroAreaName(String  recordId)
    {
        return [SELECT Id, Name FROM Metro_Area__c where Id =: recordId].Name ;
    }

    @AuraEnabled
    public static Metro_Area__c getMetroAreaNameObj(Id recordId) {
        return [
            SELECT Name
            FROM Metro_Area__c
            WHERE Id =: recordId
            ORDER BY Name
        ];
    }

    @AuraEnabled
    public static List<Marketplace_Searches__c> getAllRelatedSearchesRecords(Id recordId, Integer recordLimit, Integer offset)
    {
        return [SELECT Id, Name, Account__c, Account__r.Name, Account_Type__c, Search_Status__c, Asset_Class__c, Sub_Asset_Class__c, Search_Winner__c, Search_Winner__r.Name
            FROM Marketplace_Searches__c
            WHERE Metro_Area__c = :recordId
            LIMIT :recordLimit OFFSET :offset];
    }

    @AuraEnabled (cacheable=true)
    public static List<Marketplace_Searches__c> getAllRelatedSortedSearchesRecords (Id recordId, Integer recordLimit, Integer offset, String sortBy, String sortOrder) {
        String allSearchesQuery = 'SELECT Id, Name, Account__c, Account__r.Name, Account_Type__c, Search_Status__c, Asset_Class__c, Sub_Asset_Class__c, Search_Winner__c, Search_Winner__r.Name';
        allSearchesQuery += ' FROM Marketplace_Searches__c WHERE Metro_Area__c = :recordId ';
        allSearchesQuery += ' ORDER BY '+sortBy+' '+sortOrder+' NULLS LAST LIMIT :recordLimit offset '+offset;
        List<Marketplace_Searches__c> SearchesListToReturn = Database.query(allSearchesQuery);
        return SearchesListToReturn;
    }

    /**
     * To get Metro Areas in a state
     * @param state String variable for state name
     * 
     * @return list of Metro Areas with the specified state
     */
    public static List <Metro_Area__c> getMetroAreasInState(String state) {
        List <Metro_Area__c> metroAreasByState = [SELECT Id, Name from Metro_Area__c where state__c =: state];
        return metroAreasByState;
    }

    /**
     * To get the total number of searches for a state
     */
    @AuraEnabled
    public static Integer getRelatedSearchesCountForState (String state) {
        List<Metro_Area__c>  metroAreasInState = getMetroAreasInState(state);
        return [
            SELECT COUNT()
            FROM Marketplace_Searches__c
            WHERE Metro_Area__c IN : metroAreasInState
        ];
    }

    /**
     * To get the Marketplace Search records for the state
     * @param state String Variable for state name
     * @param recordLimit Integer The number of records to be shown
     * @param offset Integer Offset to get next chunk of Searches records
     * @param sortBy String Field name on which records should be sorted
     * @param sortOrder String Sort order of the field (Asc/Desc)
     * 
     * @return list of searches for the state
     */
    @AuraEnabled
    public static List<Marketplace_Searches__c> getRelatedSearcheRecordsForState (String state, Integer recordLimit, Integer offset, String sortBy, String sortOrder) {
        List<Metro_Area__c>  metroAreasInState = getMetroAreasInState(state);

        String allSearchesQuery = 'SELECT Id, Name, Account__c, Account__r.Name, Account_Type__c, Search_Status__c, Asset_Class__c, Sub_Asset_Class__c, Search_Winner__c, Search_Winner__r.Name FROM Marketplace_Searches__c WHERE Metro_Area__c IN :metroAreasInState ';
        allSearchesQuery += ' ORDER BY '+sortBy+' '+sortOrder+' NULLS LAST LIMIT :recordLimit offset '+offset;
        List<Marketplace_Searches__c> stateSearchesList = Database.query(allSearchesQuery);
        return stateSearchesList;
    }
}