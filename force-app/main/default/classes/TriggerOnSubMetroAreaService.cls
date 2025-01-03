public class TriggerOnSubMetroAreaService {
    public static void preventDuplicationOfSubMetroAreas(List<Sub_Metro_Area__c> newSubMetroAreas,Map<Id, Sub_Metro_Area__c> oldSubMetroAreas) 
    {
        Set<String> compositeKeys = new Set<String>();
        for(Sub_Metro_Area__c subMetroArea : newSubMetroAreas) 
        {
            if(Trigger.isInsert || 
               (Trigger.isUpdate && 
                (subMetroArea.Account__c != oldSubMetroAreas.get(subMetroArea.Id).Account__c || 
                 subMetroArea.Metro_Area__c != oldSubMetroAreas.get(subMetroArea.Id).Metro_Area__c)))
            { 
                subMetroArea.Account_Metro_Area_Composite_Key__c = String.valueOf(subMetroArea.Account__c)+String.valueOf(subMetroArea.Metro_Area__c);
                compositeKeys.add(subMetroArea.Account_Metro_Area_Composite_Key__c);
            }
        }
        if(compositeKeys.size() > 0)
        {
            Map<String,Sub_Metro_Area__c> compositeKeyToSubMetroArea = new map<String,Sub_Metro_Area__c>();
            List <Sub_Metro_Area__c> existingSubMetroAreas = [Select Id,Account_Metro_Area_Composite_Key__c from Sub_Metro_Area__c where Account_Metro_Area_Composite_Key__c IN :compositeKeys];
            if(existingSubMetroAreas.size() > 0)
            {
                for(Sub_Metro_Area__c sub : existingSubMetroAreas)
                {           
                    compositeKeyToSubMetroArea.put(sub.Account_Metro_Area_Composite_Key__c,sub);           
                }
                for(Sub_Metro_Area__c subMetroArea : newSubMetroAreas)
                {               
                    if(compositeKeyToSubMetroArea.containsKey(subMetroArea.Account_Metro_Area_Composite_Key__c))
                    {
                        subMetroArea.addError('You are creating a duplicate record.');               
                    }              
                }  
            }
        }                                                 
    }         

    public static void setSubMetroAreaName(List<Sub_Metro_Area__c> newSubMetroArea,Map<Id, Sub_Metro_Area__c> oldSubMetroArea) {          
        Map<Id,Account> accMap = new Map<Id,Account>();  
        Map<Id,Metro_Area__c> metroAreaMap = new Map<Id,Metro_Area__c>();
        List<Sub_Metro_Area__c> subMetroAreasToBeProcessed = new List<Sub_Metro_Area__c>();
        for(Sub_Metro_Area__c subMetroArea : newSubMetroArea)
        {    
            {
                if(Trigger.isInsert || 
                (Trigger.isUpdate && 
                    (subMetroArea.Account__c != oldSubMetroArea.get(subMetroArea.Id).Account__c || 
                    subMetroArea.Metro_Area__c != oldSubMetroArea.get(subMetroArea.Id).Metro_Area__c)))
                {                      
                    accMap.put(subMetroArea.Account__c,null);  
                    metroAreaMap.put(subMetroArea.Metro_Area__c,null);
                    subMetroAreasToBeProcessed.add(subMetroArea); 
                }
            }
        }
        if(subMetroAreasToBeProcessed.size()>0)
        {    
            accMap = new Map<Id,Account>([Select Id, Name from Account where Id IN :accMap.keySet()]);
            metroAreaMap = new Map<Id,Metro_Area__c>([Select Id, Name from Metro_Area__c where Id IN :metroAreaMap.keySet()]);
            String subMetroAreaName = '';          
            for(Sub_Metro_Area__c subMetroArea : subMetroAreasToBeProcessed){               
                if((accMap.containsKey(subMetroArea.Account__c) && metroAreaMap.containsKey(subMetroArea.Metro_Area__c)) )  
                {
                    subMetroAreaName = metroAreaMap.get(subMetroArea.Metro_Area__c).Name + ' - ' +accMap.get(subMetroArea.Account__c).Name;
                }
                if(subMetroAreaName.length()>80 )
                {  
                    subMetroAreaName = subMetroAreaName.substring(0,80);   
                }
                subMetroArea.Name = subMetroAreaName;               
            }                           
        }  
    }

    public static void updateNumberOfAccountsInMetroArea(List<Sub_Metro_Area__c> newSubMetroArea, List<Sub_Metro_Area__c> oldSubMetroAreaList, Map<Id, Sub_Metro_Area__c> oldSubMetroArea) {

        Set<Id> maList = new Set<Id>();
        List<Id> updateMAs = new List<Id>();
        Map<Id, Integer> maAccMap = new Map<Id, Integer>();
        List<Id> accList = new List<Id>();
        List<Metro_Area__c> listToUpdate = new List<Metro_Area__c>();
        Map<Id, Integer> accountCountMapForMP = new Map<Id, Integer>();
        List<Sub_Metro_Area__c> listToProcess = new List<Sub_Metro_Area__c>();

        listToProcess = Trigger.isDelete ? oldSubMetroAreaList : newSubMetroArea;

        //Get the metro areas whose sort order needs to be updated
        for(Sub_Metro_Area__c subMetroArea : listToProcess) {

            maList.add(subMetroArea.Metro_Area__c);

            if(Trigger.isUpdate &&
                ((subMetroArea.Metro_Area__c != oldSubMetroArea.get(subMetroArea.Id).Metro_Area__c) ||
                (subMetroArea.Account__c != oldSubMetroArea.get(subMetroArea.Id).Account__c))
            )
            {
                maList.add(oldSubMetroArea.get(subMetroArea.Id).Metro_Area__c);
            }
        }
        
        //Prepare Count for verified Number of Accounts linked through sub metro areas
        for(AggregateResult aggRes: [SELECT COUNT(Account__c) numofInvestmentAccounts, Metro_Area__c FROM Sub_Metro_Area__c
                                     WHERE Account__r.RecordType.DeveloperName = 'Dakota_Investments_Account' 
                                     AND Account__r.X100_Marketplace__c = true
                                     AND (Metro_Area__c IN :maList OR Id IN :listToProcess) GROUP BY Metro_Area__c])
        {
            Id metroAreaId = (Id) aggRes.get('Metro_Area__c');
            Integer numofAccounts = (Integer) aggRes.get('numofInvestmentAccounts');
            maAccMap.put(metroAreaId, numofAccounts);
        }

        //If the same account is linked directly as well as indirectly(through sub metro area) to a metro area, then it should be counted as one.
        for(Sub_Metro_Area__c subMa: [SELECT Account__c FROM Sub_Metro_Area__c
                            WHERE Account__r.RecordType.DeveloperName = 'Dakota_Investments_Account' 
                            AND Account__r.X100_Marketplace__c = true
                            AND (Metro_Area__c IN :maList OR Id IN :listToProcess)])
        {
            accList.add(subMa.Account__c);
        }

        //Prepare Count Map For Sort Order (Marketplace)
        for (AggregateResult aggRes : [SELECT COUNT(Id) numofInvestmentAccounts, MetroArea__c FROM Account 
                                       WHERE RecordType.DeveloperName = 'Dakota_Investments_Account' 
                                       AND X100_Marketplace__c = true AND MetroArea__c in :maList AND Id NOT IN: accList 
                                       GROUP BY MetroArea__c]) 
        {
            Id parentMetroAreaId = (Id) aggRes.get('MetroArea__c');
            Integer numofAccounts = (Integer) aggRes.get('numofInvestmentAccounts');
            accountCountMapForMP.put(parentMetroAreaId, numofAccounts);
        }

        for(Metro_Area__c ma: [ SELECT Id, Sort_Order__c FROM Metro_Area__c WHERE Id IN :maList ]) {
            if(accountCountMapForMP.containsKey(ma.Id) && maAccMap.containsKey(ma.Id))
                ma.Sort_Order__c = accountCountMapForMP.get(ma.Id) + maAccMap.get(ma.Id);
            else if(accountCountMapForMP.containsKey(ma.Id) && ! maAccMap.containsKey(ma.Id)) {
                ma.Sort_Order__c = accountCountMapForMP.get(ma.Id);
            } else if(! accountCountMapForMP.containsKey(ma.Id) && maAccMap.containsKey(ma.Id)) {
                ma.Sort_Order__c = maAccMap.get(ma.Id);
            } else {
                ma.Sort_Order__c = 0;
            }
            listToUpdate.add(ma);
        }
        update listToUpdate;    
    }

    @testVisible static private List<refreshComponents__e> eventList = new List<RefreshComponents__e>();   
    public static void refreshSubMetroAreaPanels(List<Sub_Metro_Area__c> newSubMetroArea)
    {
        List<refreshComponents__e> refreshRecordEvents = new List<refreshComponents__e>();
        for (Sub_Metro_Area__c subMetroArea : newSubMetroArea) {
            refreshRecordEvents.add(new refreshComponents__e(
                recordUsed__c = subMetroArea.Account__r.Id,
                UserUsed__c = UserInfo.getUserId(),
                userSession__c = UserInfo.getSessionId()
            ));
            eventList.addAll(refreshRecordEvents);
        }
        EventBus.publish(refreshRecordEvents);
    }
}