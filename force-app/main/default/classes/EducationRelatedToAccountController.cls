public with sharing class EducationRelatedToAccountController {
    
    /**
     * return count of Education records that are linked to the Account and any Contact 
     */
    @AuraEnabled
    public static Integer getRecordsCount(String recordId)
    {
        return [ SELECT COUNT() FROM Education__c  WHERE College__c = :recordId AND Contact__c !=null ];
    }

    /**
     * return Education records that are linked to the Account and any Contact 
     */
    @AuraEnabled
    public static List<Education__c> getEducationRecords(String recordId, String sortedBy, String sortOrder, String nullOrder)
    {
        String educationQuery = 'SELECT Id, Name, Contact__c, Contact__r.Name, Contact__r.AccountId , Contact__r.Account.Name, College__r.Type, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Email, Year_Graduated__c';
        educationQuery += ' FROM Education__c WHERE College__c = :recordId AND Contact__c !=null ';
        educationQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        List<Education__c> returnedRecords = Database.query(educationQuery); 
        return returnedRecords;

    }

    @AuraEnabled
    public static List<Education__c> getEducationRecordsViewAll(String recordId, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder)
    {
        String educationQuery = 'SELECT Id, Name, Contact__c, Contact__r.Name, Contact__r.AccountId, Contact__r.Account.Name, College__r.Type, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Email, Year_Graduated__c';
        educationQuery += ' FROM Education__c WHERE College__c = :recordId AND Contact__c !=null ';
        educationQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
        List<Education__c> returnedRecords = Database.query(educationQuery); 
        return returnedRecords;

    }

    @AuraEnabled
    public static Account getAccountName(Id recordId) {
        return [
            SELECT Name
            FROM Account
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ];
    }
}