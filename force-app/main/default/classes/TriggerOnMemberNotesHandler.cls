public class TriggerOnMemberNotesHandler {
    
    List<Member_Comments__c> newMemberNotes;
    List<Member_Comments__c> oldMemberNotes;
    Map<Id, Member_Comments__c> oldMemberNotesMap;
    public Boolean isUpdated = false;
    public Boolean isDeleted = false;
    
    public TriggerOnMemberNotesHandler( List<Member_Comments__c> newValues, List<Member_Comments__c> oldValues, Map<Id, Member_Comments__c> oldMap) {
        this.newMemberNotes = newValues;
        this.oldMemberNotes = oldValues;
        this.oldMemberNotesMap = oldMap;
    }
    
    public void afterInsert()
    {
        TriggerOnMemberNoteService.sendNotesNotificationEmail(newMemberNotes, oldMemberNotes, null, false, false);
    }

    public void afterDelete()
    {
        TriggerOnMemberNoteService.sendNotesNotificationEmail(null, oldMemberNotes, this.oldMemberNotesMap, false, true);
    }
}