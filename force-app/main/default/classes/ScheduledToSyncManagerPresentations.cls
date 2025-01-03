global class ScheduledToSyncManagerPresentations  implements Schedulable,Database.AllowsCallouts {

    global void execute(SchedulableContext sc) {
        fetchManagerPresentationRecords();
    }
         
    public static List<ContentDocumentLink> queryContentDocumentLinkByIds(List<Id> idList) {
        List<ContentDocumentLink> allResults = new List<ContentDocumentLink>();
        Integer batchSize = 2000;

        // Split the Ids into batches
        List<List<Id>> idBatches = new List<List<Id>>();
        for (Integer i = 0; i < idList.size(); i += batchSize) {
            List<Id> batchIds = new List<Id>();
            for (Integer j = i; j < i + batchSize && j < idList.size(); j++) {
                batchIds.add(idList[j]);
            }
            idBatches.add(batchIds);
        }

        // Iterate through each batch of Ids and execute a SOQL query
        for (List<Id> idBatch : idBatches) {
            List<ContentDocumentLink> cdrecords = [SELECT ContentDocumentId,LinkedEntityId,ContentDocument.Title 
                                                FROM ContentDocumentLink 
                                                WHERE LinkedEntityId IN: idBatch];

            allResults.addAll(cdrecords);
        }

        return allResults;
    } 

    public static void fetchManagerPresentationRecords()
    {
        Set<Id> recordTypesIds = new Set<Id>();
        
        Map<String, Schema.RecordTypeInfo> managerPresentationRecTypes = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName();
        recordTypesIds.add(managerPresentationRecTypes.get('Presentation_Deck').getRecordTypeId());
        //recordTypesIds.add(managerPresentationRecTypes.get('Meeting_Materials').getRecordTypeId());
        
        Map<Id,Manager_Presentation__c> managerPresentationRecords = new Map<Id,Manager_Presentation__c> ([Select Id, Name, Account__c,Account_Name__c, Public_Plan_Minute__c, Investment_Strategy__c, Asset_Class__c, Sub_Asset_Class__c,
                                                                                                            Meeting_Date__c, Manager_Presentation_Type__c FROM Manager_Presentation__c
                                                                                                            WHERE Is_Active__c = true and RecordTypeId IN :recordTypesIds]);

        List<ContentDocumentLink> cdrecords = queryContentDocumentLinkByIds(new List<Id>(managerPresentationRecords.keyset()));
        
        List<Manager_Presentation_Info__c> allManagerPresentationData = new List<Manager_Presentation_Info__c>();
        List<String> contentDocumentIdsList =  new List<String>();

        for(ContentDocumentLink contentDocLink : cdrecords)
        {
            Manager_Presentation__c mpRecord = managerPresentationRecords.get(contentDocLink.LinkedEntityId);
            if(mpRecord != null)
            {
                Manager_Presentation_Info__c mpObj = new Manager_Presentation_Info__c();
                mpObj.MP_Title__c = contentDocLink.ContentDocument.Title;
                mpObj.Account_Name__c = (String) mpRecord.Account_Name__c;
                mpObj.Account__c = mpRecord.Account_Name__c != null && mpRecord.Account_Name__c != '' ? mpRecord.Account__c : null;
                mpObj.Asset_Class__c = (String) mpRecord.Asset_Class__c;
                mpObj.Sub_Asset_Class__c = (String) mpRecord.Sub_Asset_Class__c;
                mpObj.Meeting_Date__c = (Date) mpRecord.Meeting_Date__c;
                mpObj.Public_Plan_Minute__c =  mpRecord.Account_Name__c != null && mpRecord.Account_Name__c != '' ? (String) mpRecord.Public_Plan_Minute__c : null;
                mpObj.Type__c = (String) mpRecord.Manager_Presentation_Type__c;
                mpObj.Investment_Strategy__c = (String) mpRecord.Investment_Strategy__c;
                mpObj.Content_Document_Id__c = (ID) contentDocLink.ContentDocumentId;
                allManagerPresentationData.add(mpObj);
                contentDocumentIdsList.add((String) contentDocLink.ContentDocumentId);
            }
        }

        Map<String,String> idToURLMap = getPublicDistributionURL(JSON.serialize(contentDocumentIdsList));
        for(Manager_Presentation_Info__c mpInfo : allManagerPresentationData)
        {
            mpInfo.Distribution_Public_URL__c = idToURLMap.get(mpInfo.Content_Document_Id__c);
        }

        try {
            if(allManagerPresentationData.size()>0)
            {
                delete [Select id from Manager_Presentation_Info__c];
                insert allManagerPresentationData;
            }
        } catch(Exception ex) {
            System.debug(ex.getMessage());
        } 
    }
    
    public static Map<String,String> getPublicDistributionURL(String contentDocumentIds)
    {
        Map<String,String> contentDocumentIdToLink = new Map<String,String>();
        Set<String> contentDocumetIds  =  (Set<String>)System.JSON.deserializeStrict(contentDocumentIds, Set<String>.Class);
        List<ContentDistribution> ContentDistributionList =  [SELECT Id, DistributionPublicUrl,ContentDocumentId 
                                                              FROM ContentDistribution 
                                                              WHERE ContentDocumentId IN: contentDocumetIds];
        for(ContentDistribution contentDist : ContentDistributionList)
        {
            contentDocumentIdToLink.put(contentDist.ContentDocumentId,contentDist.DistributionPublicUrl);
        }
        return contentDocumentIdToLink;
    }
    
}