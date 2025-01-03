public with sharing class ManagerPresentationInfoController {
    public static List<Id> contentDocIds = new List<Id>();

    @AuraEnabled
    public static Integer getRecordsCount(String searchValue)
    {
        String whereClause = '';
        if(searchValue !=null && searchValue!= '' && searchValue.length()>1)
        {
            whereClause = getWhereClause(searchValue);
        }
        String query = 'Select COUNT() From Manager_Presentation_Info__c'+whereClause;
        return Database.countQuery(query);
    }

    @AuraEnabled
    public static List<Manager_Presentation_Info__c> getAllRecords(String searchValue, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder)
    {
        String whereClause = '';
        if(searchValue !=null && searchValue!= '' && searchValue.length()>1)
        {
            whereClause = getWhereClause(searchValue);
        }

        String recQuery = 'SELECT Id, MP_Title__c, Distribution_Public_URL__c,Account_Name__c, Content_Document_Id__c, Investment_Strategy__c, Investment_Strategy__r.Name, Public_Plan_Minute__c, Public_Plan_Minute__r.Name, Type__c, Asset_Class__c, Sub_Asset_Class__c, Meeting_Date__c FROM Manager_Presentation_Info__c';
        recQuery += whereClause + ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
        List<Manager_Presentation_Info__c> returnedRecords = Database.query(recQuery); 
        return returnedRecords;
    }

    public static String getWhereClause(String searchValue) {

        String whereClause = '';        
        List<Manager_Presentation_Info__c> cdrecords = [SELECT id,Content_Document_Id__c FROM Manager_Presentation_Info__c];
        Set<Id> cdIds = new Set<Id>();
        for(Manager_Presentation_Info__c contentDoc : cdrecords)
        {
            cdIds.add(contentDoc.Content_Document_Id__c);
        }
        searchValue = '"'+searchValue+'"';
        List<List<ContentDocument>> contentDocs = [FIND :searchValue IN NAME FIELDS RETURNING ContentDocument(Id, Title WHERE Id IN:cdIds)];

        for(ContentDocument con: contentDocs[0])
        {
            contentDocIds.add(con.Id);
        }
        whereClause = ' WHERE Content_Document_Id__c IN: contentDocIds';
        return whereClause;
    }
}