public class KnowledgeBaseSearchController {
    @AuraEnabled(cacheable=true)
    public static List<Knowledge_Base__c> fetchKnowledgeBaseRecords(String portalType)
    {
        return [Select Id,Name,Video_Document_Link__c 
                from Knowledge_Base__c 
                where Video_Document_Link__c != null 
                and Is_Active__c = true
                and RecordType.DeveloperName = 'Marketplace_Academy'
                and Portal_Type__c includes (:portalType) 
                order by Name asc];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Knowledge_Base__c> searchKnowledgeBaseRecords(String portalType,String searchTerm)
    {
        String searchValue = '%'+searchTerm+'%';
        return [Select Id,Name,Video_Document_Link__c 
                from Knowledge_Base__c 
                where Video_Document_Link__c != null 
                and Is_Active__c = true
                and RecordType.DeveloperName = 'Marketplace_Academy'
                and Portal_Type__c includes (:portalType) 
                and Name Like :searchValue 
                Order by Name asc];
    }
}