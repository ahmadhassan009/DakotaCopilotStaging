public class AdditionalInfoForBotMessage {
    public class PrechatInput{
        @InvocableVariable
        public String sChatKey;
        @InvocableVariable
        public String emailBody;
    }
    public class PrechatOutput{
        @InvocableVariable
        public String fullEmailMessage;
        @InvocableVariable
        public String emailSubject;
    }
    
    @InvocableMethod(label='Additional Info For Bot Message')
    public static List<PrechatOutput> addUserInfo(List<PrechatInput> inputParameters) {
        String sChatKey = null;
        String emailBody = '';
        String username = null;
        String fullEmailBody = 'Hi,\n\nYou’ve just received the following message from ';
        String emailSubject = 'Message from ';
        PrechatOutput outputParameter = new PrechatOutput();
        List<PrechatOutput> outputParameters = new List<PrechatOutput>();
        
        if(inputParameters!=null && inputParameters.size()>0)
        {
            if(inputParameters[0].sChatKey!=null)
            	sChatKey = inputParameters[0].sChatKey;
            if(inputParameters[0].emailBody!=null)
            emailBody = inputParameters[0].emailBody;
        }
        if (sChatKey != null && sChatKey != '')
        {
            List<LiveChatTranscript> transcripts = [SELECT Id,ContactId, Username__c
                                                    FROM LiveChatTranscript WHERE ChatKey = :sChatKey];
            if (transcripts!=null && transcripts.size() > 0)
            {
                username = transcripts[0].Username__c;
                if(username != null && username != '') {
                    List<User> chatUserInfo = [SELECT Id, Name, Email, Username, Userrole.name, Contact.Account.Name 
                                               FROM User WHERE Username =:username];
                    if (chatUserInfo!=null && chatUserInfo.size() > 0) {
                        String userRole = chatUserInfo[0].Userrole.name;
                        String linkedAccountName = chatUserInfo[0].Contact.Account.Name;
                        emailSubject = emailSubject + chatUserInfo[0].Name;
                        fullEmailBody = fullEmailBody + chatUserInfo[0].Name + ' at ' + linkedAccountName + '.';
                        fullEmailBody = fullEmailBody + '\n\n' + emailBody + '\n\nAdditional Information\nUser Full Name: ' + chatUserInfo[0].Name + '\nUser Email Address: ' + chatUserInfo[0].Email + '\nUsername: ' + chatUserInfo[0].Username + '\nUser Role: ' + userRole;
                    }
                } 
            }
        }
        
        outputParameter.emailSubject = emailSubject;
        outputParameter.fullEmailMessage = fullEmailBody;
        outputParameters.add(outputParameter);
        return outputParameters;
    }
}