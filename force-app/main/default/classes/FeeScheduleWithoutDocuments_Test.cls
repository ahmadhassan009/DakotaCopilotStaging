@isTest
public with sharing class FeeScheduleWithoutDocuments_Test {
    @testSetup
    public static void createTestDate()
    {
        Id feeScheduleRecordTypeId = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Fee_Schedule').getRecordTypeId();
        Account a1 = new Account();
        a1.Name = 'Test Account';
        a1.Type = 'RIA';
        insert a1;
        
        Manager_Presentation__c fsRecord = new Manager_Presentation__c();
        fsRecord.Name = 'Test Files';
        fsRecord.Is_Active__c = true;
        fsRecord.RecordTypeId = feeScheduleRecordTypeId;
        fsRecord.Account__c = a1.Id;
        insert fsRecord;
    }

    @isTest
    public static void testGetAccountName()
    {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To MP';
        insert accountRecord;
        Account returedAccount = FeeScheduleWithoutDocuments.getAccountName(accountRecord.Id);
        system.assertEquals(returedAccount.Name,'Test Account Linked To MP');       
    }

    @isTest
    public static void testGetFeeScheduleRecords(){
        Account acc = [Select Id from Account where Name = 'Test Account' Limit 1]; 
        System.assertEquals(1, FeeScheduleWithoutDocuments.getFeeScheduleRecords(acc.Id, '', 'asc', 'FIRST').size());
    }

}