@isTest 
public class SearchesRelatedToAccountController_Test {
    @isTest
    public static void testGetAccountName()
    {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To Search';
        insert accountRecord;
        Account returedAccount = SearchesRelatedToAccountController.getAccountName(accountRecord.Id);
        system.assertEquals(returedAccount.Name,'Test Account Linked To Search');       
    }
    @isTest 
    public static void testSearchesRelatedToAccountControllerMethods()
    {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To Search';
        accountRecord.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        insert accountRecord;

        Marketplace_Searches__c[] searcheRecords = new List<Marketplace_Searches__c>();
        for(Integer i=0; i< 10; i++) {
            if(i <= 5){
                Marketplace_Searches__c msObj = new Marketplace_Searches__c(
                                            Name = 'Test Search - ' + i, 
                                            Account__c = accountRecord.Id,
                                            Amount__c = i,
                                            Search_Status__c = 'Open'
                                        );
                searcheRecords.add(msObj);
            } else {
                Marketplace_Searches__c msObj = new Marketplace_Searches__c(
                                            Name = 'Test Search - ' + i, 
                                            Consultant__c = accountRecord.Id,
                                            Amount__c = i,
                                            Search_Status__c = 'Open'
                                        );
                searcheRecords.add(msObj);
            }
        }
        insert searcheRecords;

        system.assertEquals(SearchesRelatedToAccountController.getAccountRelatedSearchesCount(accountRecord.Id),10);
        system.assert(SearchesRelatedToAccountController.getAccountRelatedSearchesRecords(accountRecord.Id, 'Name', 'asc',  'FIRST') != null);
        system.assert(SearchesRelatedToAccountController.getAllAccountRelatedSearchesRecords(accountRecord.Id, 5, 0) != null);
        system.assert(SearchesRelatedToAccountController.getAllRelatedSortedSearchesRecords(accountRecord.Id, 5, 0, 'Name', 'asc') != null);
    }
}