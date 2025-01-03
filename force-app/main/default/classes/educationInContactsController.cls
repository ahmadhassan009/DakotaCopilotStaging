public with sharing class educationInContactsController {

    @AuraEnabled
    public static List<Education__c> getEducationRecords(Id recordId, String sortedBy, String sortOrder, String nullOrder)
    {   
        String educationQuery = 'SELECT Id, Name, University_Alumni__c, University_Alumni__r.Name, University_Alumni__r.Metro_Area__c, University_Alumni__r.Metro_Area__r.Name, Degree_Distinction__c, Year_Graduated__c';
        educationQuery += ' FROM Education__c WHERE Contact__c = :recordId ';
        educationQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        List<Education__c> returnedRecords = Database.query(educationQuery); 
        return returnedRecords;
    }

    @AuraEnabled
    public static Integer getRecordsCount(String recordId)
    {
        return [SELECT count() FROM Education__c  WHERE Contact__c = :recordId];
    }
}