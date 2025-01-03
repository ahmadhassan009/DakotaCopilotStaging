public class ClientsRelatedToAccountsController {
     /**
     * gets Account Id and returns related General Consultant, General Consultant 2, Hedge Fund Consultant, Private Equity Consultant, Private Credit Consultant, 
     * and Real Estate Consultant. 
     */
    @AuraEnabled
    public static List<Account> getClientAccounts(Id recordId, String sortedBy, String sortOrder, String nullOrder)
    {
        String clientAccountsQuery = 'SELECT Id, Name,Type,AUM__c,MetroArea__c,DC_Consultant__c,General_Consultant__c,General_Consultant_2__c, Hedge_Fund_Consultant__c,Private_Equity_Consultant__c,Private_Credit_Consultant__c,Real_Estate_Consultant__c,MetroArea__r.Name ';
        clientAccountsQuery += 'FROM Account WHERE General_Consultant__c = :recordId OR General_Consultant_2__c = :recordId ';
        clientAccountsQuery += 'OR Hedge_Fund_Consultant__c = :recordId OR Private_Equity_Consultant__c = :recordId ';
        clientAccountsQuery += 'OR Private_Credit_Consultant__c =: recordId OR Real_Estate_Consultant__c = :recordId ';
        clientAccountsQuery += 'OR DC_Consultant__c =: recordId ';
        clientAccountsQuery += 'ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        List<Account> returnedRecords = Database.query(clientAccountsQuery); 
        return returnedRecords;
    }

    /**
     * gets Account Id and returns count of related General Consultant, General Consultant 2, Hedge Fund Consultant, Private Equity Consultant, Private Credit Consultant, 
     * and Real Estate Consultant. 
     */
    @AuraEnabled
    public static Integer getCountOfAllClientAccounts(Id recordId)
    {
        Integer totalRecords = 0;
        totalRecords += [SELECT COUNT() FROM Account WHERE General_Consultant__c = :recordId];
        totalRecords += [SELECT COUNT() FROM Account WHERE General_Consultant_2__c = :recordId];
        totalRecords += [SELECT COUNT() FROM Account WHERE Hedge_Fund_Consultant__c = :recordId];
        totalRecords += [SELECT COUNT() FROM Account WHERE Private_Equity_Consultant__c = :recordId];
        totalRecords += [SELECT COUNT() FROM Account WHERE Private_Credit_Consultant__c = :recordId];
        totalRecords += [SELECT COUNT() FROM Account WHERE Real_Estate_Consultant__c = :recordId];
        totalRecords += [SELECT COUNT() FROM Account WHERE DC_Consultant__c = :recordId];
        return totalRecords;
    }

    /**
     * gets Account Id and returns Account Name.
     */
    @AuraEnabled(cacheable=true)
    public static String getAccountName(String  recordId)
    {
        return [SELECT Id, Name FROM Account where Id =: recordId].Name ;
    }

    /**
     * gets Account Id and returns all related General Consultant, General Consultant 2, Hedge Fund Consultant, Private Equity Consultant, Private Credit Consultant, 
     * and Real Estate Consultant. 
     */
    @AuraEnabled
    public static List<Account> getAllClientAccounts(String recordId)
    {
        return [SELECT Id, Name,Type,AUM__c,MetroArea__c,DC_Consultant__c,General_Consultant__c,General_Consultant_2__c,
                Hedge_Fund_Consultant__c,Private_Equity_Consultant__c,Private_Credit_Consultant__c,Real_Estate_Consultant__c,MetroArea__r.Name
                FROM Account
                WHERE General_Consultant__c = :recordId OR General_Consultant_2__c = :recordId
                OR Hedge_Fund_Consultant__c = :recordId OR Private_Equity_Consultant__c = :recordId
                OR Private_Credit_Consultant__c =: recordId OR Real_Estate_Consultant__c = :recordId
                OR DC_Consultant__c =: recordId
                ORDER BY AUM__c desc NULLS LAST];
    }
}