trigger TriggerOnLiveChatTranscript on LiveChatTranscript (before insert) {
    TriggerOnLiveChatTranscriptHandler handler = new TriggerOnLiveChatTranscriptHandler(Trigger.new, Trigger.oldMap);
    if(Trigger.isBefore)
    {
        if(Trigger.isInsert)
        {
            handler.beforeInsert();
        }
    }
}