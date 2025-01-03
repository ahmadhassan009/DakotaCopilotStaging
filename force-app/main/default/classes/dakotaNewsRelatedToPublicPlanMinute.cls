public class dakotaNewsRelatedToPublicPlanMinute {
    /**
    * description: To get the total number of Dakota News records linked to a record
    * @param recordId PublicPlanMinute record Id whose child Dakota News records are returned
    * 
    * @returns Integer Number of linked Dakota News records
    */
    @AuraEnabled
    public static Integer getDakotaNewsRecordCount(Id recordId) {
        return [ SELECT COUNT() FROM Dakota_News__c WHERE Public_Plan_Minute__c =: recordId ];
    }

    /**
    * description: To get the Dakota News records linked to a record
    * @param recordId PublicPlanMinute record Id whose child Dakota News records are returned
    * @param sortedBy Field to sort by
    * @param sortOrder Sort Order of the field (ASC/DESC)
    * @param recLimit Record limit
    * @param offset Record offset
    * @param nullOrder Set the records with null values at either first or last
    * 
    * @returns List of Dakota News records
    */
    @AuraEnabled
    public static List<Dakota_News__c> getDakotaNewsRecords(Id recordId, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder) {
        String dakotaNewsQuery = 'SELECT Id, Name,Publish_Date__c,Public_Plan_Minute__c,Account__c,Account__r.Name,Contact__c,Contact__r.Name, Public_Plan_Minute__r.Name, Description__c ' +
        'FROM Dakota_News__c ' +
        'WHERE Public_Plan_Minute__c =:recordId ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + 
        ' LIMIT ' + recLimit + ' OFFSET ' + offset;

        List<Dakota_News__c> dakotaNewsRecords = Database.query(dakotaNewsQuery);
        return dakotaNewsRecords;
    }
}