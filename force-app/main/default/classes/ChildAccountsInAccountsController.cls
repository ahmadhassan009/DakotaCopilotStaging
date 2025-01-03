public with sharing class ChildAccountsInAccountsController {
    /**
     * gets Account Id and relationship type and returns all related Child Accounts OR TAMP Accounts respectively. 
     */
    @AuraEnabled
    public static List<Account> getAccounts(String recordId, String listType, String sortBy, String sortOrder, String nullOrder)
    {
        if(listType == 'TAMP')
        {
            String accsQuery = 'SELECT Id, Name,toLabel(Type),Metro_Area_Name__c,MetroArea__c,AUM__c,Website FROM Account WHERE TAMP__c = :recordId  ORDER BY '+sortBy+' '+sortOrder+ ' NULLS ' + nullOrder + ' LIMIT 10 OFFSET 0';
            List<Account> returnedRecords =  database.query(accsQuery);
            return returnedRecords;
        }
        else 
        {
            String accsQuery ='SELECT Id, Name,toLabel(Type),Metro_Area_Name__c,MetroArea__c,AUM__c,Website FROM Account WHERE Parent_Account__c = :recordId ORDER BY '+sortBy+' '+sortOrder+ ' NULLS ' + nullOrder + ' LIMIT 10 OFFSET 0';
            List<Account> returnedRecords = database.query(accsQuery);
            return returnedRecords;
        }
    }

    /**
     * gets Account Id and relationship type and returns count of related Child Accounts OR TAMP Accounts respectively. 
     */
    @AuraEnabled
    public static Integer getAccountsCount(String recordId, String listType)
    {
        if(listType == 'TAMP')
        {
            return [SELECT count() FROM Account WHERE TAMP__c = :recordId];
        }
        else {
            return [SELECT count() FROM Account WHERE Parent_Account__c = :recordId];
        }
    }

    @AuraEnabled
    public static Integer getFaTeamsAccountsCount(String recordId)
    {
            return [SELECT count() FROM Contact WHERE AccountId = :recordId AND Contact_Type__c = 'Financial Advisor' ];
    }

    @AuraEnabled
    public static List<Contact> getFaTeamsAccounts(String recordId, String sortBy, String sortOrder, String nullOrder)
    {
        try{
            String query = 'SELECT Id,Name, AccountId,Account.Name, Title, Asset_Class_Coverage__c,Metro_Area__c,Metro_Area__r.Name, Contact_Type__c, Email, Channel_Focus__c ' + 
            'FROM Contact ' +
            'WHERE AccountId = :recordId AND Contact_Type__c = \'Financial Advisor\' ORDER BY ' + sortBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10 ' + ' OFFSET 0'  ;
            return Database.query(query);
        }
        catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Contact> getFaTeamsAllAccounts(String recordId, String sortBy, String sortOrder, String nullOrder,String recordLimit, String offset)
    {
        try{
            String query = 'SELECT Id,Name, AccountId,Account.Name, Title, Asset_Class_Coverage__c,Metro_Area__c,Metro_Area__r.Name, Contact_Type__c, Email, Channel_Focus__c ' + 
            'FROM Contact ' +
            'WHERE AccountId = :recordId AND Contact_Type__c = \'Financial Advisor\' ORDER BY ' + sortBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;
            return Database.query(query);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Account> getFaTeamsAllChildAccounts(String recordId, String sortBy, String sortOrder, String nullOrder,String recordLimit, String offset)
    {
        try{
            String query = 'SELECT Id, Name,toLabel(Type),Metro_Area_Name__c,MetroArea__c,AUM__c,Website' + 
            ' FROM Account WHERE Parent_Account__c = :recordId ORDER BY ' + sortBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;
            return Database.query(query);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}