@isTest 
public class ContactRelatedToAccountController_Test {
    
    @testSetUp
    public static void createTestData()
    {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To Contact';
        accountRecord.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        insert accountRecord;
        Contact con = new Contact();
        con.LastName = 'test LastName 1';
        con.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
        con.AccountId = accountRecord.Id;
        insert con;

        Contact[] contactRecords = new List<Contact>();
        for(Integer i=0; i< 9; i++) 
        {
            Contact cnct = new Contact();
            cnct.Lastname = 'Test Contact - ' + i;
            cnct.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
            cnct.AccountId = accountRecord.Id;
            
            contactRecords.add(cnct);	
        }
        insert contactRecords;

        University_Alumni__c uni = new University_Alumni__c();
        uni.Name = 'Test uni alumni';
        insert uni;

        Education__c education = new Education__c();
        education.University_Alumni__c = uni.Id;
        education.Contact__c = con.Id;
        education.Degree_Distinction__c='Undergraduate';
        insert education;
    }
    
    @isTest
    public static void testGetAccountName()
    {
        Account account = [Select Id,Name from Account where Name = 'Test Account Linked To Contact'];
        Account returedAccount = ContactRelatedToAccountController.getAccountName(account.Id);
        system.assertEquals(account.Name,returedAccount.Name);       
    }
    
    @isTest
    public static void testIsInvestmentAllocatorAccount()
    {
        Account account = [Select Id,Name from Account where Name = 'Test Account Linked To Contact'];
       system.assert(ContactRelatedToAccountController.isInvestmentAllocatorAccount(account.Id));    
    }
    
    @isTest
    public static void testContactRelatedToAccountControllerMethods()
    {
        Test.startTest();
        Account account = [Select Id,Name from Account where Name = 'Test Account Linked To Contact'];
        
        system.assertEquals(10,ContactRelatedToAccountController.getAccountRelatedContactCount(account.Id,''));
        system.assert(ContactRelatedToAccountController.getAccountRelatedContactRecords(account.Id,'Name','ASC', 'FIRST','') != null);
        system.assert(ContactRelatedToAccountController.getAllAccountRelatedContactRecords(account.Id, 10, 0,'') != null);
        system.assertEquals(10,ContactRelatedToAccountController.getAccountRelatedContactCount(account.Id,'Research Contacts'));
        system.assert(ContactRelatedToAccountController.getAccountRelatedContactRecords(account.Id,'Name','ASC', 'FIRST','Research Contacts') != null);
        system.assert(ContactRelatedToAccountController.getAllAccountRelatedContactRecords(account.Id, 10, 0,'Research Contacts') != null);
        Test.stopTest();
    }
    
    @isTest
    public static void testGetUserDetails()
    {
        Id userId = UserInfo.getUserId();
        System.assert(ContactRelatedToAccountController.getUserDetails(userId) != null);
    }
}