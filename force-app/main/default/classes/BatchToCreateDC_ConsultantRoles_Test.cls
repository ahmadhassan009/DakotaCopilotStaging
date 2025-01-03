@isTest
public class BatchToCreateDC_ConsultantRoles_Test {
    
    
    @isTest
    public static void testBatchToCreateDCConsultantRoles()
    {
        Account acct = new Account();
        acct.Name = 'Test Account';
        insert acct;
        
        Account acct2 = new Account();
        acct2.Name = 'Test Account 2';
        insert acct2;
        
        List<Contact> contacts = new List<Contact>();
        for(integer i =0;i<50;i++)
        {
            Contact cnct = new Contact();
            cnct.AccountId = acct.Id;
            cnct.LastName = 'Test Contact '+i;
            cnct.Contact_Type__c = 'DC Consultant';
            cnct.Marketplace_Verified_Contact__c = true;
            contacts.add(cnct);
        }
        insert contacts;
        
        Fund_Service_Provider__c fundServProvider = new Fund_Service_Provider__c();
        fundServProvider.Name = 'Test Fund Serv Provider';
        fundServProvider.Service_Provider_Account__c = acct.Id;
        fundServProvider.Account__c = acct2.Id;
        insert fundServProvider;
        
        Test.startTest();
        BatchToCreateDC_ConsultantRoles btch = new BatchToCreateDC_ConsultantRoles();
        Database.executeBatch(btch);
        Test.stopTest();
        
        List<AccountContactRelation> accConRelation = [SELECT Id FROM AccountContactRelation WHERE AccountId = :acct2.Id];
        System.assert(accConRelation.size() == 50);
    }
}