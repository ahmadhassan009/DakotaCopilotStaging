@IsTest
public class BotPreChatController_Test {
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
        }
    }
    @isTest
    public static void testGetCurrentUser() { 
        User usr = [Select Id, Email, FirstName, LastName, Username from User where UserName = 'communityuser@testorg.com' Limit 1];
        System.RunAs(usr) {
            Map<String,Object> userInfo = new Map<String,Object>();
            userInfo.put('userId', usr.UserName);
            userInfo.put('firstName', usr.FirstName);
            userInfo.put('lastName', usr.LastName);
            userInfo.put('email', usr.Email);
            String expectedUserJson = JSON.serialize(userInfo);
            String currentUserInfo = BotPreChatController.getCurrentUser();
            System.assertEquals(expectedUserJson, currentUserInfo, 'Current user info is not as expected');
        }
    }
}