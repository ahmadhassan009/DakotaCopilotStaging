public with sharing class AccountPrintableViewController 
{
    @AuraEnabled
    public static List<Contact> getRelatedContactRecords(Id recordId)
    {
        return [SELECT Id, Name,Title, Asset_Class_Coverage__c, Email
                FROM Contact
                WHERE AccountId = :recordId
                ORDER BY Name Limit 50000];
    }
    
    @AuraEnabled
    public static Account getAccountRecordDetails(Id recordId)
    {
        return [SELECT Name,Website, Type, Phone, AUM__c, CRD__c,Number_of_QPs__c,
                MetroArea__r.Name, BillingAddress, Description,
                Platform_Description__c,Alternative_Platform_Description__c
                FROM Account
                WHERE Id = :recordId Limit 1];
    }
}