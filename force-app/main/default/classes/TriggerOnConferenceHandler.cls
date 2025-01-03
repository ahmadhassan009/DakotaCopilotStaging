public class TriggerOnConferenceHandler {

    List<Conference__c> conferenceList;
    public TriggerOnConferenceHandler (List<Conference__c> conferenceList)
    {
        this.conferenceList = conferenceList;
    }
    public void beforeInsert()
    {
        TriggerOnConferenceService.refreshConferencePanels(this.conferenceList);
    }
    public void beforeUpdate()
    {
        TriggerOnConferenceService.refreshConferencePanels(this.conferenceList);
    }
}