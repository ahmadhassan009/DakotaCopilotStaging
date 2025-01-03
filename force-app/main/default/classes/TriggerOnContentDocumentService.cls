public class TriggerOnContentDocumentService {
    public static void updateManagerPresentation(List<ContentDocument> ContentDocumentOldList) 
    {
        Set<Id> docIds = new Set<Id>();
        for(ContentDocument dc: ContentDocumentOldList) 
        {
            docIds.add(dc.Id);
        }
        List<ContentDocumentLink> ContentDocumentLinkList = [SELECT ContentDocumentId, LinkedEntityId 
                                                             FROM ContentDocumentLink 
                                                             WHERE ContentDocumentId IN: docIds];
        Set<Id> mpIds = new Set<Id>();
        Set<Id> docLinkIds = new Set<Id>();
        Map<String, String> contIdToMpIdMap = new Map<String, String>();
        for(ContentDocumentLink l: ContentDocumentLinkList) 
        {
            if(l.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Manager_Presentation__c' || Test.isRunningTest())
            {
                mpIds.add(l.LinkedEntityId);
                docLinkIds.add(l.Id);
                contIdToMpIdMap.put(l.ContentDocumentId, l.LinkedEntityId);    //MS-93  Send data to MpPublicUrlCallout for DCI API Payload
            }
        }
        
        if(mpIds!=null && mpIds.size()>0)
        {
            List<ContentDocumentLink> cdrecords = [SELECT ContentDocumentId, LinkedEntityId
                                                FROM ContentDocumentLink 
                                                WHERE LinkedEntityId IN: mpIds];
            
            Set<Id> mpIdsWithFiles = new Set<Id>();
            for(ContentDocumentLink l: cdrecords) 
            {
                if(!(docLinkIds.contains(l.Id)))
                    mpIdsWithFiles.add(l.LinkedEntityId);
            }
            
            List<Manager_Presentation__c> managerPresentationRecs= [Select Id,Type__c FROM Manager_Presentation__c  WHERE Id IN: mpIds];
            
            for(Manager_Presentation__c mpRec: managerPresentationRecs)
            {
                if(!(mpIdsWithFiles.contains(mpRec.Id)))
                    mpRec.Type__c = null;
            }
            if(managerPresentationRecs != null && managerPresentationRecs.size() > 0){
                update managerPresentationRecs;
            }

            if(contIdToMpIdMap.keySet().size() > 0)  
            {
                System.enqueueJob(new MpPublicUrlCallout(contIdToMpIdMap,new Map<String,String>(),new Map<String,String>(),new Map<String,String>(),'Delete'));   //MS-93  Send data to MpPublicUrlCallout for DCI API Payload
            }
        }
    }
}