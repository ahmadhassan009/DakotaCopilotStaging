@isTest
public class AccountPrintableViewController_Test 
{
    @testSetUp
    public static void createTestData()
    {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To Contact';
        accountRecord.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        insert accountRecord;
        
        Contact[] contactRecords = new List<Contact>();
        for(Integer i=0; i< 10; i++) 
        {
            Contact cnct = new Contact();
            cnct.Lastname = 'Test Contact - ' + i;
            cnct.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
            cnct.AccountId = accountRecord.Id;
            
            contactRecords.add(cnct);	
        }
        insert contactRecords;
    }
    
    @isTest 
    public static void testGetRelatedContactRecords()
    {
        Account account = [Select Id,Name from Account where Name = 'Test Account Linked To Contact'];
        system.assertEquals(10,AccountPrintableViewController.getRelatedContactRecords(account.Id).size());
    }
    @isTest 
    public static void testGetAccountRecordById()
    {
        Account account = [Select Id,Name from Account where Name = 'Test Account Linked To Contact'];
        system.assert(AccountPrintableViewController.getAccountRecordDetails(account.Id)!=null);
    }
}