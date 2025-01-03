@isTest
public class TriggerOnCaseService_Test {
    
    @testSetup
    public static void createTestData()
    {
        Contact cnct = new Contact();
        cnct.LastName = 'Test Contact';
        cnct.Email = 'test@test.com';
        insert cnct;
        Account acc = new Account();
        acc.Name='Test Account';
        acc.Phone='+923341456789';
        acc.BillingStreet='200 Vesey St';
        acc.BillingCity = 'New York';
        acc.BillingState = 'New York';
        acc.BillingPostalCode = '10281';
        acc.BillingCountry = 'United States';
        insert acc;        
    }
    
    @isTest
    public static void testsetPhoneAndBillingAddress()
    {
        Id caseRecordTypeId = Schema.getGlobalDescribe().get('Case').getDescribe().getRecordTypeInfosByDeveloperName().get('Create_Contacts').getRecordTypeId();
        Contact cnct = [Select Id,Name,Searches_Asset_Class__c from Contact where Name = 'Test Contact'];
        Account acc = [Select Id,Name,Phone,BillingStreet,BillingCity,BillingState,BillingPostalCode,BillingCountry from Account where Name = 'Test Account'];
        Case newCase = new Case();
        newCase.Contact_Last_Name__c = 'Test';
        newCase.First_Name__c ='Case';
        newCase.Subject = 'Asset Class Preference';
        newCase.Origin = 'Web';
        newCase.ContactId = cnct.Id;        
        newCase.Status = cnct.Id;
        newCase.AccountId=acc.Id;
        newCase.RecordTypeId = caseRecordTypeId;
        newCase.SuppliedEmail = 'test@test.com';
        insert newCase;
        
        Case cs=[SELECT Id, Phone__c, Mailing_Street__c, Mailing_Zip_Postal_Code__c, Mailing_City__c, Mailing_State__c, Mailing_Country__c from Case where Id= :newCase.Id];
        System.assertEquals(acc.Phone, cs.Phone__c);
        System.assertEquals(acc.BillingStreet, cs.Mailing_Street__c);
        System.assertEquals(acc.BillingPostalCode, cs.Mailing_Zip_Postal_Code__c);
        System.assertEquals(acc.BillingCity, cs.Mailing_City__c);
        System.assertEquals(acc.BillingState, cs.Mailing_State__c);
        System.assertEquals(acc.BillingCountry, cs.Mailing_Country__c);
        
    }
    @isTest
    public static void testSetContactSearchAssetClassesMatching()
    {
        Contact cnct = [Select Id,Name,Searches_Asset_Class__c from Contact where Name = 'Test Contact'];
        Account acc = [Select Id,Name,Phone from Account where Name = 'Test Account'];
        Case newCase = new Case();
        newCase.Subject = 'Asset Class Preference';
        newCase.Origin = 'Web';
        newCase.Equities_and_Fixed_Income_Searches__c = true;
        newCase.Private_Credit_Searches__c = true;
        newCase.Private_Equity_Searches__c = true;
        newCase.Private_Real_Estate_Searches__c = true;
        newCase.Emerging_Manager_Searches__c = true;
        newCase.International_Equities__c = true;
        newCase.Equities__c = true;
        newCase.Hedge_Funds__c = true;
        newCase.SuppliedEmail = 'test@test.com';
        newCase.ContactId = cnct.Id;
        newCase.AccountId=acc.Id;
        insert newCase;
        
        EmailPreference_To_AssetClass__mdt emailPrefrecnes = [Select Id,DeveloperName,MasterLabel from EmailPreference_To_AssetClass__mdt where DeveloperName = 'Fixed_Income'];
        
        cnct = [Select Id,Name,Searches_Asset_Class__c from Contact where Name = 'Test Contact'];
        System.assert(String.valueOf(cnct.Searches_Asset_Class__c).contains(emailPrefrecnes.MasterLabel));
        
        newCase = [Select Id,Status from Case where Subject = 'Asset Class Preference'];
        System.assertEquals('Closed', newCase.Status);
    }
    
    @isTest
    public static void testSetContactSearchAssetClassesNotMatching()
    {
        Account acc = [Select Id,Name,Phone from Account where Name = 'Test Account'];
        Case newCase = new Case();
        newCase.Subject = 'Asset Class Preference';
        newCase.Origin = 'Web';
        newCase.SuppliedEmail = 'test2@test.com';
        newCase.Equities_and_Fixed_Income_Searches__c = true;
        newCase.Private_Credit_Searches__c = true;
        newCase.AccountId=acc.Id;
        insert newCase;
        
        Contact cnct = [Select Id,Name,Searches_Asset_Class__c from Contact where Name = 'Test Contact'];
        System.assertEquals(null, cnct.Searches_Asset_Class__c);
        
        newCase = [Select Id,Status from Case where Subject = 'Asset Class Preference'];
        System.assertEquals('New', newCase.Status);
    }
    
    @isTest
    public static void testSetContactSearchAssetClassesNoCheckboxChecked()
    {
        Contact cnct = [Select Id,Name,Searches_Asset_Class__c from Contact where Name = 'Test Contact'];
        Account acc = [Select Id,Name,Phone from Account where Name = 'Test Account'];
        
        Case newCase = new Case();
        newCase.Subject = 'Asset Class Preference';
        newCase.Origin = 'Web';
        newCase.SuppliedEmail = 'test2@test.com';
        newCase.ContactId = cnct.Id;
        newCase.AccountId=acc.Id;       
        insert newCase;
        
        cnct = [Select Id,Name,Searches_Asset_Class__c from Contact where Name = 'Test Contact'];
        System.assertEquals(null, cnct.Searches_Asset_Class__c);
        
        newCase = [Select Id,Status from Case where Subject = 'Asset Class Preference'];
        System.assertEquals('Closed', newCase.Status);
    }
    
    @isTest
    public static void testSetContactSearchAssetClassesCaseUpdate()
    {        
        Account acc = [Select Id,Name,Phone from Account where Name = 'Test Account'];       
        Case newCase = new Case();
        newCase.Subject = 'Asset Class Preference';
        newCase.Origin = 'Web';
        newCase.SuppliedEmail = 'testNoContact@test.com';
        newCase.Private_Credit_Searches__c = true;
        newCase.AccountId=acc.Id;       
        insert newCase;
        
        Contact cnct = [Select Id,Name,Searches_Asset_Class__c from Contact where Name = 'Test Contact'];
        
        newCase.ContactId = cnct.Id;
        update newCase;
        
        newCase = [Select Id,Status from Case where Subject = 'Asset Class Preference'];
        System.assertEquals('Closed', newCase.Status);
    }
    
    @isTest
    public static void testSendEmailtoApprovers()
    {        
        List<Case> cs = new List<Case>();
        Id accountRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        Id caseRecordTypeId = Schema.getGlobalDescribe().get('Case').getDescribe().getRecordTypeInfosByDeveloperName().get('Create_Contacts').getRecordTypeId();
        Metro_Area__c metro = new Metro_Area__c(name='Test MetroArea');
        insert metro;
        
        Account acc = new Account();
        acc.Name = 'Test Account';
        acc.RecordTypeId = accountRecordTypeId;
        insert acc;
        
        Case testCase =new Case(Status= 'New', RecordTypeId = caseRecordTypeId, First_Name__c = 'test', Contact_Last_Name__c = 'A9102021', Biography__c = 'Test Description', Mailing_Street__c = 'Test Street', Mailing_City__c = 'Test City', Mailing_State__c = 'Test State', 
                                Mailing_Zip_Postal_Code__c = '450000',  Mailing_Country__c = 'Test Country', Asset_Class_Coverage__c = 'Real Estate', Contact_Type__c = 'CEO', Title__c = 'Test Title', AccountId = acc.Id, Metro_Area__c =metro.Id, Phone__c = '11111111', Email__c = 'example999@email.net');
        
        cs.add(testCase);
        insert cs;
        
        Test.startTest();
        TriggerOnCaseService.sendEmailtoApprovers(cs);
        Integer invocations = Limits.getEmailInvocations();
        Test.stopTest();
        
        System.assertEquals(1,invocations,'sendEmailtoApprovers method is not working properly');
    }
}