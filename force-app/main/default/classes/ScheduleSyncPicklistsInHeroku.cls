global with sharing class ScheduleSyncPicklistsInHeroku implements Schedulable {
    global void execute(SchedulableContext sc) {

        List<Sync_Picklists_In_Heroku__mdt> objectAndpicklistList = [SELECT Object_Name__c, Picklist_Fields__c FROM Sync_Picklists_In_Heroku__mdt];
        List<ExportRecordsMainController.PicklistWrapper> picklistValuesList= new List<ExportRecordsMainController.PicklistWrapper>();
        List<SyncPicklistWrapper> syncPicklistWrapperList = new List<SyncPicklistWrapper>();
        for(Sync_Picklists_In_Heroku__mdt picklist:objectAndpicklistList)
        {
            picklistValuesList = ExportRecordsMainController.getPicklistValues(picklist.Object_Name__c,picklist.Picklist_Fields__c.split(','));
            for(ExportRecordsMainController.PicklistWrapper picklistVal: picklistValuesList)
            { 
                SyncPicklistWrapper syncPicklist = new SyncPicklistWrapper();
                syncPicklist.object_name = picklist.Object_Name__c;
                syncPicklist.field_name = picklistVal.fieldName;
                syncPicklist.picklist_values = picklistVal.valuesLabelsMap;
                syncPicklistWrapperList.add(syncPicklist);
            }
        }
        HerokuSyncHelper helperObj = new HerokuSyncHelper('');
        helperObj.processRequestForPicklists(syncPicklistWrapperList,'POST');
    }

    public class SyncPicklistWrapper
    {
        @AuraEnabled public String object_name {get;set;}
        @AuraEnabled public String field_name {get;set;}
        @AuraEnabled public Map<String,String> picklist_values {get;set;} 
    }
}