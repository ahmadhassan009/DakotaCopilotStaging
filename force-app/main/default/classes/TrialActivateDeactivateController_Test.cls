@isTest
public class TrialActivateDeactivateController_Test {

    @testSetUp
    public static void createTestData()
    {
        Account acct = new Account(
            Name = 'Test Account'
        );
        insert acct;
    }
    
    @isTest
    public static void testChangeAccountTrialStatus()
    {
        Account acct = [Select Id,Name,Active_Draft_Trial__c,Trial_Start_Date__c,Trial_End_Date__c from Account Limit 1];
        System.assertEquals(false, acct.Active_Draft_Trial__c);
        
        TrialActivateDeactivateController.changeAccountTrialStatus(acct.Id);
        
        acct = [Select Id,Name,Active_Draft_Trial__c,Trial_Start_Date__c,Trial_End_Date__c from Account Limit 1];
        System.assertEquals(true, acct.Active_Draft_Trial__c);
        System.assertEquals(Date.today(), acct.Trial_Start_Date__c);
        
        TrialActivateDeactivateController.changeAccountTrialStatus(acct.Id);
        acct = [Select Id,Name,Active_Draft_Trial__c,Trial_Start_Date__c,Trial_End_Date__c from Account Limit 1];
        System.assertEquals(false, acct.Active_Draft_Trial__c);
        System.assertEquals(Date.today(), acct.Trial_End_Date__c);
    }
}