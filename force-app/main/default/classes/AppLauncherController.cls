public without sharing class AppLauncherController {
    
    @AuraEnabled
    public static User updatePortalState(Id userId, String portalState) {
        
        List<User> currentUserInfo = [SELECT Id, Portal_State__c, Profile.UserType, Profile.Name FROM User WHERE Id =: userId LIMIT 1];
        if (currentUserInfo.size()>0)
        {
            Boolean isCurrentUserFlagConfigured = (currentUserInfo[0].Portal_State__c=='Marketplace2' && portalState=='marketplace2') ||
                (currentUserInfo[0].Portal_State__c=='MP 2.0' && portalState=='dakotaMarketplace');
            
            if(isCurrentUserFlagConfigured==false)
            {
                currentUserInfo[0].Portal_State__c=(portalState=='marketplace2' ? 'Marketplace2' : 'MP 2.0');
                
                if(currentUserInfo[0].Profile.UserType=='PowerCustomerSuccess') //To avoid update of Flag for Admin otherwise set Flag should be returned
                {
                    update currentUserInfo[0];
                }
            }
            
            //Update Public Group and Permission Set for Community User 
            /*if(currentUserInfo[0].Profile.UserType=='PowerCustomerSuccess')
            {
                if(currentUserInfo[0].Profile.Name=='MVP-RIA Customer Community')
                {
                    List<GroupMember> currentUserGroup = [SELECT ID from GroupMember where UserOrGroupId=:userId and
                                                          Group.Name='MVP-RIA View All Group'];
                    if(currentUserGroup.size()==0)
                    {
                        List<Group> groups = [Select Id from Group where Name='MVP-RIA View All Group'];
                        
                        if(groups.size()>0)
                        {                            
                            GroupMember gm = new GroupMember();
                            gm.UserOrGroupId = userId;
                            gm.GroupId = groups[0].Id;
                            insert gm;                
                        }            
                    }
                }
                else if(currentUserInfo[0].Profile.Name!='Marketplace User - Emerging Manager Membership' &&
                       currentUserInfo[0].Profile.Name!='Marketplace User - Platinum Membership' &&
                       currentUserInfo[0].Profile.Name!='Marketplace User - Premium Membership' &&
                       currentUserInfo[0].Profile.Name!='Marketplace User - Standard Membership' &&
                       currentUserInfo[0].Profile.Name!='Marketplace Lite Customer' &&
                       currentUserInfo[0].Profile.Name!='Dakota Customer Community') //(only for Dakota Customer, Everest Customer & MP/Everest Customer Community only)
                {
                    List<GroupMember> currentUserGroup = [SELECT ID, Group.Name from GroupMember where UserOrGroupId=:userId and
                                                          (Group.Name='Everest View All Group' or Group.Name='Dakota MP View All Group')];
                    User gDPRExemptUser = [SELECT ID, GDPR_Exempt__c from User where Id=:userId];
                    
                    Boolean isCurrentUserGroupConfigured = currentUserGroup.size()>0 && 
                        (
                            (currentUserGroup[0].Group.Name=='Everest View All Group' && portalState=='marketplace2') ||
                            (currentUserGroup[0].Group.Name=='Dakota MP View All Group' && portalState=='dakotaMarketplace')
                        );
                    if(isCurrentUserGroupConfigured==false && gDPRExemptUser.GDPR_Exempt__c ==false)
                    {
                        String groupName = (portalState=='marketplace2' ? 'Everest View All Group' : 'Dakota MP View All Group');
                        List<Group> groups = [Select Id from Group where Name=:groupName];
                        
                        if(groups.size()>0)
                        {
                            delete currentUserGroup;
                            
                            GroupMember gm = new GroupMember();
                            gm.UserOrGroupId = userId;
                            gm.GroupId = groups[0].Id;
                            insert gm;                
                        }            
                    }
                    
                    List<PermissionSetAssignment> currentUserPermissionSet = [SELECT ID, PermissionSet.Name from PermissionSetAssignment where AssigneeId=:userId and
                                                                              (PermissionSet.Name='Dakota_Customer_Community' or PermissionSet.Name='Everest_Customer_Community')];
                    Boolean isCurrentUserPermissionSetConfigured = currentUserPermissionSet.size()>0 && 
                        (
                            (currentUserPermissionSet[0].PermissionSet.Name=='Everest_Customer_Community' && portalState=='marketplace2') ||
                            (currentUserPermissionSet[0].PermissionSet.Name=='Dakota_Customer_Community' && portalState=='dakotaMarketplace')
                        );
                    if(isCurrentUserPermissionSetConfigured==false)
                    {
                        String permissionSetName = (portalState=='marketplace2' ? 'Everest_Customer_Community' : 'Dakota_Customer_Community');
                        List<PermissionSet> permissionSet = [Select Id from PermissionSet where Name=:permissionSetName];
                        
                        if(permissionSet.size()>0)
                        {                        
                            PermissionSetAssignment psa = new PermissionSetAssignment();
                            psa.AssigneeId = userId;
                            psa.PermissionSetId = permissionSet[0].Id;
                            Database.insert(psa, false);
                            
                            delete currentUserPermissionSet;
                            
                            updatePermissionSet(permissionSet[0].Id);
                        }            
                    }
                }*/
            //}
            
            return currentUserInfo[0];
        }
        
        return null;
    }
    
   /* @future
    public static void updatePermissionSet(Id permissionSetId) {
        PermissionSet permissionSet = new PermissionSet(Id = permissionSetId);
        update permissionSet;        
    }*/

    /**
     * Pop-up notification wrapper
     */
    public class PopUpNotificationFlags
    {
        @AuraEnabled public String MessagePopupType { get; set; }
        @AuraEnabled public Boolean PopUpFlag { get; set; }
        @AuraEnabled public Boolean popUpProcessed { get; set; }
    }

    /**
     * @description To check if message pop-up needs to be shown
     * @param  userId Current User Id to get the notification flags from User Preference Object
     * 
     * @param  PopUpNotificationFlags wrapper object with the popup type, flags value in User Preference Object
     */
    @AuraEnabled
    public static List<PopUpNotificationFlags> getMessagePopStatus(Id userId) {
        List<PopUpNotificationFlags> notificationFlagsList = new List<PopUpNotificationFlags>();
        User_Preference__c[] userPrefList = [SELECT Id, Name, Message_Popup__c, ENT_Notification_Flag__c FROM User_Preference__c WHERE User__c =: userId];

        //Events, Notes, Tasks Message notification to be shown before message (DSC-735)
        PopUpNotificationFlags entNotificationObj = new PopUpNotificationFlags();
        entNotificationObj.MessagePopupType = 'Events_Notes_Tasks_Notification__c';
        if(userPrefList.size() > 0 ){
            entNotificationObj.PopUpFlag = userPrefList[0].ENT_Notification_Flag__c;
        } else {
            entNotificationObj.PopUpFlag = false;
        }
        entNotificationObj.popUpProcessed = false;
        notificationFlagsList.add(entNotificationObj);

        //One time message notification
        PopUpNotificationFlags messageNotificationObj = new PopUpNotificationFlags();
        messageNotificationObj.MessagePopupType = 'Is_Message_Popup__c';
        if(userPrefList.size() > 0 ){
            messageNotificationObj.PopUpFlag = userPrefList[0].Message_Popup__c;
        } else {
            messageNotificationObj.PopUpFlag = false;
        }
        messageNotificationObj.popUpProcessed = false;
        notificationFlagsList.add(messageNotificationObj);

        return notificationFlagsList;
    }
}