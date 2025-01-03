@isTest
public class SalesTrainingController_Test {
    @testSetup
    public static void createTestData()
    {
       Id salesTrainingRecordType = Schema.getGlobalDescribe().get('Knowledge_Base__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Sales_Training').getRecordTypeId();
       List<Knowledge_Base__c> parentRecords = new List<Knowledge_Base__c>();
       List<Knowledge_Base__c> childRecords = new List<Knowledge_Base__c>();
        for(integer i=0 ;i<10;i++)
        {
            Knowledge_Base__c k = new Knowledge_Base__c();
            k.Title__c = i+ ' new title ';
            k.Category__c = 'Rainmaker';
            k.What_will_you_learn__c ='test 123 ';
            k.RecordTypeId = salesTrainingRecordType;
            k.Sales_Training_Type__c = 'Sales Training Topics';
            k.Chapter_Number__c = i;
            parentRecords.add(k);
        }
        insert parentRecords;
        
        for(Knowledge_Base__c parentRec : parentRecords)
        {
            for(integer i=0 ;i<10;i++)
            {
                Knowledge_Base__c childST = new Knowledge_Base__c();
                childST.Title__c = i+ ' Child new title ';
                childST.Category__c = 'All';
                childST.What_will_you_learn__c ='Child test 123';
                childST.RecordTypeId = salesTrainingRecordType;
                childST.Sales_Training_Type__c = 'Sales Training Sub Topics';
                childST.Topic__c = parentRec.Id;
                
                childST.Video_Document_Link__c = 'https://dakotanetworks--dev.sandbox.my.site.com';
                childRecords.add(childST);
            }
        }
        insert childRecords;
        
    }
    
    @isTest
    public static void testFetchFilteredSalesTrainingRecords()
    {
        Id salesTrainingRecordType = Schema.getGlobalDescribe().get('Knowledge_Base__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Sales_Training').getRecordTypeId();
        
        List<Id> kbRecordIds = new List<Id>(new Map<Id, Knowledge_Base__c>([select Id from Knowledge_Base__c]).keySet());
        Id [] fixedSearchResults= new Id[1];
        fixedSearchResults = kbRecordIds;
        System.Test.setFixedSearchResults(fixedSearchResults);
        
        System.assert(SalesTrainingController.fetchFilteredSalesTrainingRecords('new','desc','Title__c') !=null);
        System.assert(SalesTrainingController.fetchFilteredSalesTrainingRecords('Child','asc','Chapter_Number__c') !=null);
		System.assert(SalesTrainingController.fetchFilteredSalesTrainingRecords('','asc','Chapter_Number__c') !=null);
    }
    
     @isTest
    public static void testUpdateNumberOfViews()
    {
        List<Knowledge_Base__c> kb = [SELECT Id,Number_of_Views__c from Knowledge_Base__c where Title__c like '%new%'];
        System.assert(SalesTrainingController.updateNumberOfViews(kb[0].id));
    }
}