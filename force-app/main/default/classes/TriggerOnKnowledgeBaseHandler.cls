public with sharing class TriggerOnKnowledgeBaseHandler {
    List<Knowledge_Base__c> newSalesTrainingRecordsList;
    Map<ID, Knowledge_Base__c> oldSalesTrainingRecordsList;
    public TriggerOnKnowledgeBaseHandler(List<Knowledge_Base__c> newSalesTrainingRecordsList, Map<ID, Knowledge_Base__c> oldSalesTrainingRecordsList) {
        this.newSalesTrainingRecordsList = newSalesTrainingRecordsList;
        this.oldSalesTrainingRecordsList = oldSalesTrainingRecordsList;
    }

    public void beforeInsert()        
    {
        TriggerOnKnowledgeBaseService.populateSalesTrainingRecordName(this.newSalesTrainingRecordsList, this.oldSalesTrainingRecordsList);
    }
}