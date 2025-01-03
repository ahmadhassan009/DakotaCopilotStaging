@isTest 
public class WelcomeMatController_Test {
    @isTest
    public static void testGetCurrentUserName() {
        List< User > currentUserInfo = [SELECT Id, FirstName,ContactId FROM User WHERE Id =: UserInfo.getUserId() LIMIT 1];
        List< String > currentUserInfoController = WelcomeMatController.getCurrentUserName(UserInfo.getUserId());
        System.assertEquals(currentUserInfo[0].FirstName,currentUserInfoController[0]);
        System.assertEquals('false',currentUserInfoController[1]);
    }
    
    @isTest
    public static void testGetWelcomeMatMetadata() {
        System.assert(WelcomeMatController.getWelcomeMatMetadata('true').size() > 0);
        System.assert(WelcomeMatController.getWelcomeMatMetadata('false').size() > 0);
    }
    
    @isTest
    public static void testSaveUserPreference() {
        String userId = UserInfo.getUserId();
        WelcomeMatController.saveUserPreference(userId, true, false);
        User_Preference__c[] userPrefList = [SELECT Id, Name, Don_t_show_WelcomeMat__c FROM User_Preference__c WHERE User__c =: userId];
        System.assert(userPrefList.size() > 0);

        // When user preference record exists
        User_Preference__c userPref = new User_Preference__c();
        userPref.Name = 'Preference for ' + userId;
        userPref.User__c = userId;
        userPref.Trial_Terms_of_Service_Click_wrap__c = false;
        insert userPref;
        
        WelcomeMatController.saveUserPreference(userId, true, true);
        User_Preference__c[] nonCustUserPrefList = [SELECT Id, Name, Trial_Terms_of_Service_Click_wrap__c FROM User_Preference__c WHERE User__c =: userId LIMIT 1];
        System.assertEquals(nonCustUserPrefList[0].Trial_Terms_of_Service_Click_wrap__c,true);

        WelcomeMatController.saveUserPreference(userId, true, false);
        User_Preference__c[] messagePopupPrefList = [SELECT Id,Don_t_show_WelcomeMat__c FROM User_Preference__c WHERE User__c =: userId LIMIT 1];
        System.assertEquals(messagePopupPrefList[0].Don_t_show_WelcomeMat__c,true);
    }
    @isTest
    public static void testGetUserPreference() {
        String userId = UserInfo.getUserId();
        User_Preference__c userPref = new User_Preference__c();
        userPref.Name = 'Preference for ' + userId;
        userPref.User__c = userId;
        userPref.Don_t_show_WelcomeMat__c = true;
        userPref.Trial_Terms_of_Service_Click_wrap__c = false;
        insert userPref;

        Boolean preference = WelcomeMatController.getUserPreference(userId, false);
        System.assertEquals(preference,false);
        Boolean nonCustomerPreference = WelcomeMatController.getUserPreference(userId, true);
        System.assertEquals(nonCustomerPreference,true);
    }

    @isTest
    public static void testGetPopupNotificationMetadata() {
        String userId = UserInfo.getUserId(); 
        User_Preference__c userPref = new User_Preference__c();
        userPref.Name = 'Preference for ' + userId;
        userPref.User__c = userId;
        userPref.Don_t_show_WelcomeMat__c = true;
        userPref.Trial_Terms_of_Service_Click_wrap__c = false;
        insert userPref;
        
        Map<String, Welcome_Modal__mdt> popupNotificationMetadata= WelcomeMatController.getPopupNotificationMetadata(userId);
        System.assert(popupNotificationMetadata.size() > 0);
    }
    
    @isTest
    public static void testSaveMessagePopUpPreference() {
        String userId = UserInfo.getUserId();      
        User_Preference__c userPref = new User_Preference__c();
        userPref.Name = 'Preference for ' + userId;
        userPref.User__c = userId;
        userPref.Don_t_show_WelcomeMat__c = true;
        userPref.Trial_Terms_of_Service_Click_wrap__c = false;
        insert userPref;
        
        Boolean isSaved= WelcomeMatController.saveMessagePopUpPreference(userId,'Is_Message_Popup__c',true);
        System.assert(isSaved == True);
        
        Boolean isSaved2= WelcomeMatController.saveMessagePopUpPreference(userId,'Events_Notes_Tasks_Notification__c',true);
        System.assert(isSaved2 == True);
    }

    @isTest
    public static void testCheckFlagInUser() {

        Boolean isChecked;
        String userId = UserInfo.getUserId();

        User[] userDetails =[ SELECT Id, Activities_Access__c FROM User WHERE Id =:userId ];
        userDetails[0].Activities_Access__c = true;
        update userDetails;
        isChecked = WelcomeMatController.checkFlagInUser(userId);
        System.assertEquals(true, isChecked);

        userDetails[0].Activities_Access__c = false;
        update userDetails;
        isChecked = WelcomeMatController.checkFlagInUser(userId);
        System.assertEquals(false, isChecked);
    }
}