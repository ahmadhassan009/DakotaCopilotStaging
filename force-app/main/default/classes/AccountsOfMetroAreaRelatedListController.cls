public class AccountsOfMetroAreaRelatedListController {
    
    public static Set<Id> getAccIDsRelatedToSubMetroAreas (Id recordId)
    {
        Set<Id> accIDsRelatedToSubMetroAreas = new Set<Id>();
        for(Sub_Metro_Area__c sub : [Select id,Account__c from Sub_Metro_Area__c where Metro_Area__c =: recordId])
        {
            accIDsRelatedToSubMetroAreas.add(sub.Account__c);
        }
        return accIDsRelatedToSubMetroAreas;
    }
    
    @AuraEnabled
    public static List<Account> getRelatedAccountRecords(Id recordId)
    {       
        Set<Id> accIDsRelatedToSubMetroAreas =  getAccIDsRelatedToSubMetroAreas (recordId);
        return [SELECT Id, Name, Type, AUM__c, Website, BillingCity, Description
                FROM Account
                WHERE MetroArea__c = :recordId OR Id IN : accIDsRelatedToSubMetroAreas
                ORDER BY AUM__c DESC NULLS LAST
                LIMIT 10 OFFSET 0];       
    }
    
    @AuraEnabled
    public static Integer getRelatedAccountCount(Id recordId) {
        Set<Id> accIDsRelatedToSubMetroAreas =  getAccIDsRelatedToSubMetroAreas (recordId);
        return [
            SELECT COUNT()
            FROM Account
            WHERE MetroArea__c =: recordId OR Id IN : accIDsRelatedToSubMetroAreas
        ];       
    }
    
    @AuraEnabled(cacheable=true)
    public static String getMetroAreaName(String  recordId)
    {
        return [SELECT Id, Name FROM Metro_Area__c where Id =: recordId].Name ;
    }
    
    @AuraEnabled
    public static Metro_Area__c getMetroAreaNameObj(Id recordId) {
        return [
            SELECT Name
            FROM Metro_Area__c
            WHERE Id =: recordId
            ORDER BY Name
        ];
    }
    
    @AuraEnabled
    public static List<Account> getAllRelatedAccountRecords(Id recordId, Integer recordLimit, Integer offset)
    {       
        Set<Id> accIDsRelatedToSubMetroAreas =  getAccIDsRelatedToSubMetroAreas (recordId);
        return [SELECT Id, Name, Type, AUM__c, Website, BillingCity, Description
            FROM Account
            WHERE MetroArea__c = :recordId OR Id IN : accIDsRelatedToSubMetroAreas
            ORDER BY AUM__c DESC NULLS LAST
            LIMIT :recordLimit OFFSET :offset];    
    }
    
    @AuraEnabled (cacheable=true)
    public static List<Account> getAllRelatedSortedAccountsRecords (Id recordId, Integer recordLimit, Integer offset, String sortBy, String sortOrder) {
        Set<Id> accIDsRelatedToSubMetroAreas =  getAccIDsRelatedToSubMetroAreas (recordId);
        String allSearchesQuery = 'SELECT Id, Name, Type, AUM__c, Website, BillingCity, Description';
        allSearchesQuery += ' FROM Account WHERE MetroArea__c = :recordId OR Id IN : accIDsRelatedToSubMetroAreas';
        allSearchesQuery += ' ORDER BY '+sortBy+' '+sortOrder+' NULLS LAST LIMIT :recordLimit offset '+offset;
        List<Account> SearchesListToReturn = Database.query(allSearchesQuery);
        return SearchesListToReturn;
    }
}