public class AdditionalInfoForBotEmail {
    public class PrechatInput{
        @InvocableVariable
        public String sChatKey;
        @InvocableVariable
        public String emailBody;
        @InvocableVariable
        public String emailSubject;
    }
    public class PrechatOutput{
        @InvocableVariable
        public String fullEmailMessage;
    }
    
    @InvocableMethod(label='Additional Info For Bot Email')
    public static List<PrechatOutput> addAdditionalUserInfo(List<PrechatInput> inputParameters) {
        String sChatKey = inputParameters[0].sChatKey;
        String username = null;
        String emailBody = inputParameters[0].emailBody;
        String emailSubject = inputParameters[0].emailSubject;
        String fullEmailBody = 'Hi,\n\nYou’ve just received the following message from ';
        List<PrechatOutput> outputParameters = new List<PrechatOutput>();
        PrechatOutput outputParameter = new PrechatOutput();
        if (sChatKey != null && sChatKey != '')
        {
            List<LiveChatTranscript> transcripts = [SELECT Id,ContactId, Username__c
                                                    FROM LiveChatTranscript WHERE ChatKey = :sChatKey];
            if (transcripts.size() > 0)
            {
                username = transcripts[0].Username__c;
                if(username != null && username != '') {
                    List<User> chatUserInfo = [SELECT Id, Name, Email, Username, Userrole.name, Contact.Account.Name 
                                      		FROM User WHERE Username =:username];
                    if (chatUserInfo.size() > 0) {
                        String userRole = chatUserInfo[0].Userrole.name;
                        String linkedAccountName = chatUserInfo[0].Contact.Account.Name;
                        fullEmailBody = fullEmailBody + chatUserInfo[0].Name + ' at ' + linkedAccountName + '.\n\nSubject: ' + emailSubject;
                        fullEmailBody = fullEmailBody + '\n' + emailBody + '\n\nAdditional Information\nUser Full Name: ' + chatUserInfo[0].Name + '\nUser Email Address: ' + chatUserInfo[0].Email + '\nUsername: ' + chatUserInfo[0].Username + '\nUser Role: ' + userRole;
                    }
                } 
            }
        }
        outputParameter.fullEmailMessage = fullEmailBody;
        outputParameters.add(outputParameter);
        return outputParameters;
    }
}