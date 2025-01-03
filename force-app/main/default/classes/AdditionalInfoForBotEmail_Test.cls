@IsTest
public class AdditionalInfoForBotEmail_Test {
    @testSetup
    public static void setup() {
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) {
            //Create Account
            Account portalAccount = new Account(
                Name = 'Test Account'
            );
            
            insert(portalAccount);
            
            //Create contact
            Contact portalContact = new Contact(
                FirstName = 'Test',
                Lastname = 'Community Contact',
                AccountId = portalAccount.Id
            );
            insert(portalContact);
            
            Profile p = [SELECT Id from Profile WHERE Name= 'Dakota Customer Community']; 
            User u = new User(Alias = 'dcom', 
                              Email = 'communityuser@testorg.com', 
                              EmailEncodingKey = 'UTF-8',
                              FirstName = 'Testing',
                              LastName = 'Community User',
                              LanguageLocaleKey = 'en_US', 
                              LocaleSidKey = 'en_US',
                              ProfileId = p.Id, 
                              TimeZoneSidKey = 'America/Los_Angeles',
                              UserName = 'communityuser@testorg.com',
                              ContactId = portalContact.Id,
                              IsActive = true);
            insert u; 
            LiveChatVisitor chatVisitorRecord = new LiveChatVisitor();
            insert chatVisitorRecord; 
            LiveChatTranscript chatRecord = new LiveChatTranscript(Username__c = u.Username,
                                                              ChatKey = '123123',
                                                              LiveChatVisitorId = chatVisitorRecord.Id);
            insert chatRecord;
        }
    }

    @IsTest
    public static void testAddAdditionalUserInfo() {
        List<AdditionalInfoForBotEmail.PrechatInput> inputParamsList = new List<AdditionalInfoForBotEmail.PrechatInput>();
        List<AdditionalInfoForBotEmail.PrechatOutput> outputParamsList = new List<AdditionalInfoForBotEmail.PrechatOutput>();
        AdditionalInfoForBotEmail.PrechatInput inputParams = new AdditionalInfoForBotEmail.PrechatInput();
        inputParams.sChatKey = '123123';
        inputParams.emailBody = 'This is test email body';
        inputParams.emailSubject = 'Test Email Subject';
        inputParamsList.add(inputParams);
        
        List<User> chatUserInfo = [SELECT Id, Name, Email, Username, Userrole.name, Contact.Account.Name 
                                      		FROM User WHERE Username = 'communityuser@testorg.com'];
        String userRole = chatUserInfo[0].Userrole.name;
        String linkedAccountName = chatUserInfo[0].Contact.Account.Name;
        String emailBody = 'Hi,\n\nYou’ve just received the following message from ' + chatUserInfo[0].Name + ' at ' + linkedAccountName + '.\n\nSubject: Test Email Subject';
        emailBody = emailBody +'\nThis is test email body\n\nAdditional Information\nUser Full Name: ' + chatUserInfo[0].Name + '\nUser Email Address: ' + chatUserInfo[0].Email + '\nUsername: ' + chatUserInfo[0].Username + '\nUser Role: ' + userRole;
        //String emailBody = 'Hello, This is test email body' + '\n\nUser Full Name: ' + chatUserInfo[0].Name + '\nUser Email Address: ' + chatUserInfo[0].Email + '\nUsername: ' + chatUserInfo[0].Username + '\nUser Role: ' + userRole;
        
        outputParamsList = AdditionalInfoForBotEmail.addAdditionalUserInfo(inputParamsList);
        System.assertEquals(outputParamsList[0].fullEmailMessage, emailBody,'Email body does not contain user information');
    }
}