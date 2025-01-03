@IsTest
public class TriggerOnLiveChatTranscriptService_Test {
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
    public static void testLinkContactRecordToChatTranscript() { 
        User usr = [Select Id,Username,ContactId from User where UserName = 'communityuser@testorg.com' Limit 1];
        LiveChatTranscript chatRecordAfter = [Select Id,Username__c, ContactId from LiveChatTranscript where ChatKey = '123123' Limit 1];
        System.assertEquals(chatRecordAfter.ContactId,usr.ContactId,'Contact Id is not updated in Chat Transcript record');
    }
}