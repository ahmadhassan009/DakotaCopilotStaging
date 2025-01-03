@isTest 
public class AppLauncherController_Test {
    @testSetup 
    public static void setupData() {
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            // Create Community User
            Account portalAccount = new Account(
                Name = 'Test Account'
            );
            
            insert portalAccount;
            
            //Create contact
            Contact contact = new Contact(
                FirstName = 'Test',
                Lastname = 'Community User',
                AccountId = portalAccount.Id
            );
            
            insert contact;
            
             
            Profile p = [SELECT Id from Profile WHERE Name = 'Dakota Customer Community']; 
            Test.startTest();
            User communityUser = new User(Alias = 'dcom', 
                                         Email ='communityuser@testorg.com', 
                                         EmailEncodingKey ='UTF-8',
                                         LastName ='Testing',
                                         LanguageLocaleKey ='en_US', 
                                         LocaleSidKey ='en_US',
                                         ProfileId = p.Id, 
                                         TimeZoneSidKey ='America/Los_Angeles',
                                         UserName ='communityuser@testorg.com',
                                         ContactId = contact.Id,
                                         Portal_State__c = 'MP 2.0',
                                         IsActive = true);
            
            insert communityUser;   
            Test.stopTest();
            
        }
    }
    
    @isTest
    public static void testUpdatePortalState() {
        User currentUser = new User(Id = UserInfo.getUserId(), Portal_State__c = 'MP 2.0');
        update currentUser;
        
        List<Group> groups = [Select Id from Group where Name = 'Dakota MP View All Group'];
        if(groups.size() > 0)
        { 
            GroupMember gm = new GroupMember();
            gm.UserOrGroupId = currentUser.Id;
            gm.GroupId = groups[0].Id;
            insert gm;  
        }
         
        //In context of Admin user
        System.assert(AppLauncherController.updatePortalState(currentUser.Id, 'marketplace2').Portal_State__c == 'Marketplace2');
        List<User> userInfo = [SELECT Id, Portal_State__c FROM User WHERE Id =: currentUser.Id LIMIT 1];
        System.assert(userInfo[0].Portal_State__c == 'MP 2.0');
        
        //In context of Community user
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true Limit 1];
        System.runAs(communityUser){
            System.assert(AppLauncherController.updatePortalState(communityUser.Id, 'marketplace2').Portal_State__c == 'Marketplace2');
            userInfo = [SELECT Id, Portal_State__c FROM User WHERE Id =: communityUser.Id and IsActive = true LIMIT 1];
            System.assert(userInfo[0].Portal_State__c == 'Marketplace2');
            
        }
    }
    @isTest
    public static void testGetMessagePopStatus() {
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id, UserRoleId from User where UserRoleId =: portalRole.Id Limit 1];
        System.RunAs(usr){
            User_Preference__c userPref = new User_Preference__c();
            userPref.Name = 'Test User Preference';
            userPref.Message_Popup__c = true;
            userPref.ENT_Notification_Flag__c = true;
            userPref.User__c = usr.Id;
            insert userPref;
           System.assert(AppLauncherController.getMessagePopStatus(usr.Id)[0].popUpProcessed == false);
        }
    }
}