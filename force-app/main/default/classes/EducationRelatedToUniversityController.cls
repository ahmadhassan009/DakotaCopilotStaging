public with sharing class EducationRelatedToUniversityController {

    @AuraEnabled
    public static Integer getRecordsCount(String recordId)
    {
        return [ SELECT COUNT() FROM Education__c  WHERE University_Alumni__c = :recordId AND Contact__c !=null AND Contact__r.Marketplace_Verified_Contact__c = true];
    }

    /**
     * return Education records that are linked to the Account and any Contact 
     */
    @AuraEnabled
    public static List<Education__c> getEducationRecords(String recordId, String sortedBy, String sortOrder, String nullOrder)
    {
        // New Change Start
        String educationQuery = 'SELECT Id, Name, toLabel(Degree_Distinction__c),Contact__c, Contact__r.Name, Contact__r.AccountId , Contact__r.Account.Name, Contact__r.Account_Type__c, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Email, Year_Graduated__c';
        educationQuery += ' FROM Education__c WHERE University_Alumni__c = :recordId AND Contact__c !=null AND Contact__r.Marketplace_Verified_Contact__c = true';
        educationQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10 OFFSET 0';
        List<Education__c> returnedRecords = Database.query(educationQuery); 
        return returnedRecords;

    }

    @AuraEnabled
    public static List<Education__c> getEducationRecordsViewAll(String recordId, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder)
    {
        // New Change Start
        String educationQuery = 'SELECT Id, Name,toLabel(Degree_Distinction__c), Contact__c, Contact__r.Name, Contact__r.AccountId, Contact__r.Account.Name, Contact__r.Account_Type__c, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Email, Year_Graduated__c';
        educationQuery += ' FROM Education__c WHERE University_Alumni__c = :recordId AND Contact__c !=null AND Contact__r.Marketplace_Verified_Contact__c = true';
        educationQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
        List<Education__c> returnedRecords = Database.query(educationQuery); 
        return returnedRecords;

    }

    @AuraEnabled
    public static University_Alumni__c getUniversityAlumniName(Id recordId) {
        return [
            SELECT Name
            FROM University_Alumni__c
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ];
    }
}