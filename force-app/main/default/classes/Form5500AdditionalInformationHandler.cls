public with sharing class Form5500AdditionalInformationHandler {
    List<Form_5500_Additional_Information__c> newForm5500AdditionalInformation;
    Map<Id, Form_5500_Additional_Information__c> oldForm5500AdditionalInformation;
    public Form5500AdditionalInformationHandler(List<Form_5500_Additional_Information__c> newForm5500AdditionalInformation, Map<Id, Form_5500_Additional_Information__c> oldForm5500AdditionalInformation) {
        this.newForm5500AdditionalInformation = newForm5500AdditionalInformation;
        this.oldForm5500AdditionalInformation = oldForm5500AdditionalInformation;
    }

    public void afterDelete() {
        Form5500AdditionalInformationService.deleteRecFromHeroku(this.oldForm5500AdditionalInformation);
    }

    public void beforeUpdate() {
        Form5500AdditionalInformationService.resetHerokuSyncFlag(this.newForm5500AdditionalInformation, this.oldForm5500AdditionalInformation);
    }
}