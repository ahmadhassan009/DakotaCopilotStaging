@IsTest
public with sharing class ICNotesDetailsController_Test {
    @testSetUp
    public static void createTestData()
    {
        Id investmentRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        Id contactInvestmentRecordTypeId = Schema.getGlobalDescribe().get('Contact').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
    	
        Metro_Area__c metro = new Metro_Area__c(name='Test MetroArea');
        insert metro;   

        Account acc2 = new Account();
        acc2.Name = 'Test Account';
        acc2.RecordTypeId = investmentRecordTypeId;
        acc2.MetroArea__c = metro.Id;
        acc2.AUM__c = 213123;
        acc2.X100_Marketplace__c = true;
        acc2.Phone = '123456789';
        acc2.BillingStreet = 'test street';
        acc2.BillingCity = 'test city';
        acc2.BillingCountry = 'test country';
        acc2.BillingState = 'test state';
        acc2.BillingPostalCode = '09865';
        acc2.Website = 'abc@gmail.com';
        acc2.Type = 'Family Office';
        acc2.Marketplace_Verified_Date__c = System.today();
        insert acc2;

        List<Contact> contactsToBeInserted = new List<Contact>(); 
        for(Integer i=0; i< 12; i++){
            Contact cont = new Contact();
            cont.LastName = 'Test Contact ' + i;
            cont.AccountId = acc2.Id;
            cont.RecordTypeId = contactInvestmentRecordTypeId;
            cont.Marketplace_Verified_Contact__c = true;
            cont.RecordtypeId = Schema.SObjectType.Contact.getRecordTypeInfosByName().get('Investment Allocator Contact').getRecordTypeId();
            cont.Title = 'Test Title';
            contactsToBeInserted.add(cont);
        }
        insert contactsToBeInserted;
        
        Account acc1 = new Account();
        acc1.name = 'test acc';
        acc1.General_Consultant__c = acc2.Id;
        acc1.General_Consultant_2__c = acc2.Id;
        acc1.RecordTypeId = investmentRecordTypeId;
        acc1.Real_Estate_Consultant__c = acc2.Id;
        acc1.Private_Equity_Consultant__c = acc2.Id;
        acc1.Private_Credit_Consultant__c = acc2.Id;
        acc1.Hedge_Fund_Consultant__c = acc2.Id;
        acc1.AUM__c = 200000;
        insert acc1;
        
        List<Contact> relatedContact  = [SELECT Id, LastName FROM Contact WHERE LastName LIKE 'Test Contact %'];
        List<AccountContactRelation> accConRelationList = new List<AccountContactRelation>();
        Integer counter = 1;
        for(Contact cc : relatedContact) {
            counter++;
            AccountContactRelation accConRelation = new AccountContactRelation();
            accConRelation.Contactid = cc.id;
            accConRelation.Accountid = acc1.id;
            if(counter==1 || counter==7)
            	accConRelation.Roles = 'General Consultant;Private Equity Consultant';
            if(counter==2 || counter==8)
            	accConRelation.Roles = 'Hedge Funds Consultant;General Consultant;Private Equity Consultant';
            if(counter==3 || counter==9)
            	accConRelation.Roles = 'Real Estate Consultant';
            if(counter==4 || counter==10)
            	accConRelation.Roles = 'Hedge Funds Consultant;General Consultant;Private Equity Consultant';
            if(counter==5 || counter==11)
            	accConRelation.Roles = 'Hedge Funds Consultant;General Consultant;Private Equity Consultant';
            if(counter==6 || counter==12)
            	accConRelation.Roles = 'Private Credit Consultant';
            accConRelationList.add(accConRelation);
        }
        insert accConRelationList;
        
        List<Public_Plan_Minute__c> icNotesList = new List<Public_Plan_Minute__c>();
        Public_Plan_Minute__c icNote = new Public_Plan_Minute__c
        (
            Name = 'Test Note',
            Meeting_Date__c = System.today(),
            Account__c = acc1.Id,
            Meeting_Note_Summary__c = 'test summary'
        );
        icNotesList.add(icNote);
        insert icNotesList;
    }
    @IsTest
    static void testGetNotes() {
        Test.setCurrentPageReference(new PageReference('Page.ICNotesDetails')); 
        System.currentPageReference().getParameters().put('notesIds', [SELECT Id FROM Public_Plan_Minute__c LIMIT 1].Id);
        System.assertEquals(1,ICNotesDetailsController.getNotes().size());
        
    }
}