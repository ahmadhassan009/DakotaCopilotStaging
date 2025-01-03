public class DakotaContentMetroAreaRelatedList {
    /** 
     * DSC-659: Show only DC records with type Metro Area Roadmap 
     */
    @AuraEnabled
    public static List<Dakota_Content__c> getMetroAreaRelatedDakotaContentRecords(Id recordId, Integer recordLimit, Integer offset)
    {
       return [SELECT Id, Name, Type__c, Date__c, Dakota_Live_Call__c, Dakota_Live_Call__r.Name, Presentation_Recording__c, Presentation_Recording_url__c 
                FROM Dakota_Content__c
                WHERE Metro_Area_Linked__c = :recordId AND Type__c = 'Metro Area Roadmap'
                ORDER BY Date__c DESC 
                LIMIT :recordLimit OFFSET :offset];
    }

    /** 
     * DSC-659: Show only DC records with type Metro Area Roadmap 
     */
    @AuraEnabled
    public static Integer getMetroAreaRelatedDakotaContentCount(Id recordId) {
        return [
            SELECT COUNT()
            FROM Dakota_Content__c
            WHERE Metro_Area_Linked__c =: recordId AND Type__c = 'Metro Area Roadmap'
        ];
    }

    @AuraEnabled
    public static List<Dakota_Content__c> getMetroAreaStateRelatedDakotaContentRecords(String stateName,String sortedBy, String sortedDirection, Integer recordLimit, Integer offset, String nullOrder)
    {
        List <Metro_Area__c> metroAreasByStates = [SELECT Id from Metro_Area__c where state__c =: stateName];

        String metroAreatpe='Metro Area Roadmap';
        String recordsQuery= 'SELECT Id, Name, Type__c, Date__c, Dakota_Live_Call__c, Dakota_Live_Call__r.Name, Presentation_Recording__c, Presentation_Recording_url__c ';
        recordsQuery+= 'FROM Dakota_Content__c WHERE Metro_Area_Linked__c IN :metroAreasByStates AND Type__c = :metroAreatpe';
        recordsQuery+= ' ORDER BY ' + sortedBy + ' ' + sortedDirection + ' NULLS ' + nullOrder +' LIMIT ' + recordLimit + ' OFFSET ' + offset;

        List<Dakota_Content__c> returnedRecords = Database.query(recordsQuery); 
        return returnedRecords;
    }

    /** 
     * DSC-659: Show only DC records with type Metro Area Roadmap 
     */
    @AuraEnabled
    public static Integer getMetroAreaStateRelatedDakotaContentCount(String stateName) {
        List <Metro_Area__c> metroAreasByStates = [SELECT Id from Metro_Area__c where state__c =: stateName];
        return [
            SELECT COUNT()
            FROM Dakota_Content__c
            WHERE Metro_Area_Linked__c IN :metroAreasByStates AND Type__c = 'Metro Area Roadmap'
        ];
    }

    @AuraEnabled(cacheable=true)
    public static String getMetroAreaName(String  recordId)
    {
        return [SELECT Id, Name FROM Metro_Area__c where Id =: recordId].Name ;
    }

}