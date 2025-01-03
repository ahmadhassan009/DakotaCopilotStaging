public with sharing class Form5500AdditionalInformationService {
    public static void resetHerokuSyncFlag(List<Form_5500_Additional_Information__c> newForm5500AdditionalInformation, Map<Id,Form_5500_Additional_Information__c> oldForm5500AdditionalInformation)
    {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('Form5500AdditionalInformation');
        helperObj.resetHerokuSyncFlag((List<SObject>)newForm5500AdditionalInformation, (Map<Id, SObject>)oldForm5500AdditionalInformation);
    }

    public static void deleteRecFromHeroku(Map<Id,Form_5500_Additional_Information__c> oldForm5500AdditionalInformation)
    {
        System.enqueueJob(new DeleteRecFromHeroku(oldForm5500AdditionalInformation.keySet(),'Form5500AdditionalInformation'));
    }
}