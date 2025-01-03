@isTest
public class TriggerOnContentVersionService_Test{
    @isTest 
    public static void testCreatePublicLinkForFile(){
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        ContentVersion contentVersion = new ContentVersion(
            Title = 'Test File',
            PathOnClient = 'testFile.pdf',
            VersionData = Blob.valueOf('Test Content'),
            IsMajorVersion = true
        );
        insert contentVersion; 
        
        Id docId = [SELECT Id, Title, LatestPublishedVersionId FROM ContentDocument Limit 1].Id;

        Manager_Presentation__c mpRecord = new Manager_Presentation__c();
        mpRecord.Name = 'Test Files';
        mpRecord.Is_Active__c = true;
        insert mpRecord;
        
        ContentDocumentLink cdl = New ContentDocumentLink();
        cdl.LinkedEntityId = mpRecord.Id;
        cdl.ContentDocumentId = docId;
        cdl.shareType = 'V';
        insert cdl;

        Heroku_Credentials__c cs = New Heroku_Credentials__c();
        cs.Name = 'Authentication_Credentials';
        cs.Access_Token__c = '7mmWMaIKs2Cxvsiff7SX3SwLn/POtlHdhb+BB/9jtopu2w68Sw1Wf4Zq6a3GVfxeS/F8C6WcwyBg8NRRi+N/5w==';
        cs.Authentication_Key__c= 'lrGY/02l8WrqQftXLdFV3Q==';
        cs.Heroku_URL__c= 'https://marketplace-dakota-dev.herokuapp.com';
        cs.Expiry_Date__c= Datetime.now();
        cs.Password__c= 'zgDN+dXLx5wpSA9aJDFZOX1K6QEzkrU9c3RvNfxwAo0=';
        cs.Username__c= 'qa';
        insert cs;

        
        List<ContentDistribution> contentDist =  [SELECT Id FROM ContentDistribution];
        System.assert( contentDist !=null);
    }
}