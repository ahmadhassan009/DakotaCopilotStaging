@IsTest
public with sharing class InvestmentCommitteeNotesController_Test {
    @testSetUp
    public static void createTestData()
    {
        Id investmentRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
    	
        Metro_Area__c metro = new Metro_Area__c(name='Test MetroArea');
        insert metro;   
        
        Account acc = new Account();
        acc.Name = 'Test Account';
        acc.RecordTypeId = investmentRecordTypeId;
        acc.MetroArea__c = metro.Id;
        acc.AUM__c = 213123;
        insert acc;
        
        Public_Plan_Minute__c icNote = new Public_Plan_Minute__c
        (
            Name = 'Test Note',
            Meeting_Date__c = System.today(),
            Account__c = acc.Id,
            Meeting_Note_Summary__c = 'test summary'
        );
        insert icNote;
    }
    @IsTest
    static void testGetNotes() 
    {
        System.assertEquals(1,InvestmentCommitteeNotesController.getICNotesList('Meeting_Date__c', 'ASC',1, 0,'').size());
        System.assertEquals(1,InvestmentCommitteeNotesController.getNotesCount(''));
        
        System.assertEquals(1,InvestmentCommitteeNotesController.getICNotesList('Meeting_Date__c', 'ASC',1, 0,'Test').size());
        System.assertEquals(1,InvestmentCommitteeNotesController.getNotesCount('Test'));
    }
}