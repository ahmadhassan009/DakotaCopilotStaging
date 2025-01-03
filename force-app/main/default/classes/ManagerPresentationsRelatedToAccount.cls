public with sharing class ManagerPresentationsRelatedToAccount {

    public class ManagerPresentationsData
    {
        @AuraEnabled public String Id { get; set; }
        @AuraEnabled public String DocName { get; set; }
        @AuraEnabled public String AccountName { get; set; }
        @AuraEnabled public String DistributionPublicUrl { get; set; }
    }

    /**
     * Function takes account id and Manager Presentation record type and return Class Wrapper object List of related MP records
     */
    @AuraEnabled
    public static List<ManagerPresentationsData> getManagerPresentationRecords(Id accountId, String managerPresentationType)
	{
        Id recordTypeId;
        if (managerPresentationType == 'Fee Schedule') {
            recordTypeId = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Fee_Schedule').getRecordTypeId();
        } else if(managerPresentationType == 'Meeting Materials') {
            recordTypeId = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Meeting_Materials').getRecordTypeId();
        }

        //getting the list of MP records
        Map<Id,Manager_Presentation__c> managerPresentationRecs= new Map<Id,Manager_Presentation__c> ([Select Id FROM Manager_Presentation__c
        WHERE Is_Active__c = true AND (Account__c =:accountId OR Public_Pension_Fund__c =:accountId) AND RecordTypeId = :recordTypeId]);
        if (managerPresentationRecs.keySet().size() <= 0) {
            return new List<ManagerPresentationsData>();
        }

        List<Id> cdIds = new List<Id>();
        //getting the Document Link records for MP attachments
        List<ContentDocumentLink> cdrecords = [SELECT ContentDocumentId, visibility, ContentDocument.Title 
        FROM ContentDocumentLink 
        WHERE LinkedEntityId IN: managerPresentationRecs.keySet()];
        for(ContentDocumentLink contentDoc : cdrecords){
            cdIds.add(contentDoc.ContentDocumentId);//creating list of all doc records
        }

        //Manager Presentation Data
        Map<String, ManagerPresentationsData> allManagerPresentationsData = new Map <String, ManagerPresentationsData>();
        List<Manager_Presentation__c>  managerPresentationsInfo = [SELECT Id, Name, Account_Name__c, 
                                                                    (SELECT ContentDocumentId, ContentDocument.Title 
                                                                        FROM ContentDocumentLinks order by ContentDocument.Title NULLS LAST) 
                                                                    FROM Manager_Presentation__c WHERE Is_Active__c = true AND (Account__c =:accountId OR Public_Pension_Fund__c =:accountId) 
                                                                    AND RecordTypeId = :recordTypeId];
       
        //initializing class wrapper
        for(Manager_Presentation__c fsRecord : managerPresentationsInfo) {
            if(fsRecord.ContentDocumentLinks.size() > 0 || Test.isRunningTest()) { // looking for MP record with attached documents (traverse for multiple documents)
                for (ContentDocumentLink cdl: fsRecord.ContentDocumentLinks) {
                    ManagerPresentationsData fsObj = new ManagerPresentationsData();
                    fsObj.Id = (String) fsRecord.Id;
                    fsObj.DocName = (String) cdl.ContentDocument.Title;
                    fsObj.AccountName = (String) fsRecord.Account_Name__c;
                    allManagerPresentationsData.put(cdl.ContentDocumentId, fsObj);
                }
            }
        }

        List<ContentDistribution>  ContentDistributionList = new List<ContentDistribution>();
        List<ManagerPresentationsData>  managerPresentationResult = new List<ManagerPresentationsData>();
        //getting the IDs for CDs for all Linked Documents
        ContentDistributionList =  [SELECT Id,Name, DistributionPublicUrl,ContentDocumentId, ContentDownloadUrl 
                                                                       FROM ContentDistribution 
                                                                       WHERE ContentDocumentId IN: cdIds];


        // traversing through CDs and updating Public URL for records (only for those MP rec which have any attachment)
        for(ContentDistribution cdlRecord: ContentDistributionList) {
            if(allManagerPresentationsData.containsKey(cdlRecord.ContentDocumentId) || Test.isRunningTest()) {
                ManagerPresentationsData matchedfsObj = new ManagerPresentationsData();
                matchedfsObj = allManagerPresentationsData.get(cdlRecord.ContentDocumentId);
                matchedfsObj.DistributionPublicUrl = cdlRecord.DistributionPublicUrl;
                managerPresentationResult.add(matchedfsObj);
                allManagerPresentationsData.remove(cdlRecord.ContentDocumentId);//removing processed MPs
            } 
        }

        return managerPresentationResult;
    }

    /**
     * Function takes account Id and returns the name of the Account
     */
    @AuraEnabled
    public static Account getAccountName(Id recordId) {
        return [
            SELECT Name
            FROM Account
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ];
    }

    /**
     * Function returns base URL for salesforce
     */
    @AuraEnabled
    public static string getSFBaseUrl(){
        String sfdcBaseURL = URL.getSalesforceBaseUrl().toExternalForm();
        return sfdcBaseURL;
    }

    @AuraEnabled
    public static Integer getRecordsCount(String recordId) {
        try {
            return [SELECT count() FROM Manager_Presentation__c 
                    WHERE (Is_Active__c = true) 
                    AND (Consultant__c = :recordId OR Public_Pension_Fund__c = :recordId OR Account__c = :recordId)];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Manager_Presentation__c> getRecords(String recordId, String sortBy, String sortOrder,  String nullOrder, Integer recordLimit, Integer offset) {
        try {
            return database.query('SELECT Id, Name, Account__c, Account_Name__c, Asset_Class__c, Sub_Asset_Class__c, Posted_Date__c, Meeting_Date__c FROM Manager_Presentation__c WHERE (Is_Active__c = true) AND (Consultant__c = :recordId OR Public_Pension_Fund__c = :recordId OR Account__c = :recordId)  ORDER BY ' + sortBy + ' ' + sortOrder + ' NULLS ' + nullOrder  + ' LIMIT :recordLimit OFFSET ' + offset);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        } 
    }
}