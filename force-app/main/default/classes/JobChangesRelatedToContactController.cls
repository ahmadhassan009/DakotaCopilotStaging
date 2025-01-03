public with sharing class JobChangesRelatedToContactController {
    @AuraEnabled
    public static List<Update__c> getContactRelatedJobChangesRecords(Id recordId)
    {
        return [SELECT Id, Contact__c, Contact__r.Name, Firm_Left__c, Firm_Left__r.Name, Old_Title__c, CreatedDate 
                FROM Update__c
                WHERE Contact__c =:recordId AND type__c = 'Marketplace Personnel changes' AND Contact__c != '' AND Firm_Left__c != '' AND Firm_Joined__c != ''
                ORDER BY CreatedDate DESC LIMIT 10 OFFSET 0];
    }

    @AuraEnabled
    public static Integer getContactRelatedJobChangesRecordsCount(Id recordId) {
        return [
            SELECT COUNT()
            FROM Update__c
            WHERE Contact__c = :recordId AND type__c = 'Marketplace Personnel changes' AND Contact__c != '' AND Firm_Left__c != '' AND Firm_Joined__c != ''];
    }
    
    @AuraEnabled(cacheable=true)
    public static Contact getContactName(Id recordId) {
        return [
            SELECT Name
            FROM Contact
            WHERE Id =: recordId];
    }
    
    @AuraEnabled
    public static List<Update__c> getAllContactRelatedJobChangesRecords(Id recordId, Integer recordLimit, Integer offset)
    {
        return [SELECT Id, Contact__c, Contact__r.Name, Firm_Left__c, Firm_Left__r.Name, Old_Title__c, CreatedDate 
                FROM Update__c
                WHERE Contact__c =:recordId AND type__c = 'Marketplace Personnel changes' AND Contact__c != '' AND Firm_Left__c != '' AND Firm_Joined__c != ''
                ORDER BY CreatedDate DESC LIMIT :recordLimit OFFSET :offset];
    }
    
    @AuraEnabled (cacheable=true)
    public static List<Update__c> getAllRelatedSortedJobChangesRecords (Id recordId, Integer recordLimit, Integer offset, String sortBy, String sortOrder) {
        String allJobChangesQuery = 'SELECT Id, Contact__c, Contact__r.Name, Firm_Left__c, Firm_Left__r.Name, Old_Title__c, CreatedDate';
        allJobChangesQuery += ' FROM Update__c WHERE Contact__c =:recordId AND type__c = \'Marketplace Personnel changes\' AND Contact__c != \'\' AND Firm_Left__c != \'\' AND Firm_Joined__c != \'\' ';
        allJobChangesQuery += ' ORDER BY '+sortBy+' '+sortOrder+ ' NULLS LAST '+' LIMIT :recordLimit offset '+offset;
        List<Update__c> JobChangesListToReturn = Database.query(allJobChangesQuery);
        return JobChangesListToReturn;
    }
}