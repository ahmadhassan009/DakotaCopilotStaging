@isTest
public class TriggerOnAccountContactRelation_Test {

    @TestSetup
    static void makeData(){
        Account account1 = new Account();
        account1.Name = 'Test Account 1';
        account1.Not_a_fit_for_MarketplaceII__c = true;
        insert account1;
    
        Account childAccount = new Account(Name = 'Child Account', ParentId = account1.Id);
        insert childAccount;
        
        Contact con = new Contact();
        con.LastName = 'test LastName 1';
        con.AccountId = account1.Id;
        insert con;

        AccountContactRelation accCont=new AccountContactRelation();
        accCont.AccountId=childAccount.Id;
        accCont.ContactId=con.Id;
        accCont.Roles = 'General Consultant';
        insert accCont;

        TestDataFactory.createHerokuAuthMetadata();

    }
    
    @isTest
    public static void testRefreshAccountContactRelation()
    {
        Test.startTest();
        Account account1 = new Account();
        account1.Name = 'Test Account 1';
        insert account1;
        
        Account account2 = new Account();
        account2.Name = 'Test Account';
        insert account2;
        
        Contact con = new Contact();
        con.LastName = 'test LastName 1';
        con.AccountId = account1.Id;
        insert con;
        
        con.AccountId = account2.Id;
        update con;
    
        System.assert(TriggerOnAccountContactRelationService.eventList.size()==3);
        Test.stopTest();
    }

    @IsTest
    static void testUpdateNotaFitForDakotaTalentFlagInContacts() 
    {    
        Test.startTest();
        Account acc  = [SELECT Id, Not_a_fit_for_MarketplaceII__c FROM Account where Name = 'Test Account 1'];
        Contact cont  = [SELECT Id, Not_a_fit_for_MarketplaceII__c FROM Contact where AccountId = :acc.Id];
        if(cont != null ){
            System.assertEquals(true, cont.Not_a_fit_for_MarketplaceII__c);
        }
        Test.stopTest();
    }

    @IsTest
    static void testDeleteRecFromHeroku() 
    {    
        Test.setMock(HttpCalloutMock.Class, new MockHttpCallout_Test());
        Test.startTest();
        AccountContactRelation accContRel  = [SELECT Id,IsDirect FROM AccountContactRelation where IsDirect!=true limit 1];
        delete accContRel;
        Test.stopTest();
    }
}