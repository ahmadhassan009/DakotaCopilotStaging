public with sharing class CustomLookupController {
    @AuraEnabled
    public static List<Account> fetchAccounts(String searchKey)
    {
        List<Account> accsList = [SELECT Id, Name FROM Account 
                                      WHERE Name LIKE: '%'+searchKey.trim() +'%' LIMIT 5];
        return accsList;
    }
    @AuraEnabled
    public static List<University_Alumni__c> fetchUniversityRecords(String searchKey)
    {
        List<University_Alumni__c> uniList = [SELECT Id, Name FROM University_Alumni__c 
                                      WHERE Name LIKE: '%'+searchKey.trim() +'%' LIMIT 5];
        return uniList;
    }

}