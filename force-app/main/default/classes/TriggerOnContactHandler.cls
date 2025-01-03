public class TriggerOnContactHandler {
    List<Contact> newContacts;
    Map<Id,Contact> oldContacts;
    Map<Id,Contact> newContactsMap;
    static List<Update__c> beforeDeleteHistories;
    
    public TriggerOnContactHandler( List<Contact> newValues, Map<Id,Contact> oldValues,Map<Id,Contact> newContactsMap) {
        this.newContacts = newValues;
        this.oldContacts = oldValues;
        this.newContactsMap = newContactsMap;
    }
    
    public void beforeUpdate()
    {
        TriggerOnContactService.updateCountryField(newContacts, oldContacts);
        TriggerOnContactService.gpdrRemovalRequest(newContacts, oldContacts);
        TriggerOnContactService.updatePardotDomain(newContacts, oldContacts);
        TriggerOnContactService.setCPRATrackingField(newContacts, oldContacts, newContactsMap);
    }
    
    public void afterUpdate()
    {
        List<Update__c> recordHistoriesToInsert = TriggerOnContactService.logRecordHistoryInParentAccounts(newContacts, oldContacts);
        insert recordHistoriesToInsert;
        TriggerOnContactService.populateNumberOfContactsOnMetroArea(newContacts, oldContacts);
        TriggerOnContactService.sendNotificationOnMPVerification(newContacts, oldContacts);
        //DSC-765: On Account Update, Update the Organization of Community User (if created)
        TriggerOnContactService.updateOrganizationIdOnAccountUpdate(newContacts, oldContacts);
    }
    
    public void afterInsert()
    {
        List<Update__c> recordHistoriesToInsert = TriggerOnContactService.logRecordHistoryInParentAccounts(newContacts, oldContacts);
        insert recordHistoriesToInsert;
        TriggerOnContactService.insertPlatformValues(newContacts);
        TriggerOnContactService.sendContactCreateNotificationEmail(newContacts);
        TriggerOnContactService.populateNumberOfContactsOnMetroArea(newContacts, oldContacts);
        TriggerOnContactService.sendNotificationOnMPVerification(newContacts, oldContacts);
    }
    
    public void beforeDelete()
    {
        beforeDeleteHistories = TriggerOnContactService.logRecordHistoryInParentAccounts(newContacts, oldContacts);
    }
    public void afterDelete()
    {
        TriggerOnContactService.logDeletionRecordHistoryInParentAccounts(newContacts, oldContacts, beforeDeleteHistories);
        TriggerOnContactService.populateNumberOfContactsOnMetroArea(newContacts, oldContacts);
    }

    public void beforeInsert()
    {
        TriggerOnContactService.updateCountryField(newContacts, oldContacts);
        TriggerOnContactService.updatePardotDomain(newContacts, oldContacts);
        TriggerOnContactService.setCPRATrackingField(newContacts, oldContacts, newContactsMap);
    }
}