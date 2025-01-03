@isTest
public class TriggerOnDakotaContentService_Test {
    @testSetup
    public static void createTestData()
    {
        Account acct = new Account();
        acct.Name = 'Test Account';
        acct.AUM__c = 2000;
        acct.Type = 'Public Pension Fund';
        acct.Private_Equity__c = 'Yes';
        insert acct;
        
        Contact cnct = new Contact();
        cnct.LastName = 'Test Contact';
        cnct.AccountId = acct.Id;
        cnct.Title = 'CEO';
        cnct.Contact_Type__c = 'CEO';
        insert cnct;
        
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'Test MetroArea';
        insert metroArea;
    }
    
    @isTest
    public static void testParentDakotaContentRecordName()
    {
        Dakota_Content__c dakotaContent = new Dakota_Content__c();
        dakotaContent.Name = 'Test Parent Dakota Content';
        insert dakotaContent;   
        System.assertEquals('Test Parent Dakota Content', dakotaContent.Name);
    }
    
    @isTest
    public static void testChildDakotaContentRecordName()
    {
        Account acct = [Select Id,Name from Account where Name = 'Test Account'];
        Id recordTypeId = Schema.getGlobalDescribe().get('Dakota_Content__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Content_Lines').getRecordTypeId();

        Dakota_Content__c dakotaContent = new Dakota_Content__c();
        dakotaContent.Name = 'Test Child Dakota Content';
        dakotaContent.Account_Linked__c = acct.Id;
        dakotaContent.RecordTypeId = recordTypeId;
        insert dakotaContent;
        
        Dakota_Content__c dkContent = [Select Id,name from Dakota_Content__c where Id = :dakotaContent.Id];
        System.assertEquals(acct.Name, dkContent.Name);

        Contact cnct = [Select Id,Name,Title,Account.Name,AccountId from Contact where Name = 'Test Contact'];
        dkContent.Account_Linked__c = null;
        dkContent.Contact_Linked__c = cnct.Id;
        update dkContent;

        dkContent = [Select Id,name,Account_Linked__c from Dakota_Content__c where Id = :dakotaContent.Id];
        System.assertEquals(cnct.Name+', '+cnct.Title+', '+cnct.Account.Name, dkContent.Name);
        System.assertEquals(cnct.AccountId, dkContent.Account_Linked__c);

        Metro_Area__c metArea = [Select Id,Name from Metro_Area__c where Name = 'Test MetroArea'];
        dkContent.Account_Linked__c = null;
        dkContent.Contact_Linked__c = null;
        dkContent.Metro_Area_Linked__c = metArea.Id;
        update dkContent;

        dkContent = [Select Id,name from Dakota_Content__c where Id = :dakotaContent.Id];
        System.assertEquals(metArea.Name, dkContent.Name);
    }
    
    @isTest
    public static void testUpdateCMSCollectionVisibility()
    {
        Dakota_Content__c dakotaContent = new Dakota_Content__c();
        dakotaContent.Name = 'Test Dakota Content';
        dakotaContent.Date__c = Date.today().addDays(-1);
        insert dakotaContent;
        
        dakotaContent = [Select id,Name,Date__c,Visible_in_CMS_Collection__c from Dakota_Content__c where Name = 'Test Dakota Content' limit 1];
        System.assertEquals(true, dakotaContent.Visible_in_CMS_Collection__c);
        
        dakotaContent.Date__c = Date.today();
        update dakotaContent;
        System.assertEquals(true, dakotaContent.Visible_in_CMS_Collection__c);
        
        delete dakotaContent;
        List<Dakota_Content__c> dakotaContents = [Select id,Name,Date__c,Visible_in_CMS_Collection__c from Dakota_Content__c where Visible_in_CMS_Collection__c = true];
        System.assertEquals(0, dakotaContents.size());
    }
    
    @isTest
    public static void testUpdateMetroAreaReviewHighlight()
    {
        Metro_Area__c metroArea = [Select Id,Name from Metro_Area__c Limit 1];
        Dakota_Content__c dakotaContent = new Dakota_Content__c();
        dakotaContent.Name = 'Test Dakota Content';
        dakotaContent.Date__c = Date.today().addDays(-1);
        dakotaContent.Metro_Area_Linked__c = metroArea.Id;
        dakotaContent.Presentation_Recording_url__c = 'www.google.com';
        dakotaContent.Type__c = 'Metro Area Roadmap';
        insert dakotaContent;
        
        metroArea = [Select Id,Name,Metro_Area_Review_Highlight__c from Metro_Area__c where Id = :metroArea.Id];
        System.assertEquals('www.google.com', metroArea.Metro_Area_Review_Highlight__c);
        
        dakotaContent.Presentation_Recording_url__c = 'www.test.com';
        update dakotaContent;
        
        metroArea = [Select Id,Name,Metro_Area_Review_Highlight__c from Metro_Area__c where Id = :metroArea.Id];
        System.assertEquals('www.test.com', metroArea.Metro_Area_Review_Highlight__c);
    }
}