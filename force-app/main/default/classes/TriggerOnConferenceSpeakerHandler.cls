public class TriggerOnConferenceSpeakerHandler {
    List<Conference_Speaker__c> conferenceSpeakerList;
    Map<ID, Conference_Speaker__c> oldConferenceSpeakerMap;
    public TriggerOnConferenceSpeakerHandler(List<Conference_Speaker__c> conferenceSpeakerList, Map<ID, Conference_Speaker__c> oldConferenceSpeakerMap) 
    {
        this.conferenceSpeakerList = conferenceSpeakerList;
        this.oldConferenceSpeakerMap = oldConferenceSpeakerMap;
    }
    public void beforeInsert()
    {
        TriggerOnConferenceSpeakerService.setconferenceSpeakerName(this.conferenceSpeakerList,this.oldConferenceSpeakerMap);
    }
    public void beforeUpdate()
    {
        TriggerOnConferenceSpeakerService.setconferenceSpeakerName(this.conferenceSpeakerList,this.oldConferenceSpeakerMap);
    }
}