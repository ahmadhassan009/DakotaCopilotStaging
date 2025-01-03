public with sharing class TabulatorEventBus {
    @AuraEnabled
    public static void publishEvent(String queryData){
        try {
            Tabulator_Data_Sent__e event = new Tabulator_Data_Sent__e(data__c = queryData);
            EventBus.publish(event);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}