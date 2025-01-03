public with sharing class TriggerOnMpNewFeaturesHandler {
    List<MP_New_Features__c> mpNewFeaturesList;
    Map<Id, MP_New_Features__c> oldMpNewFeaturesMap;
    public TriggerOnMpNewFeaturesHandler(List<MP_New_Features__c> mpNewFeaturesList, Map<Id, MP_New_Features__c> oldMpNewFeaturesMap) {
        this.mpNewFeaturesList = mpNewFeaturesList;
        this.oldMpNewFeaturesMap = oldMpNewFeaturesMap;
    }

    public void beforeInsert()
    {
        //DSC-1051 : Check to see if the Title (# of Characters) can be displayed as Record Name 
        TriggerOnMpNewFeaturesService.setMpNewFeaturesName(mpNewFeaturesList,oldMpNewFeaturesMap);
    }
    
    public void beforeUpdate()
    {
        //DSC-1051 : Check to see if the Title (# of Characters) can be displayed as Record Name 
        TriggerOnMpNewFeaturesService.setMpNewFeaturesName(mpNewFeaturesList,oldMpNewFeaturesMap);
        
    }
}