public with sharing class TriggerOnMetroAreaHandler {
        List<Metro_Area__c> newRecords;
        Map<Id,Metro_Area__c> oldRecords;
        
        public TriggerOnMetroAreaHandler( List<Metro_Area__c> newValues, Map<Id,Metro_Area__c> oldValues) {
            this.newRecords = newValues;
            this.oldRecords = oldValues;
        }
        
        public void afterUpdate()
        {
            TriggerOnMetroAreaService.updateAccountsAndContacts(newRecords, oldRecords);
        }
}