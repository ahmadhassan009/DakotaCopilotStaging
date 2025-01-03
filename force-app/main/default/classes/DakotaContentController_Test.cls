@isTest
public class DakotaContentController_Test {
    
    @testSetup
    public static void createTestData()
    {
        Account acct = new Account();
        acct.Name = 'Test Account';
        acct.AUM__c = 2000;
        acct.Type = 'Public Pension Fund';
        insert acct;
        
        Contact cnct = new Contact();
        cnct.LastName = 'Test Contact ';
        cnct.AccountId = acct.Id;
        cnct.Contact_Type__c = 'CFO';
        insert cnct;
        
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'Test MetroArea';
        insert metroArea;

        Id contentRecordTypeId = Schema.getGlobalDescribe().get('Dakota_Content__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Content').getRecordTypeId();
        Id contentLineRecordTypeId = Schema.getGlobalDescribe().get('Dakota_Content__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Content_Lines').getRecordTypeId();

        Dakota_Content__c dakotaContentParent = new Dakota_Content__c();
        dakotaContentParent.Name = 'Test Parent DC';
        dakotaContentParent.Type__c = 'Sales Training';
        dakotaContentParent.RecordTypeId = contentRecordTypeId;
        insert dakotaContentParent;
        
        Dakota_Content__c dakotaContentAcct = new Dakota_Content__c();
        dakotaContentAcct.Name = 'Test DakotaContent 1';
        dakotaContentAcct.Account_Linked__c = acct.Id;
        dakotaContentAcct.Type__c = 'Key Account';
        dakotaContentAcct.Dakota_Live_Call__c = dakotaContentParent.Id;
        dakotaContentAcct.RecordTypeId = contentRecordTypeId;
        insert dakotaContentAcct;
        
        Dakota_Content__c dakotaContentCnct = new Dakota_Content__c();
        dakotaContentCnct.Name = 'Test DakotaContent 2';
        dakotaContentCnct.Contact_Linked__c = cnct.Id;
        dakotaContentCnct.Type__c = 'Metro Area Roadmap';
        dakotaContentCnct.Dakota_Live_Call__c = dakotaContentParent.Id;
        dakotaContentCnct.RecordTypeId = contentRecordTypeId;
        insert dakotaContentCnct;

        Dakota_Content__c dakotaContentMet = new Dakota_Content__c();
        dakotaContentMet.Name = 'Test DakotaContent 3';
        dakotaContentMet.Metro_Area_Linked__c = metroArea.Id;
        dakotaContentMet.Type__c = 'Allocator Interview';
        dakotaContentMet.Dakota_Live_Call__c = dakotaContentParent.Id;
        dakotaContentMet.RecordTypeId = contentLineRecordTypeId;
        insert dakotaContentMet;
        
        Restricted_Dakota_Content_Types__c restrictedType = new Restricted_Dakota_Content_Types__c(Name = 'Webinar');
        insert restrictedType;
    }
    
    @isTest
    public static void testFetchFilteredRecords()
    {
        String filters = '[]';
        DakotaContentController.DakotaContentWrapper returnedResult = DakotaContentController.fetchFilteredRecords(filters,'20','0','Date__c','asc');
        System.assertEquals(3,returnedResult.dcRecords.size());
        
        filters = '[{"label":"Test Contact","name":"Test Contact"},'+
            '{"label":"Public Pension","name":"Public Pension"},'+
            ' {"label":"Allocator Interview","name":"Allocator Interview"}]';
         returnedResult = DakotaContentController.fetchFilteredRecords(filters,'20','0','Date__c','asc');
        System.assertEquals(3,returnedResult.dcRecords.size());
        
        filters = '[{"label":"Test MetroArea","name":"Test MetroArea"},'+
            '{"label":"Metro Area Roadmap","name":"Metro Area Roadmap"},'+
            ' {"label":"Admin","name":"Admin"}]';
        returnedResult = DakotaContentController.fetchFilteredRecords(filters,'20','0','Date__c','asc');
        System.assertEquals(2,returnedResult.dcRecords.size());
    }
}