public with sharing class WelcomeMatController {

    /**
     * getCurrentUserName: returns list of string with User's first name at index 0 and is non-customer at next index
     */
    @AuraEnabled
    public static List< String > getCurrentUserName(Id userId) {
        List<String> userInfo = new List<String>();
        List< User > currentUserInfo = [SELECT Id, FirstName, ContactId, Email FROM User WHERE Id =: userId LIMIT 1];

        if(currentUserInfo.size() > 0 && currentUserInfo[0].Email!=null && !(currentUserInfo[0].Email.containsIgnoreCase('dakota'))) {
            String linkedContactId = currentUserInfo[0].ContactId;
            if(currentUserInfo[0].FirstName != '' && currentUserInfo[0].FirstName != null) {
                userInfo.add(currentUserInfo[0].FirstName);
            } else {
                userInfo.add('undefined');
            }
            // Check if the account is non-customer
            if(linkedContactId != '' && linkedContactId != null) {
                List<Contact> contactInfo = [SELECT Id, FirstName, Account.Id, Account.Active_Draft_Trial__c, Account.Trial_Start_Date__c FROM Contact WHERE Id =: linkedContactId LIMIT 1];
                if(contactInfo[0].Account.Active_Draft_Trial__c == true && contactInfo[0].Account.Trial_Start_Date__c != null) {
                    userInfo.add('true');
                } else {
                    userInfo.add('false');
                }
            } else {
                userInfo.add('false');
            }
        }
        else {
            return null;
        }
        return userInfo;
    }

    @AuraEnabled
    public static List<Welcome_Modal__mdt> getWelcomeMatMetadata(String matType) {
        List< Welcome_Modal__mdt > welcomeMatRecords = new List<Welcome_Modal__mdt>();
        List< Welcome_Modal__mdt > welcomeMatRighttRecord = new List<Welcome_Modal__mdt>();
        //if MatType is false return the  
        if(matType == 'false') {
            String leftPanelQuery = 'SELECT Welcome_Modal_Name__c, Is_WelcomeMatTitle__c, Description__c, Action_Name__c, Action_URL__c, Non_Customers_Agreement__c, Active__c ' +
                                    ' FROM Welcome_Modal__mdt ' +
                                    ' WHERE Active__c = true AND Is_WelcomeMatTitle__c = false AND Is_WelcomeMat_Active__c = true AND Non_Customers_Model__c = false AND Is_Message_Popup__c = false AND Events_Notes_Tasks_Notification__c = false';
            welcomeMatRecords = Database.query(leftPanelQuery);
        } else {
            String leftPanelQuery = 'SELECT Welcome_Modal_Name__c, Is_WelcomeMatTitle__c, Description__c, Action_Name__c, Action_URL__c, Non_Customers_Agreement__c, Active__c ' +
                                    ' FROM Welcome_Modal__mdt ' +
                                    ' WHERE Active__c = true AND Is_WelcomeMatTitle__c = false AND Is_WelcomeMat_Active__c = true AND Non_Customers_Model__c = true AND Is_Message_Popup__c = false AND Events_Notes_Tasks_Notification__c = false';
            welcomeMatRecords = Database.query(leftPanelQuery);
        }

        String welcomeMatRightRecords = 'SELECT Welcome_Modal_Name__c, Is_WelcomeMatTitle__c, Description__c, Action_Name__c, Action_URL__c, Active__c, Video_Order__c ' +
                                        ' FROM Welcome_Modal__mdt ' +
                                        ' WHERE Active__c = true AND Is_WelcomeMatTitle__c = true AND Is_WelcomeMat_Active__c = true AND Is_Message_Popup__c = false AND Events_Notes_Tasks_Notification__c = false ' +
                                        ' ORDER BY 	Video_Order__c ASC';
        welcomeMatRighttRecord = Database.query(welcomeMatRightRecords);
        for(Welcome_Modal__mdt welcomeRecord : welcomeMatRighttRecord)
        {
            welcomeMatRecords.add(welcomeRecord);
        }

        return welcomeMatRecords;
    }

    @AuraEnabled(cacheable=true) 
    public static Boolean getUserPreference(Id userId, Boolean flagType) {
        User_Preference__c[] userPrefList = [SELECT Id, Name, User__c, Don_t_show_WelcomeMat__c, Trial_Terms_of_Service_Click_wrap__c FROM User_Preference__c WHERE User__c =: userId LIMIT 1];
        if(userPrefList.size() > 0 && flagType && userPrefList[0].Trial_Terms_of_Service_Click_wrap__c == true)
        {
            return false;
        }
        if(userPrefList.size() > 0 && !flagType && userPrefList[0].Don_t_show_WelcomeMat__c == true)
        {
            return false;
        }
        
        return true;
    }

    /**
     * @description Save user preference for welcome/trial mat and popup message
     * @param  userId Id of the current user
     * @param  welcomeMatFlag Value of the flag to be set
     * @param  flagType true flag represent that non-customer / trial user flag is to be set. False represents welcome mat flag is to be set
     * 
     * @return  Boolean  
     */
    @AuraEnabled
    public static Boolean saveUserPreference(Id userId, Boolean welcomeMatFlag, Boolean flagType) {
        User_Preference__c[] userPrefList = [SELECT Id, Name, User__c, User__r.Name, Don_t_show_WelcomeMat__c, 	Trial_Terms_of_Service_Click_wrap__c, Message_Popup__c FROM User_Preference__c WHERE User__c =: userId];
        if(userPrefList.size() > 0) {
            for (User_Preference__c userPref : userPrefList) {
                userPref.Name = 'Preference for ' + userPref.User__r.Name;
                userPref.User__c = userId;
                //If flagType is true then non-customers checkbox is to be set
                if(flagType) {
                    userPref.Trial_Terms_of_Service_Click_wrap__c = welcomeMatFlag;
                } else if (!flagType) {
                    userPref.Don_t_show_WelcomeMat__c = welcomeMatFlag;
                }
            }
            upsert userPrefList;
        } else {
            User_Preference__c userPrefRecord = new User_Preference__c();
            userPrefRecord.Name = 'Preference for ' + userId;
            userPrefRecord.User__c = userId;
            //If flagType is true then non-customers checkbox is to be set
             if(flagType) {
                userPrefRecord.Trial_Terms_of_Service_Click_wrap__c = welcomeMatFlag;
            } else if (!flagType) {
                userPrefRecord.Don_t_show_WelcomeMat__c = welcomeMatFlag;
            }
            insert userPrefRecord;
        }
        return true;
    }

    /**
     * @description To get all the popup notifications metadata
     * @param  userId Current User Id to get the popup flags to return only the metadata that needs to be shown
     * 
     * @return  Map of popup type and welcome mat metadata
     */
    @AuraEnabled
    public static Map<String, Welcome_Modal__mdt> getPopupNotificationMetadata(Id userId) {
        List<AppLauncherController.PopUpNotificationFlags> notificationFlagsList = AppLauncherController.getMessagePopStatus(userId);
        Map<String, Welcome_Modal__mdt> notificationMetadata = new Map<String, Welcome_Modal__mdt>();
        for(AppLauncherController.PopUpNotificationFlags notif: notificationFlagsList) {
            // If notification flag is false then fetch the metadata for the respective notification
            if(!notif.PopUpFlag) {
                Welcome_Modal__mdt popupMetadata = new Welcome_Modal__mdt();
                String metadataQuery = 'SELECT Welcome_Modal_Name__c, Description__c, Active__c, Action_Name__c, Events_Notes_Tasks_Info__c, Non_Customers_Agreement__c, Action_URL__c '
                                        + ' FROM Welcome_Modal__mdt '
                                        + ' WHERE Active__c = true AND ' + notif.MessagePopupType + ' = true';
                popupMetadata = Database.query(metadataQuery);
                notificationMetadata.put(notif.MessagePopupType,popupMetadata);
            }
        }
        return notificationMetadata;
    }

    /**
     * @description To save the message popups flag in User Preference object
     * @param  userId Id of the user to save the preference
     * @param  popupMessageType the popup type to be checked against 'notificationsMap' map to get respective field API name
     * @param  flag true/false
     * 
     * @return  Boolean
     */
    @AuraEnabled
    public static Boolean saveMessagePopUpPreference(Id userId, String popupMessageType, Boolean flag) {
        User_Preference__c[] userPrefList = [SELECT Id, Name, User__c, User__r.Name, Message_Popup__c, ENT_Notification_Flag__c FROM User_Preference__c WHERE User__c =: userId];
        String fieldApiName;
        if(userPrefList.size() > 0) {
            for (User_Preference__c userPref : userPrefList) {
                userPref.Name = 'Preference for ' + userPref.User__r.Name;
                //Set the notification flag
                if(popupMessageType == 'Is_Message_Popup__c') {
                    userPref.Message_Popup__c = flag;
                } else if(popupMessageType == 'Events_Notes_Tasks_Notification__c') {
                    userPref.ENT_Notification_Flag__c = flag;
                }
            }
            upsert userPrefList;
        } else {
            User_Preference__c userPrefRecord = new User_Preference__c();
            userPrefRecord.Name = 'Preference for ' + userId;
            userPrefRecord.User__c = userId;
            //Set the notification flag
                if(popupMessageType == 'Is_Message_Popup__c') {
                    userPrefRecord.Message_Popup__c = flag;
                } else if(popupMessageType == 'Events_Notes_Tasks_Notification__c') {
                    userPrefRecord.ENT_Notification_Flag__c = flag;
                }
            insert userPrefRecord;
        }
        return true;
    }

    /**
     * @description: Check if Events, Tasks, Notes Access flag is true in user, only then show popup.
     * @param  userId Id of the current user
     * 
     * @return  Boolean
     */
    @AuraEnabled
    public static Boolean checkFlagInUser(Id userId){
        User[] userList = [ SELECT Id, Activities_Access__c FROM User WHERE Id =: userId ];
        if(userList.size() > 0) {
            if(userList[0].Activities_Access__c) {
                return true;
            }
        }
        return false;
    }
}