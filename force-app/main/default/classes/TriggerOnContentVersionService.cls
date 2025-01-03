public with sharing class TriggerOnContentVersionService {
    public static void createPublicLinkForFile(List<ContentVersion> contentVersions){

        List<Id> cdIds = new List<Id>();
        for(ContentVersion cn: contentVersions) 
        {
            cdIds.add(cn.ContentDocumentId);
        }

        List<ContentDocumentLink> conDocLinks = [SELECT Id, ContentDocumentId, LinkedEntityId 
                                                FROM ContentDocumentLink 
                                                WHERE ContentDocumentId IN: cdIds];
        List<Id> mpIdsList = new List<Id>(); 
        Map<Id, Id> docKbMap = new Map<Id, Id>();
        Map<String, String> contIdToMpIdMap = new Map<String, String>();
        Map<String, String> MpIdToMpNameMap = new Map<String, String>(); 
        for(ContentDocumentLink cdLink: conDocLinks) 
        {
            if(cdLink.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Manager_Presentation__c'
              || cdLink.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Corporate_Pension_Holding__c'
              || cdLink.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Annual_Reports_and_Holdings_Data__c'
              || Test.isRunningTest())
                docKbMap.put(cdLink.ContentDocumentId, cdLink.LinkedEntityId);

            if(cdLink.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Manager_Presentation__c' || Test.isRunningTest())
            {
                contIdToMpIdMap.put(cdLink.ContentDocumentId, cdLink.LinkedEntityId);
                mpIdsList.add(cdLink.LinkedEntityId); 
            }
        }

        List<Manager_Presentation__c> mpNameList = [SELECT Id, Name FROM Manager_Presentation__c WHERE Id IN: mpIdsList]; 
        for(Manager_Presentation__c mp: mpNameList) 
        {
            MpIdToMpNameMap.put(mp.Id, mp.Name);
        }

        ContentDistribution[] distributionsToInsert = new List<ContentDistribution>();
       	for(ContentVersion objContentVersion : contentVersions){
            if(objContentVersion.FileType.toLowerCase()=='pdf' &&
               docKbMap.containsKey(objContentVersion.ContentDocumentId)){
                distributionsToInsert.add(createContentDistribution(objContentVersion));
            }
        }
        if(!distributionsToInsert.isEmpty())
        {
        	insert distributionsToInsert;
        }

        Map<String,String> contIdToUrlMap = ManagerPresentationController.getPublicDistributionURL(JSON.serialize(contIdToMpIdMap.keySet()));
        Map<String,String> contIdToNameMap = ManagerPresentationController.getDocumentName(JSON.serialize(contIdToMpIdMap.keySet()));
        
        if(contIdToUrlMap.keySet().size() > 0) 
        {
            System.enqueueJob(new MpPublicUrlCallout(contIdToMpIdMap,MpIdToMpNameMap,contIdToNameMap,contIdToUrlMap,'Create'));    //MS-93  Send data to MpPublicUrlCallout for DCI API Payload
        }
    }
    
    public static ContentDistribution createContentDistribution(ContentVersion obj){
        ContentDistribution newDist = new ContentDistribution();
        newDist.ContentVersionId = obj.Id;
        newDist.Name = obj.Title;
        newDist.PreferencesNotifyOnVisit = false;
        newDist.PreferencesAllowViewInBrowser = true;
        newDist.PreferencesAllowOriginalDownload=true;
        return newDist;
    }
}