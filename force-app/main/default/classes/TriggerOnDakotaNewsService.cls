public with sharing class TriggerOnDakotaNewsService {
    public static void setDakotaNewsName(List<Dakota_News__c> newDakotaNewsList, Map<Id, Dakota_News__c> oldDakotaNewsMap)
    {
        for(Dakota_News__c dkNewsRecord:newDakotaNewsList)
        {
            if((Trigger.IsInsert  && dkNewsRecord.Title__c != null) || 
            (oldDakotaNewsMap != null && dkNewsRecord.Title__c != null && (dkNewsRecord.Title__c != oldDakotaNewsMap.get(dkNewsRecord.Id).Title__c)))
            {
                Integer charLength = dkNewsRecord.Title__c.length();
                if(charLength <= 80) {
                    dkNewsRecord.Name = dkNewsRecord.Title__c.substring(0,charLength);
                } else {
                    dkNewsRecord.Name = dkNewsRecord.Title__c.substring(0,80);
                }
            }
        }
    }
}