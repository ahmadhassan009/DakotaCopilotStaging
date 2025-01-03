@isTest
public class SearchesEmailAlertAndTaskCreation_Test {
    
    @testSetup
    public static void createTestData()
    {
        Account acct = new Account();
        acct.Name = 'Test Account';
        acct.Draft_Sales_Cycle__c = 'Current Customer';
        insert acct;
        
        List<Contact> contacts = new List<Contact>();
        for(integer i=0; i<10; i++)
        {
            Contact cnct = new Contact();
            cnct.Email = i == 5 ? 'test@dakota.com' : 'test@test.com' ;
            cnct.FirstName = 'Test';
            cnct.LastName = 'Contact ' + i;
            cnct.AccountId = acct.Id;
            cnct.Searches_Email__c = true;
            if(math.mod(i, 2) == 0)
            {
                cnct.Searches_Asset_Class__c = 'Private Credit';
            }
            else
            {
                cnct.Searches_Asset_Class__c = 'Private Equity';
            }
            contacts.add(cnct);
        }
        insert contacts;
        
        Marketplace_Searches__c searchRecord = new Marketplace_Searches__c();
        searchRecord.Name = 'Test Search';
        searchRecord.Asset_Class__c = 'Private Credit';
        insert searchRecord;

        Contact con = [ SELECT Id, Name FROM Contact LIMIT 1 ];
        TestDataFactory.createCaseAcct(con.Id, acct.Id);

        Restrict_Searches_Email_Alert__c custSetting = new Restrict_Searches_Email_Alert__c();
        custSetting.Name = 'Test Custom  Setting';
        custSetting.Number_of_Days__c = 30;
        custSetting.Sales_Cycle_Type__c = 'Prospecting,In Contract,Red zone,Field Goal Range,Evaluating';
        insert custSetting;
    }
    
    @isTest
    public static void testSearchForContactsWithSameAssetClasses()
    {
        Test.startTest();
        Marketplace_Searches__c searchRecord = [ SELECT Id, Name, Asset_Class__c FROM Marketplace_Searches__c LIMIT 1];
        SearchesEmailAlertAndTaskCreation.searchForContactsWithSameAssetClasses(new List<Id>{searchRecord.Id});
        Test.stopTest();
        List<Task> tasks = [SELECT Id,Subject FROM Task WHERE whatId = :searchRecord.Id];
        System.assert(tasks.size() > 0);
    }
}