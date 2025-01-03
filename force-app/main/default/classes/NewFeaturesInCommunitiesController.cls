public with sharing class NewFeaturesInCommunitiesController {

    @AuraEnabled
    public static Integer getRecordCountOfMpNewFeatures () {   
        return [SELECT count() FROM MP_New_Features__c];
    }
    
    @AuraEnabled
    public static List<MP_New_Features__c> getRecordOfMpNewFeatures () {   
        
        String query = '';
        query = 'SELECT Id, Title__c, Date__c,Description__c, Demo__c FROM MP_New_Features__c';
        query += ' ORDER BY Date__c Desc NULLS LAST'; 
        List<MP_New_Features__c> ListToReturn = Database.query(query);
        return ListToReturn;    
    }

    @AuraEnabled
    public static List<MP_New_Features__c> getlimitedRecordOfMpNewFeatures () {   
        
        String query = '';
        query = 'SELECT Id, Title__c, Date__c,Description__c, Demo__c FROM MP_New_Features__c';
        query += ' ORDER BY Date__c Desc NULLS LAST limit 10'; 
        List<MP_New_Features__c> ListToReturn = Database.query(query);
        return ListToReturn;    
    }
}