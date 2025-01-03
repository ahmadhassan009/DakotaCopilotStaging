public with sharing class TriggerOnDakotaNewsHandler {
    List<Dakota_News__c> dakotaNewsList;
    Map<Id, Dakota_News__c> oldDakotaNewsMap;
    public TriggerOnDakotaNewsHandler(List<Dakota_News__c> dakotaNewsList, Map<Id, Dakota_News__c> oldDakotaNewsMap) {
        this.dakotaNewsList = dakotaNewsList;
        this.oldDakotaNewsMap = oldDakotaNewsMap;
    }

    public void beforeInsert()
    {
        //DSC-793 : Check to see if the Title (# of Characters) can be displayed as Record Name 
        TriggerOnDakotaNewsService.setDakotaNewsName(dakotaNewsList,oldDakotaNewsMap);
    }
    
    public void beforeUpdate()
    {
        //DSC-793 : Check to see if the Title (# of Characters) can be displayed as Record Name 
        TriggerOnDakotaNewsService.setDakotaNewsName(dakotaNewsList,oldDakotaNewsMap);
        
    }
}