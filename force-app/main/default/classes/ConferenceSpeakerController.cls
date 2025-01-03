public with sharing class ConferenceSpeakerController {

    @AuraEnabled
    public static List<Conference_Speaker__c> getConferenceSpeakerRecordsRelatedToContact(Id recordId, String sortedBy, String sortOrder, String nullOrder)
    {   
        String fundServiceProviderQuery = 'SELECT Id,Name, Conference__c,Conference__r.Name, Investment_Focus__c, Start_Date__c, Conference_Metro_Area__c,Conference__r.Metro_Area__c,Conference__r.Metro_Area__r.Name, Format__c';
        fundServiceProviderQuery += ' FROM Conference_Speaker__c WHERE Contact__c = :recordId ';
        fundServiceProviderQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        List<Conference_Speaker__c> returnedRecords = Database.query(fundServiceProviderQuery); 
        return returnedRecords;
    }

     /**
     * gets Account Id and returns count of related Fund Service Providers
     */
    @AuraEnabled
    public static Integer getRecordsCount(String recordId,String objectType)
    {
        if(objectType=='Contact')
        {
            return [SELECT count() FROM Conference_Speaker__c  WHERE Contact__c = :recordId];
        }
        else
        {
            return [SELECT count() FROM Conference_Speaker__c  WHERE Conference__c = :recordId];
        }
        
    }

    @AuraEnabled
    public static List<Conference_Speaker__c> getConferenceSpeakerRecordsRelatedToConference(Id recordId, String sortedBy, String sortOrder, String nullOrder)
    {   
        String fundServiceProviderQuery = 'SELECT Id,Name, Contact__c, Contact__r.Name, Account__c, Contact__r.AccountId, Contact__r.Account.Name,  Title__c, Metro_Area__c,Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Email__c';
        fundServiceProviderQuery += ' FROM Conference_Speaker__c WHERE Conference__c = :recordId ';
        if(sortedBy!='')
        {
            fundServiceProviderQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        }
        else
        {
            fundServiceProviderQuery +=  ' LIMIT 10';
        }
        
        List<Conference_Speaker__c> returnedRecords = Database.query(fundServiceProviderQuery); 
        return returnedRecords;
    }


}