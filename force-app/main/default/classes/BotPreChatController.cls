public class BotPreChatController {
    @auraenabled
    public static String getCurrentUser(){
        Map<String,Object> output = new Map<String,Object>();
        User u = [Select Username, FirstName, LastName, Email, contactId From User Where Id = :UserInfo.getUserId()];
        if(u.ContactId != null){
            output.put('userId', u.UserName);
            output.put('firstName', u.FirstName);
            output.put('lastName', u.LastName);
            output.put('email', u.Email);
        } else {
            output.put('userId', '');
        }
        return JSON.serialize(output);
    }
}