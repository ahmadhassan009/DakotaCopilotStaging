public with sharing class AnnualReportsAndHoldingsController {

    public class AnnualReportsAndHoldingsData
    {
        @AuraEnabled public String Id { get; set; }
        @AuraEnabled public String Name { get; set; }
        @AuraEnabled public String ReportYear { get; set; }
        @AuraEnabled public String ReportType { get; set; }
        @AuraEnabled public List<ReportAttachment> AR_Attachments { get; set; }
    }

    public class ReportAttachment
    {
        @AuraEnabled public Id ContentDocumentId { get; set; }
        @AuraEnabled public String ContentDocumentTitle { get; set; }
        @AuraEnabled public String DistributionPublicUrl { get; set; }
    }
    
    /**
    * description: To get the total number of Annual Reports and Holdings records linked to a record
    * @param accountId Account record Id related to the which Annual Reports and Holdings records are returned
    * 
    * @returns Integer Number of linked Annual Reports and Holdings records
    */
    @AuraEnabled
    public static Integer getRelatedAnnualReportsAndHoldingsCount(Id recordId) 
    {
        return [ SELECT COUNT() FROM Annual_Reports_and_Holdings_Data__c WHERE Account__c = :recordId ];
    }

    /**
    * description: To get the Annual Report Holdings records linked to a record
    * @param accountId Account record Id related to the which Annual Reports and Holdings records are returned
    * @param sortedBy Field to sort by
    * @param sortOrder Sort Order of the field (ASC/DESC)
    * 
    * @returns List of wrapper class AnnualReportsAndHoldingsData
    */
    @AuraEnabled
    public static List<AnnualReportsAndHoldingsData> getAnnualReportsAndHoldingsRecords(Id accountId, String sortedBy, String sortOrder, Integer recordLimit, Integer offset) {

        //Get the linked annual report holding records
        String annualReportHoldingQuery = 'Select Id FROM Annual_Reports_and_Holdings_Data__c WHERE Account__c =:accountId  ORDER BY ' + sortedBy + ' ' + sortOrder + ' LIMIT :recordLimit OFFSET ' + offset;
        Map<Id,Annual_Reports_and_Holdings_Data__c> annualReportRecords= new Map<Id,Annual_Reports_and_Holdings_Data__c> ((List<Annual_Reports_and_Holdings_Data__c>)Database.query(annualReportHoldingQuery));
        
        if(annualReportRecords.keySet().size() <= 0) 
        {
            return new List<AnnualReportsAndHoldingsData>();
        }

        List<Id> contentDocIds = new List<Id>();
        // Document Link records for Annual Report Holding attachments
        List<ContentDocumentLink> contentDocRecords = [SELECT ContentDocumentId, visibility, ContentDocument.Title 
                                                       FROM ContentDocumentLink 
                                                       WHERE LinkedEntityId IN: annualReportRecords.keySet()];
        
        for(ContentDocumentLink contentDoc : contentDocRecords)
        {
            contentDocIds.add(contentDoc.ContentDocumentId); //creating list of all doc records
        }

        Map<Id, ContentDistribution> contentDistributionMap = new Map <Id, ContentDistribution>();
        List<ContentDistribution>  ContentDistributionList =  [SELECT Id, Name, DistributionPublicUrl, ContentDocumentId, ContentDownloadUrl 
                                                               FROM ContentDistribution 
                                                               WHERE ContentDocumentId IN: contentDocIds];

        // traversing through CDs and updating Public URL for records which have an attachment
        for(ContentDistribution cdlRecord: ContentDistributionList) 
        {
            contentDistributionMap.put(cdlRecord.ContentDocumentId, cdlRecord);
        }

        List<AnnualReportsAndHoldingsData>  annualReportsResult = new List<AnnualReportsAndHoldingsData>();
        String reportHoldingQuery = 'SELECT Id, Name, Type__c, Report_Year__c, ' +
            '(SELECT ContentDocumentId, ContentDocument.Title  ' +
            'FROM ContentDocumentLinks order by ContentDocument.Title NULLS LAST) ' + 
            'FROM Annual_Reports_and_Holdings_Data__c WHERE Account__c =:accountId ' +
            'ORDER BY ' + sortedBy + ' ' + sortOrder + ' LIMIT :recordLimit OFFSET ' + offset;
        System.debug('query: ' + reportHoldingQuery);
        List<Annual_Reports_and_Holdings_Data__c>  annualReportsRecords = Database.query(reportHoldingQuery);

        //initializing class wrapper
        for(Annual_Reports_and_Holdings_Data__c arhRecord : annualReportsRecords) 
        {
            AnnualReportsAndHoldingsData annRepObj = new AnnualReportsAndHoldingsData();
            annRepObj.Id = (String) arhRecord.Id;
            annRepObj.Name = (String) arhRecord.Name;
            annRepObj.ReportYear = (String) arhRecord.Report_Year__c;
            annRepObj.ReportType = (String) arhRecord.Type__c;
            
            if(arhRecord.ContentDocumentLinks.size() > 0) // looking for Annual Report Holding record with attached documents (traverse for multiple documents)
            { 
                List<ReportAttachment> reportAttachments = new List<ReportAttachment>();
                for (ContentDocumentLink cdl: arhRecord.ContentDocumentLinks) {
                    ReportAttachment arhAttachment = new ReportAttachment();
                    arhAttachment.ContentDocumentId = (String) cdl.ContentDocumentId;
                    arhAttachment.ContentDocumentTitle = (String) cdl.ContentDocument.Title;
                    
                    if(contentDistributionMap.containsKey(cdl.ContentDocumentId)) 
                    {
                        ContentDistribution matchedContentDist = contentDistributionMap.get(cdl.ContentDocumentId);
                        arhAttachment.DistributionPublicUrl = matchedContentDist.DistributionPublicUrl;
                        reportAttachments.add(arhAttachment);
                    }
                    annRepObj.AR_Attachments = reportAttachments;
                }
            }
            annualReportsResult.add(annRepObj);
        }
        return annualReportsResult;
    }
}