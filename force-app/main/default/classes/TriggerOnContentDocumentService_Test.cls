@isTest
public class TriggerOnContentDocumentService_Test{
    @isTest
    public static void testUpdateManagerPresentation(){
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Manager_Presentation__c mpRecord = new Manager_Presentation__c();
        mpRecord.Name = 'Test Files';
        mpRecord.Is_Active__c = true;
        insert mpRecord;
        
        ContentVersion contentVersion = new ContentVersion(
            Title = 'Test File',
            PathOnClient = 'testFile.pdf',
            VersionData = Blob.valueOf('Test Content'),
            IsMajorVersion = true
        );
        insert contentVersion; 
        
        ContentDocument doc = [SELECT Id FROM ContentDocument];
        ContentDocumentLink cdl = New ContentDocumentLink();
        cdl.LinkedEntityId = mpRecord.Id;
        cdl.ContentDocumentId = doc.Id;
        cdl.shareType = 'V';
        insert cdl;
        
        delete doc;

        Heroku_Credentials__c cs = New Heroku_Credentials__c();
        cs.Name = 'Authentication_Credentials';
        cs.Access_Token__c = '7mmWMaIKs2Cxvsiff7SX3SwLn/POtlHdhb+BB/9jtopu2w68Sw1Wf4Zq6a3GVfxeS/F8C6WcwyBg8NRRi+N/5w==';
        cs.Authentication_Key__c= 'lrGY/02l8WrqQftXLdFV3Q==';
        cs.Heroku_URL__c= 'https://marketplace-dakota-dev.herokuapp.com';
        cs.Expiry_Date__c= Datetime.now();
        cs.Password__c= 'zgDN+dXLx5wpSA9aJDFZOX1K6QEzkrU9c3RvNfxwAo0=';
        cs.Username__c= 'qa';
        insert cs;
        
        Manager_Presentation__c mpResult = [SELECT Id, Type__c FROM Manager_Presentation__c LIMIT 1];
        System.assertEquals(null, mpResult.Type__c);
        
    }
}