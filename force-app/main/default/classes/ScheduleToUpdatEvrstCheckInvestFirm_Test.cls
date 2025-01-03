@isTest
public class ScheduleToUpdatEvrstCheckInvestFirm_Test {
    
    @isTest
    static void testScheduleToUpdatEverestCheckboxInvestFirm() {
        // Create test data
        Id investmentRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();

        Account testAccount = new Account(Name = 'Test Account', X100_Everest__c = false, recordtypeId = investmentRecordTypeId);
        insert testAccount;

        Investment__c testInvestment = new Investment__c(Name = 'Test Investment', Account__c = testAccount.Id);
        insert testInvestment;

        Test.startTest();
        ScheduleToUpdatEverestCheckboxInvestFirm sc = new ScheduleToUpdatEverestCheckboxInvestFirm();
        sc.execute(null); 
        Test.stopTest();

        testAccount = [SELECT Id, X100_Everest__c FROM Account WHERE Id = :testAccount.Id];
        System.assertEquals(true, testAccount.X100_Everest__c);
    }
}