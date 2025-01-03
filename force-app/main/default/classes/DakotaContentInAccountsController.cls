public with sharing class DakotaContentInAccountsController {
    /**
     * gets Account Id and returns related Dakota Contents. 
     */
    @AuraEnabled
    public static List<Dakota_Content__c> getRecords(Id recordId, String sortedBy, String sortOrder, String nullOrder)
    {   
        String dakotaContentQuery = 'SELECT Id, Name, Date__c, Type__c, Dakota_Live_Call__c, Dakota_Live_Call__r.name,Featured_On__c,Presentation_Recording_url__c';
        dakotaContentQuery += ' FROM Dakota_Content__c WHERE Account_Linked__c = :recordId ';
        dakotaContentQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        List<Dakota_Content__c> returnedRecords = Database.query(dakotaContentQuery); 
        return returnedRecords;
    }

     /**
     * gets Account Id and returns count of related Dakota Contents. 
     */
    @AuraEnabled
    public static Integer getRecordsCount(String recordId)
    {
        return [SELECT count() FROM Dakota_Content__c WHERE Account_Linked__c = :recordId];
    }
}