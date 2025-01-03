global class BatchToDeleteInvestment13FData implements Database.Batchable<sObject>
{
    global Database.QueryLocator start(Database.BatchableContext BC) {
        String recordTypeName = '13F Filings';
        String productStructure = 'Common Stock';
        String query = 'SELECT Id FROM Investment__c where recordtype.name = :recordTypeName and Product_Structure__c = :productStructure and isRecordCloned__c=true limit 50000';
        return Database.getQueryLocator(query);
    }
    
    global void execute(Database.BatchableContext BC, List<Investment__c> invRecordList) {
        if(invRecordList.size()>0) {
            try {
                delete invRecordList;
            } catch(Exception ex) {
                System.debug(ex.getMessage());
            } 
        }       
    }
    
    global void finish(Database.BatchableContext BC){}
}