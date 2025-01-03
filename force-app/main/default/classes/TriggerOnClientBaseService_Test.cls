@isTest 
public class TriggerOnClientBaseService_Test {
    @testSetUp
    public static void createTestData()
    {       
        Account accA = new Account();
        accA.Name = 'Test Account A';
        insert accA;
        
        Account accB = new Account();
        accB.Name = 'Test Account B123456789123456789123456789123456789123456789123456789123456789';
        insert accB; 
        
        Client_Base__c cb0 = new Client_Base__c ();
        cb0.AUM__c=67890;
        cb0.Type__c='High Net Worth Individuals';
        cb0.Number_of_Clients__c=6;
        cb0.Name='Test Client Base';
        cb0.Account__c=accA.Id;        
        insert cb0; 
        
        Client_Base__c cb1 = new Client_Base__c ();
        cb1.AUM__c=67890;
        cb1.Type__c='Corporations or Other Businesses Not Listed Above';
        cb1.Number_of_Clients__c=6;
        cb1.Name='Test Client Base 2';
        cb1.Account__c=accB.Id;        
        insert cb1;
    }
    @isTest 
    public static void testSetClientBaseName()
    {
        List<Client_Base__c> cb2 = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account B12345678912345678912345678912 - Corporations/Other Business Client']; 
        System.assert(cb2.size()==1);
        
        List<Client_Base__c> cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - HNW Individual Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='Individuals (other than high net worth individuals)';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - Individual Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='Banking or Thrift Institutions';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - Banking/Thrift Institution Client'];       
        System.assert(cb.size()==1);
        
        Test.startTest();
        cb[0].Type__c='Investment Companies';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - Investment Company Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='Business Development Companies';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - BDC Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='Pooled Investment Vehicles (other than investment companies and business development companies)';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - Pooled Investment Vehicle Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='Pension and Profit Sharing Plans (but not the plan participants or government pension plans)';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - Pension/Profit Sharing Plan Client'];       
        System.assert(cb.size()==1);
        Test.stopTest();
    }
    
    @isTest
    public static void testSetClientBaseNameRemainingTypes()
    {
        List<Client_Base__c> cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - HNW Individual Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='Charitable Organizations';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - Charitable Organization Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='State or Municipal Government Entities (including government pension plans)';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - State/Municipal Gov’t Entity Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='Other Investment Advisers';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - Other Investment Adviser Client'];       
        System.assert(cb.size()==1);
        
        Test.startTest();
        cb[0].Type__c='Insurance Companies';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - Insurance Company Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='Sovereign Wealth Funds and Foreign Official Institutions';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - SWF/Foreign Official Institution Client'];       
        System.assert(cb.size()==1);
        
        cb[0].Type__c='Corporations or Other Businesses Not Listed Above';
        update cb;
        
        cb = [Select Id,Name,AUM__c,Type__c from Client_Base__c where Name='Test Account A - Corporations/Other Business Client'];       
        System.assert(cb.size()==1);
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateNumberofQPsInParentAccount()
    {
        Client_Base__c clientBase = [Select Id,Name,Account__c,Number_of_Clients__c from Client_Base__c Where Type__c = 'High Net Worth Individuals' Limit 1];
        clientBase.Number_of_Clients__c = 100;
        update clientBase;
        
        Id parentAccountId = clientBase.Account__c;
        Account acct = [Select Id,Number_of_QPS__c from Account where Id = :parentAccountId Limit 1];
        System.assertEquals(clientBase.Number_of_Clients__c * 0.3, acct.Number_of_QPS__c);
        
        clientBase = [Select Id,Name,Account__c,Number_of_Clients__c,Type__c from Client_Base__c Where Type__c != 'High Net Worth Individuals' Limit 1];
        clientBase.Type__c = 'High Net Worth Individuals';
        update clientBase;
        
        parentAccountId = clientBase.Account__c;
        acct = [Select Id,Number_of_QPS__c from Account where Id = :parentAccountId Limit 1];
        System.assertEquals(Integer.valueOf(clientBase.Number_of_Clients__c * 0.3), acct.Number_of_QPS__c);
        
        Account acct2 = [Select Id,Name from Account where Id != :parentAccountId Limit 1];
        
        clientBase.Account__c = acct2.Id;
        update clientBase;
        
        acct2 = [Select Id,Number_of_QPS__c from Account where Id = :acct2.Id Limit 1];
        System.assertEquals(Integer.valueOf(clientBase.Number_of_Clients__c * 0.3), acct.Number_of_QPS__c);
        
        Decimal numOfClients = clientBase.Number_of_Clients__c;
        delete clientBase;
        acct2 = [Select Id,Number_of_QPS__c from Account where Id = :acct2.Id Limit 1];
        System.assertNotEquals(numOfClients, acct.Number_of_QPS__c);
    }
}