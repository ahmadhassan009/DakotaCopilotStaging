@isTest
public class TriggerOnAcct_Cnct_RelationService_Test 
{
    @testSetup
    public static void createTestData()
    {
        Account acct = new Account();
        acct.Name = 'Test Account';
        acct.AUM__c = 2000;
        acct.Type = 'Public Pension Fund';
        acct.Private_Equity__c = 'Yes';
        insert acct;
        
        Account acct2 = new Account();
        acct2.Name = 'Test Account 2';
        acct2.AUM__c = 3000;
        insert acct2;
        
        Contact cnct = new Contact();
        cnct.LastName = 'Test Contact';
        cnct.AccountId = acct.Id;
        cnct.Title = 'CEO';
        cnct.Contact_Type__c = 'CEO';
        insert cnct;
    }
    
    @isTest
    public static void testChildDakotaContentRecordName()
    {
        Account acct = [Select Id,Name from Account where Name = 'Test Account'];
        Contact cnct = [Select Id,Name from Contact where LastName = 'Test Contact'];
        
        Account_Contact_Relation__c acctCnctRelation = new Account_Contact_Relation__c();
        acctCnctRelation.Name = 'Test';
        acctCnctRelation.Account__c = acct.Id;
        acctCnctRelation.Contact__c = cnct.Id;
        insert acctCnctRelation;
        
        acctCnctRelation = [Select Id,Name from Account_Contact_Relation__c where Id = :acctCnctRelation.Id];
        System.assertEquals(acct.Name+' - '+cnct.Name, acctCnctRelation.Name);
        
        Account acct2 = [Select Id,Name from Account where Name = 'Test Account 2'];
        acctCnctRelation.Account__c = acct2.Id;
        update acctCnctRelation;
        
        acctCnctRelation = [Select Id,Name from Account_Contact_Relation__c where Id = :acctCnctRelation.Id];
        System.assertEquals(acct2.Name+' - '+cnct.Name, acctCnctRelation.Name);
    }
    
    @isTest
    public static void testAccountTypeInFundServiceProvider()
    {
        Account acct = [Select Id,Name from Account where Name = 'Test Account'];
        acct.ACK_ID__c = '123456789';
        update acct;
        
        Contact cnct = [Select Id,Name from Contact where LastName = 'Test Contact'];
        
        Account_Contact_Relation__c acctCnctRelation = new Account_Contact_Relation__c();
        acctCnctRelation.Name = 'Test';
        acctCnctRelation.Account__c = acct.Id;
        acctCnctRelation.Contact__c = cnct.Id;
        insert acctCnctRelation;
        
        acctCnctRelation = [Select Id,Form_5500_Account__c from Account_Contact_Relation__c where Id= :acctCnctRelation.Id];
        System.assertEquals(acctCnctRelation.Form_5500_Account__c, true);
    }   
}