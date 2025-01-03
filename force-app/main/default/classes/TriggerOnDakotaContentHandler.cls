public class TriggerOnDakotaContentHandler {
    List<Dakota_Content__c> dakotaContentList;
    Map<Id, Dakota_Content__c> oldDakotaContentMap;
    
    public TriggerOnDakotaContentHandler(List<Dakota_Content__c> dakotaContentList, Map<Id, Dakota_Content__c> oldDakotaContentMap)
    {
        this.dakotaContentList = dakotaContentList;
        this.oldDakotaContentMap = oldDakotaContentMap;
    }
    
    public void afterInsert()
    {
        TriggerOnDakotaContentService.refreshDakotaContentPanels(dakotaContentList);
        TriggerOnDakotaContentService.updateCMSCollectionVisibility(dakotaContentList,new Map<Id,Dakota_Content__c>()); 
        TriggerOnDakotaContentService.updateMetroAreaReviewHighlight(dakotaContentList,oldDakotaContentMap);

    }
    
    public void beforeInsert()
    {
        TriggerOnDakotaContentService.populateContactAccountField(dakotaContentList,oldDakotaContentMap);
        TriggerOnDakotaContentService.populateMetroAreaField(dakotaContentList,oldDakotaContentMap);//DSC-591: Auto-populates metro area field from Contact or Account based on type
        TriggerOnDakotaContentService.setDakotaContentLinesName(dakotaContentList,oldDakotaContentMap);
    }
    
    public void beforeUpdate()
    {
        TriggerOnDakotaContentService.populateContactAccountField(dakotaContentList,oldDakotaContentMap);
        TriggerOnDakotaContentService.populateMetroAreaField(dakotaContentList,oldDakotaContentMap);//DSC-591: Auto-populates metro area field from Contact or Account based on type
        TriggerOnDakotaContentService.setDakotaContentLinesName(dakotaContentList,oldDakotaContentMap);
        
    }
    
    public void afterUpdate()
    {
        TriggerOnDakotaContentService.updateCMSCollectionVisibility(dakotaContentList,oldDakotaContentMap);
        TriggerOnDakotaContentService.updateMetroAreaReviewHighlight(dakotaContentList,oldDakotaContentMap);
    }
        
    public void afterDelete()
    {
        TriggerOnDakotaContentService.updateCMSCollectionVisibility(new List<Dakota_Content__c>(),oldDakotaContentMap);
    }
    public void beforeDelete()
    {
        TriggerOnDakotaContentService.updateMetroAreaReviewHighlight(new List<Dakota_Content__c>(),oldDakotaContentMap);
    }
}