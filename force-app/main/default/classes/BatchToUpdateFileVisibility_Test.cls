@isTest
public class BatchToUpdateFileVisibility_Test
{
    // @testSetup
    // public static void testCreateData()
    // {
    //     Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
    //     ContentVersion contentVersion = new ContentVersion(
    //         Title = 'Test File',
    //         PathOnClient = 'testFile.pdf',
    //         VersionData = Blob.valueOf('Test Content'),
    //         IsMajorVersion = true
    //     );
    //     insert contentVersion;
        
    //     Id docId = [SELECT Id, Title, LatestPublishedVersionId FROM ContentDocument Limit 1].Id;
        
    //     Account acct = new Account();
    //     acct.Name = 'Test File Account';
    //     insert acct;
        
    //     ContentDocumentLink cdl = New ContentDocumentLink();
    //     cdl.LinkedEntityId = acct.Id;
    //     cdl.ContentDocumentId = docId;
    //     cdl.shareType = 'V';
    //     cdl.Visibility = 'AllUsers';
    //     insert cdl;
        
    //     Heroku_Credentials__c cs = New Heroku_Credentials__c();
    //     cs.Name = 'Authentication_Credentials';
    //     cs.Access_Token__c = '7mmWMaIKs2Cxvsiff7SX3SwLn/POtlHdhb+BB/9jtopu2w68Sw1Wf4Zq6a3GVfxeS/F8C6WcwyBg8NRRi+N/5w==';
    //     cs.Authentication_Key__c= 'lrGY/02l8WrqQftXLdFV3Q==';
    //     cs.Heroku_URL__c= 'https://marketplace-dakota-dev.herokuapp.com';
    //     cs.Expiry_Date__c= Datetime.now();
    //     cs.Password__c= 'zgDN+dXLx5wpSA9aJDFZOX1K6QEzkrU9c3RvNfxwAo0=';
    //     cs.Username__c= 'qa';
    //     insert cs;
    // }
    
    @isTest
    public static void testBatchToUpdateFileVisibility()
    {
        List<Account> acctList = new List<Account>();
        Id investmentRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();

        for(integer i= 0 ; i<100; i++)
        {
            Account acct = new Account();
            acct.Name = 'Test Account';
            acct.description = 'Test Account description';
            acct.recordtypeId = investmentRecordTypeId;
            acctList.add(acct);
        }
        insert acctList;

        Test.startTest();
        //Id batchInstanceId = Database.executeBatch(new BatchToUpdateFileVisibility(), 50);     
        
        BatchToUpdateFileVisibility btch = new BatchToUpdateFileVisibility();
        Database.executeBatch(btch);
        Test.stopTest();
        
        Account acct = [Select Id,description,Investment_Firm_Description__c from Account where Name = 'Test Account' Limit 1];
        
        System.assertEquals(acct.Description,acct.Investment_Firm_Description__c);
    }
}