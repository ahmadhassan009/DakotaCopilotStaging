public class ManagerPresentationController {
    public class ManagerPresentationData implements Comparable
    {
        @AuraEnabled public String Name { get; set; }
        @AuraEnabled public String MpId { get; set; }
        @AuraEnabled public String DistributionPublicUrl { get; set; }
        @AuraEnabled public String AccountName { get; set; }
        @AuraEnabled public String AssetClass { get; set; }
        @AuraEnabled public String SubAssetClass { get; set; }
        @AuraEnabled public Date MeetingDate { get; set; }
        @AuraEnabled public ID PublicPlanMinuteId { get; set; }
        @AuraEnabled public String PublicPlanMinuteName { get; set; }
        @AuraEnabled public String Type { get; set; }
        @AuraEnabled public ID InvestmentStrategyId { get; set; }
        @AuraEnabled public String InvestmentStrategyName { get; set; }
        @AuraEnabled public ID PublicPensionId { get; set; }
        @AuraEnabled public String PublicPensionName { get; set; }
        @AuraEnabled public ID ContentDocumentId { get; set; }
        
        public Integer compareTo(Object compareTo) {
            ManagerPresentationData compareToRecords = (ManagerPresentationData)compareTo;
            if (MeetingDate == compareToRecords.MeetingDate) return 0;
            
            if (MeetingDate == null) return 1;
            if (compareToRecords.MeetingDate == null) return -1;
            
            return (MeetingDate > compareToRecords.MeetingDate) ? -1 : 1;
        }
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
    
    @AuraEnabled(cacheable=true)
    public static List<ManagerPresentationData> fetchManagerPresentationRecords(String searchValue)
    {
        List<ManagerPresentationData> mpData = new List<ManagerPresentationData>();
        Id presentationDeckRecordTypeId = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Presentation_Deck').getRecordTypeId();
        
        Map<Id,Manager_Presentation__c> managerPresentationRecords = new Map<Id,Manager_Presentation__c> ([Select Id,Name, Account_Name__c, Asset_Class__c, Sub_Asset_Class__c, Meeting_Date__c, 
                                                                                                           Public_Plan_Minute__c, Public_Plan_Minute__r.Name, Investment_Strategy__c, 
                                                                                                           Investment_Strategy__r.Name, Public_Pension_Fund__c, 
                                                                                                           Public_Pension_Fund__r.Name, Manager_Presentation_Type__c
                                                                                                           FROM Manager_Presentation__c
                                                                                                           WHERE Is_Active__c = true and RecordTypeId = :presentationDeckRecordTypeId]);

        List<ContentDocumentLink> cdrecords = queryContentDocumentLinkByIds(new List<Id>(managerPresentationRecords.keyset()));

        if(searchValue !=null && searchValue!= '' && searchValue.length()>1)
        {
            Set<Id> cdIds = new Set<Id>();
            for(ContentDocumentLink contentDocLink : cdrecords)
            {
                cdIds.add(contentDocLink.ContentDocumentId);
            }
            searchValue = '"'+searchValue+'"';
            List<List<ContentDocument>> contentDocs = [FIND :searchValue IN NAME FIELDS RETURNING ContentDocument(Id, Title WHERE Id IN:cdIds)];
            List<Id> contentDocIds = new List<Id>();
            for(ContentDocument con: contentDocs[0])
            {
                contentDocIds.add(con.Id);
            }
            if(contentDocIds.size() > 0)
            {
                cdrecords = [SELECT ContentDocumentId,LinkedEntityId,ContentDocument.Title 
                             FROM ContentDocumentLink 
                             WHERE ContentDocumentId IN: contentDocIds];
            }
            else
            {
                cdrecords = new List<ContentDocumentLink>();
            }
        }
        List<ManagerPresentationData> allManagerPresentationData = new List<ManagerPresentationData>();
        for(ContentDocumentLink contentDocLink : cdrecords)
        {
            Manager_Presentation__c mpRecord = managerPresentationRecords.get(contentDocLink.LinkedEntityId);
            if(mpRecord != null)
            {
                ManagerPresentationData mpObj = new ManagerPresentationData();
                mpObj.MpId = (String) mpRecord.Id;
                mpObj.Name = contentDocLink.ContentDocument.Title;
                mpObj.AccountName = (String) mpRecord.Account_Name__c;
                mpObj.AssetClass = (String) mpRecord.Asset_Class__c;
                mpObj.SubAssetClass = (String) mpRecord.Sub_Asset_Class__c;
                mpObj.MeetingDate = (Date) mpRecord.Meeting_Date__c;
                mpObj.PublicPlanMinuteId = (String) mpRecord.Public_Plan_Minute__c;
                mpObj.PublicPlanMinuteName = (String) mpRecord.Public_Plan_Minute__r.Name;
                mpObj.Type = (String) mpRecord.Manager_Presentation_Type__c;
                mpObj.InvestmentStrategyId = (String) mpRecord.Investment_Strategy__c;
                mpObj.InvestmentStrategyName = (String) mpRecord.Investment_Strategy__r.Name;
                mpObj.PublicPensionId = (String) mpRecord.Public_Pension_Fund__c;
                mpObj.PublicPensionName = (String) mpRecord.Public_Pension_Fund__r.Name;
                mpObj.ContentDocumentId = (ID) contentDocLink.ContentDocumentId;
                allManagerPresentationData.add(mpObj);
            }
        }

        allManagerPresentationData.sort();
        return allManagerPresentationData;
    }
    
    @AuraEnabled(cacheable=false)
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
    
    public static Map<String,String> getDocumentName(String contentDocumentIds)
    {
        Map<String,String> contentDocumentIdToName = new Map<String,String>();
        Set<String> contentDocumetIds  =  (Set<String>)System.JSON.deserializeStrict(contentDocumentIds, Set<String>.Class);
        List<ContentDistribution> ContentDistributionList =  [SELECT Id,Name,ContentDocumentId 
                                                              FROM ContentDistribution 
                                                              WHERE ContentDocumentId IN: contentDocumetIds];
        for(ContentDistribution contentDist : ContentDistributionList)
        {
            contentDocumentIdToName.put(contentDist.ContentDocumentId,contentDist.Name);
        }
        return contentDocumentIdToName;
    }

    
}