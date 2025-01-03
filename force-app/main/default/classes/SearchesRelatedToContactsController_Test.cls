@isTest
public class SearchesRelatedToContactsController_Test {

    @testSetUp
    public static void createTestData() {
        Account acc = TestDataFactory.createAccount();
        Marketplace_Searches__c searchRec = TestDataFactory.createSearchRecord();
    }

    @isTest
    public static void testGetContactRelatedSearchesCount() {
        Contact con = [SELECT Id, Name FROM Contact WHERE Lastname = 'Community User' LIMIT 1];
        System.assertEquals(1, SearchesRelatedToContactsController.getContactRelatedSearchesCount(con.Id));
    }

    @isTest
    public static void testGetContactRelatedSearchesRecords() {
        Contact con = [SELECT Id, Name FROM Contact WHERE Lastname = 'Community User' LIMIT 1];
        List<Marketplace_Searches__c> searchList = SearchesRelatedToContactsController.getContactRelatedSearchesRecords(con.Id, 'Name', 'ASC', 'FIRST');
        System.assert(searchList.size() > 0);
    }
}