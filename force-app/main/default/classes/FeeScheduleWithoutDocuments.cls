public with sharing class FeeScheduleWithoutDocuments {
    /**
     * Created Wrapper class for fee schedule.
     */
    public class FeeScheduleData
    {
        @AuraEnabled public String Id { get; set; }
        @AuraEnabled public String Name { get; set; }
        @AuraEnabled public String AccountName { get; set; }
        @AuraEnabled public String SubAssetClass { get; set; }
        @AuraEnabled public String AssetClass { get; set; }
        @AuraEnabled public ID InvestmentStrategyId { get; set; }
        @AuraEnabled public String InvestmentStrategyName { get; set; }
        @AuraEnabled public ID PublicPensionId { get; set; }
        @AuraEnabled public String PublicPensionName { get; set; }
        @AuraEnabled public String TotalFee { get; set; }
        @AuraEnabled public String FeeScheduleName { get; set; }
        @AuraEnabled public String AccountId { get; set; }
    }

    /**
     * gets Account Id and returns related Fee Schedule. 
     */
    @AuraEnabled
    public static List<FeeScheduleData> getFeeScheduleRecords(Id accountId, String sortedBy, String sortOrder, String nullOrder){

        Id feeScheduleRecordTypeId = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Fee_Schedule').getRecordTypeId();

        List<Manager_Presentation__c> feeScheduleInfo;
        if(sortedBy !='' && sortOrder != ''){
            String feeScheduleQuery = 'SELECT Id, Name, Account__c, Account_Name__c, Asset_Class__c, Total_Fee__c, Sub_Asset_Class__c, Meeting_Date__c, Public_Plan_Minute__c, Public_Plan_Minute__r.Name, Investment_Strategy__c, Investment_Strategy__r.Name, Public_Pension_Fund__c, Public_Pension_Fund__r.Name, Manager_Presentation_Type__c, (SELECT ContentDocumentId, ContentDocument.Title FROM ContentDocumentLinks)';
            feeScheduleQuery += ' FROM Manager_Presentation__c WHERE Is_Active__c = true AND (Account__c =:accountId OR Public_Pension_Fund__c =:accountId) AND RecordTypeId = :feeScheduleRecordTypeId';
            feeScheduleQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder;
            feeScheduleInfo = Database.query(feeScheduleQuery);
        }
        else{
            String feeScheduleQuery = 'SELECT Id, Name, Account__c, Account_Name__c, Asset_Class__c, Total_Fee__c, Sub_Asset_Class__c, Meeting_Date__c, Public_Plan_Minute__c, Public_Plan_Minute__r.Name, Investment_Strategy__c, Investment_Strategy__r.Name, Public_Pension_Fund__c, Public_Pension_Fund__r.Name, Manager_Presentation_Type__c, (SELECT ContentDocumentId, ContentDocument.Title FROM ContentDocumentLinks)';
            feeScheduleQuery += ' FROM Manager_Presentation__c WHERE Is_Active__c = true AND (Account__c =:accountId OR Public_Pension_Fund__c =:accountId) AND RecordTypeId = :feeScheduleRecordTypeId';
            feeScheduleInfo = Database.query(feeScheduleQuery);
        }
         
        List<Manager_Presentation__c> recordsWithNoDocs = new List<Manager_Presentation__c>();
        List<FeeScheduleData> listToReturn = new List<FeeScheduleData>();

        for(Manager_Presentation__c fs: feeScheduleInfo) {
            if(fs.ContentDocumentLinks.size() == 0) {
                recordsWithNoDocs.add(fs);
            }
        }

        //initializing class wrapper
        for(Manager_Presentation__c fsRecord : recordsWithNoDocs) {
            FeeScheduleData fsObj = new FeeScheduleData();
            fsObj.Id = (String) fsRecord.Id;
            fsObj.Name = (String) fsRecord.Name;
            fsObj.AccountName = (String) fsRecord.Account_Name__c;
            fsObj.SubAssetClass = (String) fsRecord.Sub_Asset_Class__c;
            fsObj.InvestmentStrategyId = (String) fsRecord.Investment_Strategy__c;
            fsObj.InvestmentStrategyName = (String) fsRecord.Investment_Strategy__r.Name;
            fsObj.PublicPensionId = (String) fsRecord.Public_Pension_Fund__c;
            fsObj.PublicPensionName = (String) fsRecord.Public_Pension_Fund__r.Name;
            fsObj.AssetClass = (String) fsRecord.Asset_Class__c;
            fsObj.TotalFee = (String) fsRecord.Total_Fee__c;
            fsObj.FeeScheduleName = (String) fsRecord.Name;
            fsObj.AccountId = (String) fsRecord.Account__c;
            listToReturn.add(fsObj);
        }
        return listToReturn;
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
}