public with sharing class TriggerOnMpNewFeaturesService {
    public static void setMpNewFeaturesName(List<MP_New_Features__c> mpNewFeaturesList, Map<Id, MP_New_Features__c> oldMpNewFeaturesMap)
    {
        for(MP_New_Features__c mpNewRecord:mpNewFeaturesList)
        {
            if((Trigger.IsInsert  && mpNewRecord.Title__c != null) || 
            (oldMpNewFeaturesMap != null && mpNewRecord.Title__c != null && (mpNewRecord.Title__c != oldMpNewFeaturesMap.get(mpNewRecord.Id).Title__c)))
            {
                Integer charLength = mpNewRecord.Title__c.length();
                if(charLength <= 80) {
                    mpNewRecord.Name = mpNewRecord.Title__c;
                } else {
                    mpNewRecord.Name = mpNewRecord.Title__c.substring(0,80);
                }
            }
        }
    }
}