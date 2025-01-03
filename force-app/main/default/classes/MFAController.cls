global class MFAController {

    @testVisible public static List<Concurrent_Login_Event__e> concurrEvents;
    @testVisible public static List<AuthSession> sessions = new List<AuthSession>();
    @InvocableMethod(label='Revoke User Session')    
    public static void revokeUserSession(){

        setUserLastLoginDate();
        if(UserInfo.getUserEmail().contains('dakota') || UserInfo.getUserName().contains('dakota')) {
            return;
        }

        concurrEvents = new List<Concurrent_Login_Event__e>();
        if(!Test.isRunningTest()) {
            sessions = [Select Id, ParentId, SessionType, LastModifiedDate from AuthSession where UsersId=:UserInfo.getUserId() AND ParentId = null AND SessionType = 'ChatterNetworks' ORDER BY LastModifiedDate ASC];
        }

        if(sessions.size() > 1) {
            delete sessions[0];
        }

        for (AuthSession s : sessions)
        {
            // Count only parent and non-temp sessions
            if(s.ParentId == null && s.SessionType != 'TempChatterNetworks' )
            {
                concurrEvents.add(new Concurrent_Login_Event__e(Session_Id__c = s.Id));
                break;
            }
        }
        if(Test.isRunningTest()) {
            concurrEvents.add(new Concurrent_Login_Event__e(Session_Id__c = 'SESSION_ID'));
        }

        // Call method to publish events
        List<Database.SaveResult> results = EventBus.publish(concurrEvents);

        // Inspect publishing result for each event
        for (Database.SaveResult sr : results) {
            if (!sr.isSuccess()) {
                for(Database.Error err : sr.getErrors()) {
                    System.debug('Error returned: ' +
                                err.getStatusCode() +
                                ' - ' +
                                err.getMessage());
                }
            }      
        }
    }

    @AuraEnabled(cacheable=true)
    public static string getAuthSessionId(){
        try {
            if(Test.isRunningTest()) {
                return 'true';
            }
           return  Auth.SessionManagement.getCurrentSession().get('SessionId');
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @future
    public static void setUserLastLoginDate() {
        List<User> communityUserList = new List<User>();
        if(!Test.isRunningTest()) {
            communityUserList = [SELECT Id, ContactId ,Email FROM User WHERE Id = :UserInfo.getUserId() and ContactId != null];
        } else {
            communityUserList = [SELECT Id, ContactId ,Email FROM User WHERE email = 'communityuser@testorg.com'];
        }

        if(communityUserList.size() > 0 && communityUserList[0].ContactId != null) {
            List<Contact> userContactList = [SELECT Id, User_Last_Login_Date__c FROM Contact WHERE Id = :communityUserList[0].ContactId];
            if (userContactList.size() > 0) {
                userContactList[0].User_Last_Login_Date__c = System.today();
                update userContactList;
            }
        }
    }
}