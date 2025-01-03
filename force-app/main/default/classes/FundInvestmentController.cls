public with sharing class FundInvestmentController {
    
    /**
    * description: To get the total number of Fund Investment records linked to a record
    * @param recordId Account record Id whose child Fund Investment records are returned
    * 
    * @returns Integer Number of linked Fund Investment records
    */
    @AuraEnabled
    public static Integer getFundInvestmentsRecordCount(Id recordId) {
        return [ SELECT COUNT() FROM Investment_Funds__c WHERE Account__c =: recordId ];
    }

    /**
    * description: To get the Fund Investment records linked to a record
    * @param recordId Account record Id whose child Fund Investment records are returned
    * @param sortedBy Field to sort by
    * @param sortOrder Sort Order of the field (ASC/DESC)
    * @param nullOrder Set the records with null values at either first or last
    * 
    * @returns List of Fund Investment records
    */
    @AuraEnabled
    public static List<Investment_Funds__c> getFundInvestmentsRecords(Id recordId, String sortedBy, String sortOrder, String nullOrder) {
        String query = 'SELECT Id, Name, Name_of_sponsor_of_entity_listed__c, Type_of_Entity__c, Dollar_value_of_interest__c, ' + 
        'EIN_and_PN_Part_1__c, EIN_and_PN_Part_2__c FROM Investment_Funds__c ' +
        'WHERE Account__c =: recordId ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';

        List<Investment_Funds__c> fundInvRecords = Database.query(query);
        return fundInvRecords;
    }
}