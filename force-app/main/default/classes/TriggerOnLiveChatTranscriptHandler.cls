public class TriggerOnLiveChatTranscriptHandler {
    List<LiveChatTranscript> chatTranscriptList;
    Map<Id, LiveChatTranscript> oldChatTranscriptMap;

    public TriggerOnLiveChatTranscriptHandler(List<LiveChatTranscript> chatTranscriptList, Map<Id, LiveChatTranscript> oldChatTranscriptMap)
    {
        this.chatTranscriptList = chatTranscriptList;
        this.oldChatTranscriptMap = oldChatTranscriptMap;
    }

    public void beforeInsert()
    {
        TriggerOnLiveChatTranscriptService.linkContactRecordToChatTranscript(chatTranscriptList,oldChatTranscriptMap);
    }
}