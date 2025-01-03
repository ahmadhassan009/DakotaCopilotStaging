public with sharing class InvestmentCommitteeNotesController {
    @AuraEnabled(cacheable=false)
    public static List<Public_Plan_Minute__c> getICNotesList(String sortBy, String sortOrder, Integer recLimit, Integer queryOffset,String searchTerm) 
    {
        if(searchTerm == null || searchTerm == '')
        {
            String query = 'SELECT Id, Name, Meeting_Date__c, Meeting_Minute_URL__c,Account__c, Account__r.Name, Posted_Date__c FROM Public_Plan_Minute__c ORDER BY '+sortBy+ ' '+ sortOrder+' LIMIT '+recLimit+' OFFSET '+queryOffset; 
            if(sortOrder == 'desc')
            {
                query = 'SELECT Id, Name, Meeting_Date__c, Meeting_Minute_URL__c,Account__c, Account__r.Name, Posted_Date__c FROM Public_Plan_Minute__c ORDER BY '+sortBy+ ' '+ sortOrder+' NULLS LAST LIMIT '+recLimit+' OFFSET '+queryOffset; 
            }
            List<Public_Plan_Minute__c> listToReturn = Database.query(query);
            return listToReturn;
        }
        else
        {
            searchTerm = String.escapeSingleQuotes(searchTerm);
            String searchKey = '\'%'+searchTerm+'%\'';
            String query = 'SELECT Id, Name, Meeting_Date__c, Meeting_Minute_URL__c,Account__c, Account__r.Name, Posted_Date__c, Meeting_Note_Summary__c FROM Public_Plan_Minute__c WHERE (Name Like '+searchKey +' OR Account__r.Name Like '+ searchKey + ') ORDER BY '+sortBy+ ' '+ sortOrder+' LIMIT '+recLimit+' OFFSET '+queryOffset; 
            List<Public_Plan_Minute__c> listToReturn = Database.query(query);
            return listToReturn;
        }
    }

    @AuraEnabled(cacheable=false)
    public static Integer getNotesCount(String searchTerm)
    {
        if(searchTerm == null || searchTerm == '')
        {
            return database.countQuery('SELECT count() FROM Public_Plan_Minute__c');
        }
        else
        {
            searchTerm = String.escapeSingleQuotes(searchTerm);
            String searchKey = '\'%'+searchTerm+'%\'';
            return database.countQuery('SELECT count() FROM Public_Plan_Minute__c WHERE (Name Like '+searchKey + ' OR Account__r.Name Like ' + searchKey + ')');
        }
    }
}