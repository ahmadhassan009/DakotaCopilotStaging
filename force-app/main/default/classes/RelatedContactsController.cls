public with sharing class RelatedContactsController {
    @AuraEnabled(cacheable=true)
    public static List<Metro_Area__c> getMetroAreaName(Id recordId) {
        return [
            SELECT Name
            FROM Metro_Area__c
            WHERE Id =: recordId
            ORDER BY Name
        ];
    }
    
    @AuraEnabled
    public static List<SObject> getRelatedContactsToMetroArea (Id recordId, Boolean homeOffice) {
        String query = '';
        query = 'SELECT Id,MailingLatitude,MailingLongitude,Name,Metro_Area__c, AccountId,Account.Name,Account.Type, Account.MetroArea__r.Name, Email, Title, Contact_Type__c  FROM Contact WHERE Metro_Area__c = :recordId';
        if(homeOffice) {
            query  += ' AND Account.MetroArea__c = :recordId ';
        } else {
            query  += ' AND Account.MetroArea__c != :recordId ';
        }
        query += ' ORDER BY LastName desc LIMIT 10 OFFSET 0';
        
        List<SObject> contactListToReturn = Database.query(query);
        return contactListToReturn;
    }
    
    
    @AuraEnabled
    public static Integer getRelatedContactCount(Id recordId, Boolean homeOffice) {
        String countContactQuery = '';
        countContactQuery = 'SELECT Id  FROM Contact WHERE Metro_Area__c = :recordId';
        if(homeOffice) {
            countContactQuery  += ' AND Account.MetroArea__c = :recordId ';
        } else {
            countContactQuery  += ' AND Account.MetroArea__c != :recordId ';
        }
        List<Contact> contactCount = Database.query(countContactQuery);
        return contactCount.size();
    }
    
    @AuraEnabled
    public static Integer fetchFilterRecordCount(Id recordId, Boolean homeOffice, List<String> accountTypes, List<String> contactTypes, List<String> assetClassCoverage) {
        try {
            String countContactQuery = '';
            countContactQuery = 'SELECT Id  FROM Contact WHERE Metro_Area__c = :recordId';
            if (homeOffice) {
                countContactQuery  += ' AND Account.MetroArea__c = :recordId ';
            } else {
                countContactQuery  += ' AND Account.MetroArea__c != :recordId ';
            }
            if (accountTypes?.size() > 0) {
                countContactQuery  += ' AND  Account.Type IN :accountTypes ';
            }
            if (contactTypes?.size() > 0) {
                countContactQuery  += ' AND Contact_Type__c IN :contactTypes ';
            }
            if (assetClassCoverage?.size() > 0) {
                countContactQuery  += ' AND Asset_Class_Coverage__c IN :assetClassCoverage ';
            }
            List<Contact> contactCount = Database.query(countContactQuery);
            return contactCount.size();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Contact> getAllRelatedContactsToMetroArea (Id recordId, Boolean homeOffice, Integer recordLimit, Integer offset) {
        String allContactQuery = ''; 
        allContactQuery = 'SELECT Id, MailingLatitude, MailingLongitude,Name,Metro_Area__c, AccountId,Account.BillingLongitude,Account.BillingLatitude,Account.Name,Account.Type, Account.MetroArea__c,Account.MetroArea__r.Name, Email, Title, Contact_Type__c  FROM Contact WHERE Metro_Area__c = :recordId';
        if(homeOffice) {
            allContactQuery  += ' AND Account.MetroArea__c = :recordId ';
        } else {
            allContactQuery  += ' AND Account.MetroArea__c != :recordId ';
        }
        allContactQuery += ' ORDER BY LastName desc LIMIT ' + recordLimit + ' OFFSET ' + offset;
        List<Contact> contactListToReturn = Database.query(allContactQuery);
        return contactListToReturn;
    }
    
    @AuraEnabled
    public static List<Contact> getAllRelatedSortedContactsToMetroArea (Id recordId, Boolean homeOffice, Integer recordLimit, Integer offset,String sortBy, String sortOrder, List<String> accountTypes, List<String> contactTypes, List<String> assetClassCoverage) {
        try {
            String allContactQuery = '';
            if(sortBy=='MetroAreaName')
            {
                sortBy='Account.MetroArea__r.Name';
            }
            allContactQuery = 'SELECT Id, Name,Metro_Area__c, AccountId,Account.BillingLongitude,Account.BillingLatitude,Account.Name,Account.Type, Account.MetroArea__r.Name, Email, Title, Contact_Type__c  FROM Contact WHERE Metro_Area__c = :recordId';
            if(homeOffice) {
                allContactQuery  += ' AND Account.MetroArea__c = :recordId ';
            } else {
                allContactQuery  += ' AND Account.MetroArea__c != :recordId ';
            }
            if (accountTypes?.size() > 0) {
                allContactQuery  += ' AND Account.Type IN :accountTypes ';
            }
            if (contactTypes?.size() > 0) {
                allContactQuery  += ' AND Contact_Type__c IN :contactTypes ';
            }
            if (assetClassCoverage?.size() > 0) {
                allContactQuery  += ' AND Asset_Class_Coverage__c IN :assetClassCoverage ';
            }
            allContactQuery += 'Order BY '+sortBy+' '+sortOrder+' NULLS LAST LIMIT :recordLimit offset '+offset;
            List<Contact> contactListToReturn = Database.query(allContactQuery);
            return contactListToReturn;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}