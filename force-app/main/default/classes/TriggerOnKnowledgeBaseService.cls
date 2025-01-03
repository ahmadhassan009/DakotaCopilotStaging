public with sharing class TriggerOnKnowledgeBaseService {
    public static void populateSalesTrainingRecordName(List<Knowledge_Base__c> newSalesTrainingRecordsList, Map<ID, Knowledge_Base__c>  oldSalesTrainingRecordsList) {
        Id salesTrainingRecordType = Schema.getGlobalDescribe().get('Knowledge_Base__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Sales_Training').getRecordTypeId();

        for(Knowledge_Base__c kb : newSalesTrainingRecordsList){

            if((kb.RecordTypeId == salesTrainingRecordType && kb.Title__c!=null) && (Trigger.isInsert || (Trigger.isUpdate && kb.Title__c != oldSalesTrainingRecordsList.get(kb.ID).Title__c)))
            {
                String KnowledgeBaseName = kb.Title__c;
                if(KnowledgeBaseName.length()>80 )
                {  
                    KnowledgeBaseName = KnowledgeBaseName.substring(0,80);
                }
                kb.Name = KnowledgeBaseName;
            }
        }
    }
}