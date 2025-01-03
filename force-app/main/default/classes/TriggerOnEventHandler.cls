public class TriggerOnEventHandler {
    List<Event> eventList;
    List<Event> oldEventList;
    Map<Id, Event> oldEventMap;
    
    public TriggerOnEventHandler(List<Event> eventList, List<Event> oldEventList, Map<Id, Event> oldEventMap)
    {
        this.eventList = eventList;
        this.oldEventList = oldEventList;
        this.oldEventMap = oldEventMap;
    }
    
    public void beforeInsert()
    {
       
        TriggerOnEventService.provideAccessToAllUsers(this.eventList);
    }
    public void afterInsert()
    {
        TriggerOnEventService.sendSlackNotificationAfterInsert(this.eventList);
    }
    public void afterUpdate()
    {
        TriggerOnEventService.sendSlackNotificationAfterUpdate(this.eventList, this.oldEventMap);
    }
    public void afterDelete()
    {
        TriggerOnEventService.sendSlackNotificationAfterDelete(this.oldEventList);
    }
    public Boolean checkIfUserExists()
    {
        return TriggerOnEventService.checkIfUserExists();

    }
    
}