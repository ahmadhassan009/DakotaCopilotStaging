public with sharing class Form5500SearchController {
    
    @AuraEnabled 
    public static Account getCurrentRecordEin(Id recordId){
        return [SELECT EIN__c, Id, Name from Account where id=:recordId];
    }
}