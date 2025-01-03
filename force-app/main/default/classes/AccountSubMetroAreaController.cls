public with sharing class AccountSubMetroAreaController 
{
    @AuraEnabled
    public static List<Sub_Metro_Area__c> getSubMetroAreaRecords(Id recordId, Boolean isCommunity)
    {
        if(isCommunity == true)
        {
            return [Select Id,Metro_Area__c,Metro_Area__r.Name 
                from Sub_Metro_Area__c 
                where Account__c = :recordId
                AND Metro_Area__r.Sort_Order__c > 0];
        }
        else {
            return [Select Id,Metro_Area__c,Metro_Area__r.Name, Metro_Area__r.Sort_Order__c
                from Sub_Metro_Area__c 
                where Account__c = :recordId];
        }
        
    }
}