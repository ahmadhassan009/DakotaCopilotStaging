@isTest
public with sharing class TriggerOnKnowledgeBaseService_Test {
    @testSetUp
    public static void createTestData()
    {
        Id salesTrainingRecordType = Schema.getGlobalDescribe().get('Knowledge_Base__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Sales_Training').getRecordTypeId();
       
        Knowledge_Base__c k = new Knowledge_Base__c();
        k.Title__c = 'Salesforce, Inc. is an American cloud-based software company headquartered in San Francisco, California.';
        k.Category__c = 'Rainmaker';
        k.What_will_you_learn__c ='test 123 ';
        k.RecordTypeId = salesTrainingRecordType;        
        insert k;
    }

    @isTest 
    public static void testPopulateSalesTrainingRecordName()
    {
        List<Knowledge_Base__c> kb = [Select Id,Name from Knowledge_Base__c where Category__c = 'Rainmaker']; 
        String KnowledgeBaseName = kb[0].Name;
        System.assert(KnowledgeBaseName.length() == 80);
    }

}