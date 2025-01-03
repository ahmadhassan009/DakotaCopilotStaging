public with sharing class CustomRelatedListController {

    @AuraEnabled
    public static Integer getRecordCountViewAll(String recordId, String objectApiName,String accountLookup)
    {
        try{
            String query = 'SELECT count() FROM '+objectApiName+' WHERE '+accountLookup+'=:recordId';
            return Database.countQuery(query); 
        }
        catch(Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }  

    }
    @AuraEnabled
    public static List<SObject> getRecordViewAll(String recordId,String fieldsToQuery, String objectApiName,String accountLookup, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder)
    {
        try{
            String query = 'SELECT '+fieldsToQuery+' FROM '+objectApiName+' WHERE '+accountLookup+'=:recordId';
            query += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
            List<SObject> returnedRecords = Database.query(query); 
            return returnedRecords;
        }
        catch(Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }  
    }

    @AuraEnabled
    public static SObject getRecordName(String recordId)
    {
        try{
            Id idInstance = (Id)recordId;
            Schema.SObjectType objType = idInstance.getSObjectType();
            String objectApiName = objType.getDescribe().getName();
            String query = 'SELECT Id,Name FROM '+objectApiName+' WHERE Id=:recordId limit 1';
            SObject returnedRecord = Database.query(query);
            return returnedRecord;
        }
        catch(Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }  
    }
}