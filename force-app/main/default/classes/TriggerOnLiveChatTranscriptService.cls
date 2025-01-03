public class TriggerOnLiveChatTranscriptService {
    public static void linkContactRecordToChatTranscript(List<LiveChatTranscript> chatTranscriptList, Map<Id, LiveChatTranscript> oldChatTranscriptMap)
    {
        Set<String> usernames = new Set<String>();
        Map<String, String> usernameContactIdsMap = new Map<String,String>();
        for(LiveChatTranscript chatRecord : chatTranscriptList) {
            if(chatRecord.Username__c != '' && chatRecord.Username__c != NULL) {
                usernames.add(chatRecord.Username__c);                
            }
        }
        List<User> usersList = [SELECT Id, Name, Email, Username, ContactId 
                                FROM User WHERE Username IN :usernames];
        for(User userRecord : usersList) {
            usernameContactIdsMap.put(userRecord.Username, userRecord.ContactId);
        }
        for(LiveChatTranscript chatRecord : chatTranscriptList) {
            if(usernameContactIdsMap.containsKey(chatRecord.Username__c)) {
                chatRecord.ContactId = usernameContactIdsMap.get(chatRecord.Username__c);
            }
        }
    }
}