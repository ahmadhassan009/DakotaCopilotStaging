public with sharing class DakotaNewsController {
    @AuraEnabled
    public static List<Dakota_News__c> getRecords(String search,String sortBy, String sortDirection)
    { 
        String cleanedSearch = '%' + search.trim().replaceAll('\\s+', '%') + '%';
        String DakotaNewsQuery = 'SELECT Id, Name, Description__c, Title__c, Tags__c,Account__c,Contact__c, Account__r.Name, Contact__r.Name, Publish_Date__c,Public_Plan_Minute__c,Public_Plan_Minute__r.Name ';
        DakotaNewsQuery += ' FROM Dakota_News__c ';
        if(search!='')
        {
            DakotaNewsQuery += 'where Title__c LIKE :cleanedSearch';
        }
        DakotaNewsQuery +=' order by '+sortBy+' '+sortDirection+' nulls last limit 5';
        List<Dakota_News__c> returnedRecords = Database.query(DakotaNewsQuery); 
        
        return returnedRecords;
    }

    @AuraEnabled
    public static List<Dakota_News__c> getRecordsViewAll(String search, String sortBy, String sortDirection)
    {   
        String cleanedSearch = '%' + search.trim().replaceAll('\\s+', '%') + '%';
        String DakotaNewsQuery = 'SELECT Id, Name, Description__c, Title__c, Tags__c,Account__c,Contact__c, Account__r.Name, Contact__r.Name, Publish_Date__c,Public_Plan_Minute__c,Public_Plan_Minute__r.Name ';
        DakotaNewsQuery += ' FROM Dakota_News__c ';
        if(search!='')
        {
            DakotaNewsQuery += 'where Title__c LIKE :cleanedSearch';
        }
        DakotaNewsQuery += ' order by '+sortBy+' '+sortDirection+' nulls last';
        List<Dakota_News__c> returnedRecords = Database.query(DakotaNewsQuery); 
        return returnedRecords;
    }
    
    @AuraEnabled
    public static Integer getRecordsCount(String search)
    {   
        String cleanedSearch = '%' + search.trim().replaceAll('\\s+', '%') + '%';
        String dakotaNewsCount = 'SELECT COUNT() FROM Dakota_News__c ';
        if(search!='')
        {
            dakotaNewsCount += 'where Title__c LIKE :cleanedSearch';
        }
        Integer recordCount= Database.countQuery(dakotaNewsCount);
        return recordCount;
    }
}