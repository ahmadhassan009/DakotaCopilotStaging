public with sharing class RelatedConferenceController {
    
    /**
     * description: Get current Metro Area's name
     * @param recordId Currently loaded Metro Area's Id 
     * 
     * @returns metro area's name
     */
    @AuraEnabled(cacheable=true)
    public static String getMetroAreaName(Id recordId) {
        return [
            SELECT Name
            FROM Metro_Area__c
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ].Name;
    }

    /**
     * description: Return count of all Conference records related to current metro area
     * @param recordId Currently loaded Metro Area's Id
     * 
     * @returns Integer Number of linked Conference records
     */
    @AuraEnabled
    public static Integer getRelatedConferenceCount(Id recordId) {
        return [SELECT COUNT() FROM Conference__c WHERE Metro_Area__c = :recordId AND Active__c = True AND Start_Date__c > TODAY];
    }

    /**
     * description: Get first 10 conference records related to current metro area, sorted by default on Conference name
     * @param recordId Currently loaded Metro Area's Id
     * 
     * @returns list of Conference records
     */
    @AuraEnabled
    public static List<Conference__c> getRelatedConferencesToMetroArea (Id recordId) {
        return [SELECT Id, Name, Start_Date__c, Format__c, Investment_Focus__c, Speaker_Type__c, Metro_Area__c, Metro_Area__r.Name, Registration_Link__c 
                FROM Conference__c WHERE Metro_Area__c = :recordId AND Active__c = True AND Start_Date__c > TODAY
                ORDER BY Start_Date__c ASC NULLS LAST LIMIT 10 OFFSET 0];
    }

    /**
     * description: Get next chunk of conference records based on limit and offset
     * @param recordId Currently loaded Metro Area's Id
     * @param recordLimit Limit to get next chunk of Conference records
     * @param offset Offset to get next chunk of Conference records
     * 
     * @returns list of Conference records
     */
    @AuraEnabled
    public static List<Conference__c> getAllRelatedConferencesRecords(Id recordId, Integer recordLimit, Integer offset){
        return [SELECT Id, Name, Start_Date__c, Format__c, Investment_Focus__c, Speaker_Type__c, Metro_Area__c, Metro_Area__r.Name, Registration_Link__c 
                FROM Conference__c WHERE Metro_Area__c = :recordId AND Active__c = True AND Start_Date__c > TODAY
                ORDER BY Start_Date__c ASC NULLS LAST LIMIT :recordLimit OFFSET :offset];
    }

    /**
     * description: Get conference records related to current metro area, sorted by default on Start Date
     * @param recordId Currently loaded Metro Area's Id
     * @param recordLimit Limit to get next chunk of Conference records
     * @param offset Offset to get next chunk of Conference records
     * @param sortBy Field based on which records should be sorted
     * @param sortOrder Sorting direction based on which records should be sorted
     * 
     * @returns list of Conference records
     */
    @AuraEnabled
    public static List<Conference__c> getAllRelatedSortedConferencesRecords (Id recordId, Integer recordLimit, Integer offset, String sortBy, String sortOrder) {
        String allConferencesQuery = 'SELECT Id, Name, Start_Date__c, Format__c, Investment_Focus__c, Speaker_Type__c, Metro_Area__c, Metro_Area__r.Name, Registration_Link__c ';
        allConferencesQuery += ' FROM Conference__c WHERE Metro_Area__c = :recordId AND Active__c = True AND Start_Date__c > TODAY ';
        allConferencesQuery += ' ORDER BY ' + sortBy + ' ' + sortOrder + ' NULLS LAST LIMIT ' + recordLimit + ' offset ' + offset;
        
        List<Conference__c> conferencesListToReturn = Database.query(allConferencesQuery);
        return conferencesListToReturn;
    }

}