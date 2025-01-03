public with sharing class CppAndDcPlanRelatedtoAccountController {
    
    /**
     * return Type of Account (Corporate Pension Plan OR DC Plan) 
     */
    @AuraEnabled
    public static Account getAccountType(String recordId)
    {
        
        return [SELECT Type FROM Account WHERE Id = :recordId];
        
    }
    
    /**
     * gets Account Id and type and returns all related Child Accounts with type 'DC Plan' || 'Corporate Pension Plan' respectively. 
     */
    @AuraEnabled
    public static List<Account> getCppAndDcPlanAccounts(String recordId, String sortBy, String sortOrder, String nullOrder)
    {
        String accsQuery ='SELECT Id, Name,toLabel(Type),Metro_Area_Name__c,MetroArea__c,AUM__c FROM Account WHERE Retirement_Plan__c = :recordId AND (Type = \'DC Plan\' OR Type =\'Corporate Pension Plan\')' + ' ORDER BY '+sortBy+' '+sortOrder+ ' NULLS ' + nullOrder + ' LIMIT 10';
        List<Account> returnedRecords = database.query(accsQuery);
        if(returnedRecords.size() > 0)
            return returnedRecords;
        else
            return new List<Account>();
    }

    /**
     * gets Account Id and type and returns count of related Child Accounts based on type. 
     */
    @AuraEnabled
    public static Integer getCppAndDcPlanAccountsCount(String recordId)
    {
        return [SELECT count() FROM Account WHERE Retirement_Plan__c = :recordId AND (Type = 'DC Plan' OR Type = 'Corporate Pension Plan' )];
    }
}