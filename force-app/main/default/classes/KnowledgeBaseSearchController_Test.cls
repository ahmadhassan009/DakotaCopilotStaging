@isTest
public class KnowledgeBaseSearchController_Test {
    @testsetup
    public static void createTestDate()
    {
        List<Knowledge_Base__c> knowledgebaseRecords = new List<Knowledge_Base__c>();
        for(integer i=1;i<6;i++)
        {
            Knowledge_Base__c knowledgebase = new Knowledge_Base__c();
            knowledgebase.Name = 'Test '+i;
            knowledgebase.Is_Active__c = true;
            knowledgebase.Portal_Type__c = 'Everest';
            knowledgebase.Video_Document_Link__c = 'https://www.google.com';
            knowledgebaseRecords.add(knowledgebase);
        }
        for(integer i=6;i<11;i++)
        {
            Knowledge_Base__c knowledgebase = new Knowledge_Base__c();
            knowledgebase.Name = 'Test '+i;
            knowledgebase.Is_Active__c = true;
            knowledgebase.Portal_Type__c = 'Marketplace';
            knowledgebase.Video_Document_Link__c = 'https://www.google.com';
            knowledgebaseRecords.add(knowledgebase);
        }
        insert knowledgebaseRecords;
    }
    
    @isTest
    public static void testGetEverestHelpTopics()
    {
        System.assertEquals(5, KnowledgeBaseSearchController.fetchKnowledgeBaseRecords('Everest').size());
    }
    
    @isTest
    public static void testGetMarketplaceHelpTopics()
    {
        System.assertEquals(5, KnowledgeBaseSearchController.fetchKnowledgeBaseRecords('Marketplace').size());
    }
    
    @isTest
    public static void testSearchKnowledgeBaseRecords()
    {
        System.assertEquals(1, KnowledgeBaseSearchController.searchKnowledgeBaseRecords('Everest','4').size());
        System.assertEquals(0, KnowledgeBaseSearchController.searchKnowledgeBaseRecords('Everest','8').size());
        
        System.assertEquals(1, KnowledgeBaseSearchController.searchKnowledgeBaseRecords('Marketplace','6').size());
        System.assertEquals(0, KnowledgeBaseSearchController.searchKnowledgeBaseRecords('Marketplace','3').size());
        
        System.assertEquals(5, KnowledgeBaseSearchController.searchKnowledgeBaseRecords('Everest','Test').size());
        System.assertEquals(5, KnowledgeBaseSearchController.searchKnowledgeBaseRecords('Marketplace','Test').size());
    }
}