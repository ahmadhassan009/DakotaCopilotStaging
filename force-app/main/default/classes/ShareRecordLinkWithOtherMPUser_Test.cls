@isTest 
public class ShareRecordLinkWithOtherMPUser_Test {
    @testSetup 
    public static void setupData() {
        Account portalAccount1 = new Account(
            Name = 'Test Account'
        );
        
        insert portalAccount1;
        
        Account acc = TestDataFactory.createAccount();
        
        //Create contact
        Contact contact1 = new Contact(
            FirstName = 'Test',
            Lastname = 'Community User',
            AccountId = portalAccount1.Id
        );
        
        insert contact1;
        
        //Create contact
        Contact contact = new Contact(
            FirstName = 'Test',
            Lastname = 'Community User',
            AccountId = portalAccount1.Id
        );
        
        insert contact;  
        TestDataFactory.createDakotaNewsRecords();
        TestDataFactory.createInvestmentRecord(portalAccount1.Id);

        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where isActive = true and UserRoleId= :portalRole.Id Limit 1];
        System.RunAs(usr) {
             User communityUser = TestDataFactory.createCommunityUser(contact1.Id);
        }
    }
    
    @isTest
    public static void testShareRecordWithOtherMPUsers() {
        Test.startTest();
        Account acc = [Select Id from Account where Name = 'Test Acc' Limit 1];
        List<User> u = [SELECT Id, Firstname, Lastname, Email FROM User WHERE Name Like '%Community User%' OR Name Like '%Testing%'];
        System.assertEquals(ShareRecordLinkWithOtherMPUserController.shareRecordWithOtherMPUsers(acc.id, u), true);
        Contact c = [Select Id from Contact where Name like '%Community User%' Limit 1];
        System.assertEquals(ShareRecordLinkWithOtherMPUserController.shareRecordWithOtherMPUsers(c.id, u),true);
        List<Dakota_News__c> returnedResultt = DakotaNewsController.getRecords('test','Publish_Date__c','desc');
        System.assertEquals(ShareRecordLinkWithOtherMPUserController.shareRecordWithOtherMPUsers(returnedResultt[0].id, u),true);
        List<Investment__c> testInvestments = new List<Investment__c>{[SELECT Id, Heroku_Synced__c FROM Investment__c Limit 1]};
        System.assertEquals(ShareRecordLinkWithOtherMPUserController.shareRecordWithOtherMPUsers(testInvestments[0].id, u),true);
        Test.stopTest();
    }
    
    @isTest
    public static void testGetShareRecords()
    {
        Test.startTest();
        List<User> u = [SELECT Id, Firstname, Lastname, Email FROM User WHERE Name Like '%Community User%' OR Name Like '%Testing%'];
        List<Follow__c> returnedResult = ShareRecordLinkWithOtherMPUserController.getShareRecords(u[0].Id, 'Name', 'desc','LAST');
        System.assertNotEquals(returnedResult.size(), 1);
        Test.stopTest();
    }

    @isTest
    public static void testGetShareRecordsViewAll()
    {
        Test.startTest();
        List<User> u = [SELECT Id, Firstname, Lastname, Email FROM User WHERE Name Like '%Community User%' OR Name Like '%Testing%'];
        List<Follow__c> returnedResult = ShareRecordLinkWithOtherMPUserController.getShareRecordsViewAll(u[0].Id, 'Name', 'desc',50,0,'LAST');
        System.assertNotEquals(returnedResult.size(), 1);
        Test.stopTest();
    }

    @isTest
    public static void testGetShareRecordCount()
    {
        Test.startTest();
        List<User> u = [SELECT Id, Firstname, Lastname, Email FROM User WHERE Name Like '%Community User%' OR Name Like '%Testing%'];
        Integer count = ShareRecordLinkWithOtherMPUserController.getShareRecordCount(u[0].Id);
        System.assertNotEquals(count, 1);
        Test.stopTest();
    }

    @isTest
    public static void testGetAllMPUsers() {
        Test.startTest();
        System.assertNotEquals(ShareRecordLinkWithOtherMPUserController.getAllMPUsers().size(), null);
        Test.stopTest();
    }
    
    @isTest
    static void testIsVowel() {
        Test.startTest();
        // Test cases for vowels
        System.assert(ShareRecordLinkWithOtherMPUserController.isVowel('apple'));
        System.assert(ShareRecordLinkWithOtherMPUserController.isVowel('Eagle'));
        System.assert(ShareRecordLinkWithOtherMPUserController.isVowel('iGloo'));
        System.assert(ShareRecordLinkWithOtherMPUserController.isVowel('Orange'));
        System.assert(ShareRecordLinkWithOtherMPUserController.isVowel('umbrella'));

        // Test cases for non-vowels
        System.assert(!ShareRecordLinkWithOtherMPUserController.isVowel('banana'));
        System.assert(!ShareRecordLinkWithOtherMPUserController.isVowel('123'));
        System.assert(!ShareRecordLinkWithOtherMPUserController.isVowel('XYZ'));
        System.assert(!ShareRecordLinkWithOtherMPUserController.isVowel(''));
        Test.stopTest();

    }
}