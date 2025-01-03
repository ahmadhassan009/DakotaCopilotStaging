@isTest 
public with sharing class InvestmentsInAccountsController_Test {
   
    @isTest
    public static void testGetAccountName(){
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To Investment Record';
        insert accountRecord;
        Account returedAccount = InvestmentsInAccountsController.getAccountName(accountRecord.Id);
        system.assertEquals(returedAccount.Name,'Test Account Linked To Investment Record');       
    }
    
    @isTest 
    public static void testInvestmentsRelatedToAccountControllerMethods(){
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To Contact';
        accountRecord.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        insert accountRecord;
        
         Account invFirmaccountRecord = new Account();
        invFirmaccountRecord.Name = 'Test Account Linked To Contact';
        invFirmaccountRecord.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
        insert invFirmaccountRecord;

        Investment__c[] investmentsRecords = new List<Investment__c>();
        for(Integer i=0; i< 10; i++) {
        	Investment__c msObj = new Investment__c(
                Name = 'Test X13F_Filings - ' + i, 
                RecordTypeId = Schema.SObjectType.Investment__c.getRecordTypeInfosByDeveloperName().get('X13F_Filings').getRecordTypeId(),
                Account__c = accountRecord.Id);
            
                investmentsRecords.add(msObj);	
        }
        for(Integer i=0; i< 10; i++) {
        	Investment__c msObj = new Investment__c(
                Name = 'Test Public_Investment - ' + i, 
                RecordTypeId = Schema.SObjectType.Investment__c.getRecordTypeInfosByDeveloperName().get('Public_Investment').getRecordTypeId(),
                Account__c = accountRecord.Id);
            
                investmentsRecords.add(msObj);	
        }
        
        Investment_Strategy__c invStr = new Investment_Strategy__c();
        invStr.Name = 'Test Inv Strategy';
        invStr.Account__c = invFirmaccountRecord.Id;
        insert invStr;
        
        List<Investment__c> investmentsRelatedToStrategyRecords = new List<Investment__c>();
        for(Integer i=0; i< 10; i++) {
        	Investment__c msObj = new Investment__c(
                Name = 'Test Public_Investment - ' + i, 
                RecordTypeId = Schema.SObjectType.Investment__c.getRecordTypeInfosByDeveloperName().get('Public_Investment').getRecordTypeId(),
                Investment_Strategy__c = invStr.Id);
                investmentsRelatedToStrategyRecords.add(msObj);	
        }
        insert investmentsRelatedToStrategyRecords;


        system.assertEquals(InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsCount(accountRecord.Id, 'Public Investment','','True','True','',''),0);
        system.assertEquals(InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsCount(accountRecord.Id, '13F Filings','','True','','True',''),0);
        system.assertEquals(InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsCount(accountRecord.Id, 'Public Investment','','True','','',''),0);
        system.assertEquals(InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsCount(accountRecord.Id, '13F Filings','Test','True','','True',''),0);
        system.assertEquals(InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsCount(accountRecord.Id, '13F Filings','Test','True','','',''),0);
        system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecords(accountRecord.Id+'', 'Public Investment','name','asc','Last',10, 0,'','True','True','','') != null);
        system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecords(accountRecord.Id+'', 'Public Investment','name','asc','Last',10, 0,'','True','','True','') != null);
        system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecords(accountRecord.Id+'', '13F Filings','name','asc','Last',10, 0,'','True','','','') != null);
        system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecords(accountRecord.Id+'', '13F Filings','name','asc','Last',10, 0,'','','','','') != null);
        
             system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecords(accountRecord.Id+'', '13F Filings','name','asc','Last',10, 0,'Test','True','True','','') != null);
        system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecords(accountRecord.Id+'', '13F Filings','name','asc','Last',10, 0,'Test','True','','True','') != null);
        system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecords(accountRecord.Id+'', '13F Filings','name','asc','Last',10, 0,'Test','True','','','') != null);
        system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecords(accountRecord.Id+'', '13F Filings','name','asc','Last',10, 0,'Test','','','','') != null);
        system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsInRelatedList(accountRecord.Id, 'Public Investment','Name', 'asc', 'FIRST') != null);
        system.assert(InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsInRelatedList(accountRecord.Id, '13F Filings','Name', 'asc', 'FIRST') != null);
    }
}