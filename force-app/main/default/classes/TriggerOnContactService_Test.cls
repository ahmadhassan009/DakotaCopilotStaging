@isTest 
public class TriggerOnContactService_Test {
    
    @testSetUp
    public static void createTestData()
    {
        Id investmentAccountRecordType = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        Id investmentContactRecordType = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
        
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Account accA = new Account();
            accA.Name = 'Test Account A';
            accA.RecordTypeId = investmentAccountRecordType;
            insert accA;
            
            Contact con = new Contact();
            con.LastName = 'Test Contact';
            con.AccountId = accA.Id;
            con.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
            con.Marketplace_Verified_Contact__c = true;
            con.Title = 'Test Title';
            insert con;
            
            Contact unverifiedCon = new Contact();
            unverifiedCon.LastName = 'Test Contact 2';
            unverifiedCon.AccountId = accA.Id;
            unverifiedCon.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
            unverifiedCon.Marketplace_Verified_Contact__c = false;
            unverifiedCon.Title = 'Test Title';
            unverifiedCon.Email = 'test@gmail.com';
            insert unverifiedCon;
            
            Test.startTest();
            Account accB = new Account();
            accB.Name = 'Test Account B';
            accB.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
            insert accB;
            
            //DSC-765 Creating Community User with New Account and Contact
            Account accC = new Account();
            accC.Name = 'Test Account C';
            accC.RecordTypeId = investmentAccountRecordType;
            insert accC;
            
            Contact conC = new Contact();
            conC.LastName = 'Test Contact C';
            conC.AccountId = accC.Id;
            conC.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
            conC.Marketplace_Verified_Contact__c = true;
            conC.Title = 'Test Title';
            insert conC;
            
            User communityUser = TestDataFactory.createCommunityUser(conC.Id);
            communityUser.IsPortalEnabled = true;
            update communityUser;
            
            Account accD = new Account();
            accD.Name = 'Test Account D';
            accD.RecordTypeId = investmentAccountRecordType;
            insert accD;
            Test.stopTest();
            
            Follow__c fav = new Follow__c();
            fav.Object_Name__c = 'Marketplace_Searches__c';
            fav.Target_Id__c = con.Id;
            insert fav;
        }
    }
    
    @isTest 
    public static void testUpdateCountryField()
    {
        Test.startTest();
        Contact con = [Select Id,MailingAddress,MailingCountry, AccountId from Contact where Name='Test Contact' Limit 1];
        con.MailingCountry = 'U.S.';
        update con;
        Contact updatedCon = [Select Id,MailingAddress,MailingCountry, AccountId from Contact where Name='Test Contact' Limit 1];
        System.assert(updatedCon.MailingCountry == 'USA');
        Test.stopTest();
    }
    
    @isTest 
    public static void testPopulateParentFeed()
    {
        Test.startTest();
        Contact con = [Select Id, AccountId from Contact where Name='Test Contact' Limit 1];
        Account accB = [Select Id from Account where Name='Test Account A' Limit 1];
        con.AccountId = accB.Id;
        update con;
        
        delete con;
        Test.stopTest();
    }
    
    @isTest 
    public static void testContactTitleChange()
    {
        Test.startTest();
        Contact con = [Select Id,Title from Contact where Name='Test Contact' Limit 1];
        con.Title = 'Test Title';
        update con;
        
        List<Update__c> updates = [Select Id,Name,New_Title__c from Update__c where Contact__c = :con.Id and New_Title__c = 'Test Title'];
        System.assert(updates.size() > 0);
        Test.stopTest();
    }
    
    @isTest
    public static void testPopulateNumberOfContactsOnMetroArea()
    {
        Test.startTest();
        Metro_Area__c metro = new Metro_Area__c(name='Test MetroArea 2');
        insert metro;
        
        Contact contact = [Select Id, Name, Metro_Area__c, Marketplace_Verified_Contact__c from Contact where Name = 'Test Contact'];
        contact.Metro_Area__c = metro.Id;
        contact.Marketplace_Verified_Contact__c = true; 
        update contact;
        
        metro = [Select Id, Name, Number_of_Contacts__c from Metro_Area__c where Name = 'Test MetroArea 2'];
        System.assertEquals(1, metro.Number_of_Contacts__c);
        
        Id marketplaceContactRecordType = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_360_Contact').getRecordTypeId();
        Id marketplaceAccountRecordType = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
        
        Account acct = [Select Id,Name from Account where Name = 'Test Account B' Limit 1];
        
        
        contact = [Select Id, Name, Marketplace_Verified_Contact__c,RecordTypeId from Contact where Name = 'Test Contact'];
        contact.Marketplace_Verified_Contact__c = false;
        contact.RecordTypeId = marketplaceContactRecordType;
        contact.AccountId = acct.Id;
        update contact;
        
        metro = [Select Id, Name, Number_of_Everest_Contacts__c,Number_of_Contacts__c from Metro_Area__c where Name = 'Test MetroArea 2'];
        System.assertEquals(1, metro.Number_of_Everest_Contacts__c);
        System.assertEquals(0, metro.Number_of_Contacts__c);
        
        delete contact;
        metro = [Select Id, Name,Number_of_Everest_Contacts__c from Metro_Area__c where Name = 'Test MetroArea 2'];
        System.assertEquals(0, metro.Number_of_Everest_Contacts__c);
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdateOrganizationIdOnAccountUpdate()
    {
        Contact con = [Select Id, AccountId from Contact where LastName='Test Contact C' Limit 1];
        Id contactId = con.Id;
        Account acc = [Select Id,Name from Account where Name = 'Test Account D' Limit 1];
        con.AccountId = acc.Id;
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        { 
            Test.startTest();
            update con;
            Test.stopTest();
        }
        User commUser = [SELECT Organization_Id__c FROM User WHERE LastName = 'Testing' and ContactId = :contactId LIMIT 1];
        System.assertEquals(con.AccountId, commUser.Organization_Id__c);
    }
    
    @isTest
    public static void testSendNotificationOnMPVerification()
    {
        Test.startTest();
        Contact con = [Select Id,MailingCountry from Contact where Name='Test Contact 2' Limit 1];
        con.MailingCountry = 'sweden';
        update con;
        
        List <Task> gdprTasks = [Select Id,Subject from task where WhoId = :con.Id and Subject = 'Article 14 GDPR Notice'];
        System.assert(gdprTasks.size() == 0);
        
        con = [Select Id,Marketplace_Verified_Contact__c from Contact where Name='Test Contact 2' Limit 1];
        con.Marketplace_Verified_Contact__c = true;
        update con;
        
        gdprTasks = [Select Id,Subject from task where WhoId = :con.Id and Subject = 'Article 14 GDPR Notice'];
        System.assert(gdprTasks.size() > 0);
        Test.stopTest();
    }
    
    @isTest
    public static void testGDRPRemovalRequest()
    {
        Test.startTest();
        Contact con = [Select Id,Requested_Removal_per_GDPR__c from Contact where Name='Test Contact 2' Limit 1];
        con.Requested_Removal_per_GDPR__c = true;
        Database.SaveResult [] updateResult = Database.update(new List<Contact>{con}, false);
        for (Database.SaveResult r : updateResult)
        {
            System.assert(r.isSuccess());
        }
        
        User usr = [Select Id,UserRoleId from User where Profile.Name != 'System Administrator' and IsActive = true and UserType = 'Standard' Limit 1];
        System.RunAs(usr) 
        {
            con = [Select Id,Requested_Removal_per_GDPR__c from Contact where Name='Test Contact 2' Limit 1];
            con.Requested_Removal_per_GDPR__c = false;
            updateResult = Database.update(new List<Contact>{con}, false);
            for (Database.SaveResult r : updateResult)
            {
                System.assert(!r.isSuccess());
            }
        }
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdatePardotDomainInvestmentFirm()
    {
        Test.startTest();
        Account acc = [Select Id,RecordTypeId from Account where Name='Test Account A' Limit 1];
        Contact con = [Select Id,Pardot_Domain__c,RecordTypeId from Contact where Name='Test Contact' Limit 1];       
        System.assertEquals(con.Pardot_Domain__c,'Investment Sales');
        
        acc.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
        update acc;
        
        con.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_360_Contact').getRecordTypeId();
        update con;
        
        con = [Select Id,Pardot_Domain__c,RecordTypeId from Contact where Name='Test Contact' Limit 1]; 
        System.assertEquals(con.Pardot_Domain__c,null);
        Test.stopTest();
    }
    
    @isTest
    public static void testUpdatePardotDomainInvestmentAllocator()
    {
        Test.startTest();
        Account acc = [Select Id,RecordTypeId from Account where Name='Test Account A' Limit 1];
        Contact con = [Select Id,Pardot_Domain__c,RecordTypeId from Contact where Name='Test Contact' Limit 1];  
        acc.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        update acc;
        
        con.RecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
        update con;
        
        con = [Select Id,Pardot_Domain__c,RecordTypeId from Contact where Name='Test Contact' Limit 1]; 
        System.assertEquals(con.Pardot_Domain__c,'Investment Sales');
        Test.stopTest();        
    }
    
    @isTest
    public static void testSendNotificationOnJobChange()
    {
        
        Contact con = [Select Id from Contact where Name='Test Contact' Limit 1];
        Account accD = [Select Id from Account where Name='Test Account D' Limit 1];
        con.AccountId = accD.Id;
        test.startTest();
        update con;
        test.stopTest();
        
    }
    
    @isTest
    public static void testSetCPRATrackingField()
    {
        Contact con = [Select Id,MailingState from Contact where Name='Test Contact' Limit 1];
        con.MailingState = 'CA';
        con.Email = 'test@gmail.com';
        update con;
        
        con = [Select Id,California_Privacy_Regulation_Tracker__c from Contact where Name='Test Contact' Limit 1];
        System.debug(con.California_Privacy_Regulation_Tracker__c);
        System.assert(con.California_Privacy_Regulation_Tracker__c.contains('Email'));
    }
}