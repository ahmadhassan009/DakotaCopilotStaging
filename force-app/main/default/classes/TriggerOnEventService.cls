public class TriggerOnEventService {
    public static void provideAccessToAllUsers(List<Event> newEvents)
    { 
        Id eventRecordTypeId = Schema.getGlobalDescribe().get('Event').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Event').getRecordTypeId();
        User user = [SELECT is_community_user__c FROM User WHERE id=:UserInfo.getUserId() LIMIT 1];
        for(Event event: newEvents)
        {
            if(event.RecordTypeId == eventRecordTypeId)
            {
                if(user.is_community_user__c == true)
                {   
                    event.IsVisibleInSelfService = true;
                    event.Is_Community_Activity__c = true;
                }
            } 
        }
    }

    /**
     * DSC-772: Send Slack Notificaiton after Event Insert For Internal Users
     */
    public static void sendSlackNotificationAfterInsert(List<Event> newEvents) {
        for (Event event : newEvents) {
            if(event.Is_Community_Activity__c) {
                continue;
            }
            // Event created without API Timestamp, forward insert to slack
            if (event.API_Timestamp__c == null) {
                String payload = EventSlackTriggerUtils.serializeEvent('CREATE', event);
                System.enqueueJob(new EventSlackTriggerUtilsQueueable('callout:slack_app',payload));
            }
        }
    }

     /**
     * DSC-772: Send Slack Notificaiton after Event Update For Internal Users
     */
    public static void sendSlackNotificationAfterUpdate(List<Event> newEvents, Map<Id, Event> oldEventsMap) {
        for (Event event : newEvents) {
            if(event.Is_Community_Activity__c) {
                continue;
            }
            // Event updated and API Timestamp unchanged, forward update to slack
            if (event.API_Timestamp__c == oldEventsMap.get(event.Id).API_Timestamp__c) {
                String payload = EventSlackTriggerUtils.serializeEvent('UPDATE', event);
                System.enqueueJob(new EventSlackTriggerUtilsQueueable('callout:slack_app',payload));
            }
        }
        
    }

     /**
     * DSC-772: Send Slack Notificaiton after Event Delete For Internal Users
     */
    public static void sendSlackNotificationAfterDelete(List<Event> oldEvents) {
        for (Event event : oldEvents) {
            if(event.Is_Community_Activity__c) {
                continue;
            }
            String payload = EventSlackTriggerUtils.serializeEvent('DELETE', event);
            System.enqueueJob(new EventSlackTriggerUtilsQueueable('callout:slack_app',payload));
        }
    }

    /**
     * DSC-772: Refactor. Check is users is exists in custom settigns (Event Trigger Exception).
     * If yes, dont Queue job
     */
    public static Boolean checkIfUserExists() {
        List<User__c> users = User__c.getall().values(); // getting all list users in custom settings 'Event Trigger Exception'
        boolean userExists = false;
        for (User__c user: users) {
            if (user.User_id__c == UserInfo.getUserId()) { // checking if current user is part of list
                userExists = true;
            }
        }
        //if user exists then terminate the trigger
        if (userExists) {
            return true;
        }
        return false;
    } 
}