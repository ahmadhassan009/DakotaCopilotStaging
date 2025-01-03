public with sharing class MultiSelectCustomLookupController {
    @AuraEnabled
    public static List<Contact> fetchContacts(String  searchKey, List<String> selectedRecId)
    {
        List<Contact> connsList = [SELECT Id, Name FROM Contact 
                                      WHERE Name LIKE: '%'+searchKey.trim() +'%'
                                      AND Id NOT IN: selectedRecId  LIMIT 5];
        return connsList;
    }
}