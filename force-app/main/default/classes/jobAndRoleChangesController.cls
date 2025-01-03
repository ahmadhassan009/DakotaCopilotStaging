public with sharing class jobAndRoleChangesController {

    @AuraEnabled
    public static Integer getJobRecordsCount(String search)
    {
        List<String> fields = new List<String> { 'New_Title__c'};
        List<String> fieldClause = new List<String>();
        String cleanedSearch = '%' + search.trim().replaceAll('\\s+', '%') + '%';
        for (String field : fields) {
            fieldClause.add(field + ' LIKE :cleanedSearch');
        }
        String jobChangesCount = 'SELECT COUNT() FROM Update__c where Job_Change__c=true and createddate > 2023-10-01T00:00:00Z ';
        if(search!='')
        {
            jobChangesCount += ' and (';
            jobChangesCount += String.join(fieldClause, ' OR ');
            jobChangesCount += ')';
        }
        Integer recordCount= Database.countQuery(jobChangesCount);
        return recordCount;
    }


    @AuraEnabled 
    public static List<Update__c> getJobChanges(String search,String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder){

        List<String> fields = new List<String> { 'New_Title__c'};
        List<String> fieldClause = new List<String>();
        String cleanedSearch = '%' + search.trim().replaceAll('\\s+', '%') + '%';
        for (String field : fields) {
            fieldClause.add(field + ' LIKE :cleanedSearch');
        }

        String jobChangesQuery='SELECT  Id, Contact__c, Contact_Name__c, Firm_Joined_Name__c, Firm_Left__c, Firm_Left__r.Name, New_Title__c,Firm_Joined_Investment_Focus__c,Firm_Left_Investment_Focus__c,Last_Updated_Date__c, follow_icon__c from Update__c where Job_Change__c=true and createddate > 2023-10-01T00:00:00Z ';
        if(search!='')
        {
            jobChangesQuery += ' and (';
            jobChangesQuery += String.join(fieldClause, ' OR ');
            jobChangesQuery += ')';
        }        
        jobChangesQuery+=' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
        List<Update__c> returnedRecords = Database.query(jobChangesQuery); 

        for(Update__c up : returnedRecords)
        {
            String htmlBody = '';              
            htmlBody += '<div style="padding: 3px;">';
            htmlBody += '<span><button' + up.follow_icon__c + '></button></span>'; 
            htmlBody += '</div>';
        }
        return returnedRecords;
    }

    @AuraEnabled
    public static Integer getRoleRecordsCount(String search)
    {
        List<String> fields = new List<String> { 'New_Title__c','Old_Title__c'};
        List<String> fieldClause = new List<String>();
        String cleanedSearch = '%' + search.trim().replaceAll('\\s+', '%') + '%';
        for (String field : fields) {
            fieldClause.add(field + ' LIKE :cleanedSearch');
        }
        String roleChangesCount = 'SELECT COUNT() FROM Update__c where Role_Change__c=true and createddate > 2023-10-01T00:00:00Z ';
        if(search!='')
        {
            roleChangesCount += ' and (';
            roleChangesCount += String.join(fieldClause, ' OR ');
            roleChangesCount += ')';
        }
        Integer recordCount= Database.countQuery(roleChangesCount);
        return recordCount;
    }

    @AuraEnabled
    public static List<Update__c> getRoleChanges(String search, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder){
        List<String> fields = new List<String> { 'New_Title__c','Old_Title__c'};
        List<String> fieldClause = new List<String>();
        String cleanedSearch = '%' + search.trim().replaceAll('\\s+', '%') + '%';
        for (String field : fields) {
            fieldClause.add(field + ' LIKE :cleanedSearch');
        }

        String roleChangesQuery='SELECT  Id, Contact__c, Contact_Name__c, Account__c, Account__r.Name, Old_Title__c, New_Title__c,Investment_Focus__c, Last_Updated_Date__c from Update__c where Role_Change__c=true and createddate > 2023-10-01T00:00:00Z ';
        if(search!='')
        {
            roleChangesQuery += ' and (';
            roleChangesQuery += String.join(fieldClause, ' OR ');
            roleChangesQuery += ')';
        }
        roleChangesQuery+=' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
        List<Update__c> returnedRoleRecords = Database.query(roleChangesQuery); 
        return returnedRoleRecords;
    }
}