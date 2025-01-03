@isTest
public with sharing class RecordsFavoriteController_Test {
    @TestSetup
    public static void createTestData()
    {
        Account acc = New Account(
            Name = 'Test Acc'
        );
        insert acc;
        
        Account acc2 = New Account(Name = 'Test Acc 2');
        insert acc2;

        Account acc3 = New Account(Name = 'Test Acc 3');
        insert acc3;

        University_Alumni__c uniAlumni = new University_Alumni__c(
            Name = 'Test Acc 76'
        );
        insert uniAlumni;

        Contact contact = new Contact(
            FirstName = 'Test',
            Lastname = 'Community User'
        );
        insert contact;
        
        Follow__c followRec = new Follow__c(Target_Id__c = acc.Id,Object_Name__c='Account');
        insert followRec;
        Follow__c followRec2 = new Follow__c(Target_Id__c = acc3.Id,Object_Name__c='Account');
        insert followRec2;
        
        
    }
    
     @isTest 
    static void testSavePreferences() {
        Test.startTest();
        System.assert(RecordsFavoriteController.savePreferences('Job Changes','RIA','Private Credit', true));
        Test.stopTest();
    }
    
    @isTest 
    static void testGetPreferences() {
        Email_Notification_Preferences__c pref = new Email_Notification_Preferences__c();
        pref.Contact_Updates_Selection__c = 'Job Changes';
        pref.Account_Updates_Selection__c = 'RIA';
        pref.Search_Updates_Selection__c = 'Private Credit';
        pref.Only_Weekly_Updates__c = false;
        insert pref;
        Test.startTest();
        System.assert(RecordsFavoriteController.getPreferences() !=null);
        Test.stopTest();
    }
   @isTest 
    static void testGetAllFavoriteRecords() {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        List<Follow__c> res = RecordsFavoriteController.getAllFavoriteRecords();
        // System.assert(res != null);
        Test.stopTest();
    }

    @isTest
    static void testAddToFavorites() {
        Account acc = [SELECT Id,Name FROM Account WHERE  Name = 'Test Acc 2' LIMIT 1 ];
        Test.startTest();
        Follow__c fav = RecordsFavoriteController.addToFavorites(acc.Id,'Record');
        System.assert(fav != null);
        Follow__c fav2 = RecordsFavoriteController.addToFavorites('Account','ListView');
        System.assert(fav2 != null);
        Follow__c fav3 = RecordsFavoriteController.addToFavorites('Contact','ListView');
        System.assert(fav3 != null);
        Follow__c fav4 = RecordsFavoriteController.addToFavorites('Marketplace_Searches__c','ListView');
        System.assert(fav4 != null);
        Follow__c fav5 = RecordsFavoriteController.addToFavorites('Investment__c','ListView');
        System.assert(fav5 != null);
        Follow__c fav6 = RecordsFavoriteController.addToFavorites('Update__c','ListView');
        System.assert(fav6 != null);  
        Integer count = RecordsFavoriteController.getfollowRecordCount(); 
        System.assert(count > 0);
        Test.stopTest();
    }

    @isTest
    static void testMassAddToFavorites() {

        University_Alumni__c uniAlumni = new University_Alumni__c(
            Name = 'Test Acc 76'
        );
        insert uniAlumni;

        Contact contact = new Contact(
            FirstName = 'Test',
            Lastname = 'Community User'
        );
        insert contact;


        List<Account> accList = [SELECT Id,Name FROM Account WHERE  Name = 'Test Acc 2' LIMIT 1 ];
        List<Contact> conList = [SELECT Id,Name FROM Contact WHERE  Lastname = 'Community User' LIMIT 1 ];
        List<University_Alumni__c> uniAlumniList = [SELECT Id,Name FROM University_Alumni__c WHERE  Name = 'Test Acc 76' LIMIT 1 ];
        List<String> accIds = new List<String>();
        List<String> conIds = new List<String>();
        List<String> uniAlumniIds = new List<String>();
        accIds.add(accList[0].Id);
        conIds.add(conList[0].Id);
        uniAlumniIds.add(uniAlumniList[0].Id);
        Test.startTest();
        List<Follow__c> fav = RecordsFavoriteController.massAddToFavorites(accIds);
        System.assert(fav != null);
        List<Follow__c> fav2 = RecordsFavoriteController.massAddToFavorites(conIds);
        System.assert(fav2 != null);
        List<Follow__c> fav3 = RecordsFavoriteController.massAddToFavorites(uniAlumniIds);
        System.assert(fav3 != null);

        Test.stopTest();
    }

    @isTest 
    static void testGetFavoriteRecordById() {
        Account acc = [SELECT Id,Name FROM Account WHERE  Name = 'Test Acc' LIMIT 1];
        Test.startTest();
        Follow__c followedRecord = RecordsFavoriteController.getFavoriteRecordById(acc.Id);
        System.assertNotEquals(null, followedRecord);
        Test.stopTest();
    }

    @isTest 
    static void testRemoveFromFavorites() {
        Account accId = [SELECT Id,Name FROM Account WHERE  Name = 'Test Acc' LIMIT 1];
        List<Account> acc = [SELECT Id,Name FROM Account WHERE  Name = 'Test Acc 3' LIMIT 1];
        List<String> accIdsList = new List<String>();
        for(Account account:acc)
        {
            accIdsList.add(account.Id);
        }
        Test.startTest();
        boolean isRemoved = RecordsFavoriteController.removeFromFavorites(accId.Id);
        integer isMassRemoved = RecordsFavoriteController.massRemoveFromFavorites(accIdsList);
        System.assertEquals(true, isRemoved);
        System.assertEquals(true, isMassRemoved>0);
        Test.stopTest();
    }

    @isTest 
    static void testCheckRecordType() {
        Id accountRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('General_Business').getRecordTypeId();
        Id contactRecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('General_Business').getRecordTypeId();

        Account acct = [Select Id,RecordTypeId From Account Where Name = 'Test Acc' Limit 1];
        acct.RecordTypeId = accountRecordTypeId;
        update acct;

        Contact cnct = new Contact();
        cnct.LastName = 'Test Cnct';
        cnct.RecordTypeId = contactRecordTypeId;
        insert cnct;

        Test.startTest();
        System.assert(RecordsFavoriteController.checkRecordType('Account',acct.Id));
        System.assert(RecordsFavoriteController.checkRecordType('Contact',cnct.Id));
        System.assert(RecordsFavoriteController.checkRecordType('Account',acct.Id));
        Test.stopTest();
    }
}