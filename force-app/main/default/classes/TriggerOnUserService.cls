public class TriggerOnUserService {
    /**
* DSC-282 : User license availability 
* Send Email Notification with URGENT in the subject if the no. of community user licenses are less than the threshold
*/
    static Integer communityUser = 0;
    static Integer totalLicense = 0;
    static Integer remainingLicense = 0;
    static Integer thresholdLicense = Integer.valueof(Label.communityUserLicenseThreshold);
    
    public static void checkUserLicense(){
        List<UserLicense> userLicense = [SELECT Name, TotalLicenses, UsedLicenses from UserLicense where Name='Customer Community Plus'];
        
        for(UserLicense item : userLicense){
            totalLicense = item.TotalLicenses;
            remainingLicense = item.TotalLicenses - item.UsedLicenses;
        } 
    }
    
    public static void updateUserInDakotaMPViewAllGroup(List<User> newUsers, Map<Id, User> oldUsersMap){
        List<GroupMember> groupMembersToBeAdded = new List<GroupMember>();
        List<GroupMember> groupMembersToBeRemoved = new List<GroupMember>();
        Set<Id> removeInactiveMarketplaceUsersIds = new Set<Id>();
        List<String> marketplaceProfiesList = new List<String> { 'Dakota Customer Community','Marketplace Lite Customer','Marketplace User - Emerging Manager Membership','Marketplace User - Platinum Membership','Marketplace User - Premium Membership','Marketplace User - Standard Membership' };
            Map<Id,Profile> MapOfMarketplaceProfies = new Map<Id, Profile>([SELECT Id, Name from Profile where Name IN :marketplaceProfiesList]);
        List<Group> dakotaMPViewAllGroup = [Select Id from Group where DeveloperName = 'Dakota_MP_View_All_Group'];
        List<User> allNewUsers = [SELECT Id,ContactId,IsActive, Contact.AccountId,X13F_Investments_Access__c, Profile.UserLicense.Name, ProfileId FROM User WHERE Id IN: newUsers];
        
        for (User commUser: allNewUsers) {        
            if (commUser.Profile.UserLicense.Name != 'Customer Community Login') {
                if (MapOfMarketplaceProfies.containsKey(commUser.profileId)
                    && commUser.profileId == MapOfMarketplaceProfies.get(commUser.profileId).Id 
                    && commUser.IsActive == true && 
                    ((Trigger.IsInsert) || (Trigger.IsUpdate 
                                            && (oldUsersMap.get(commUser.Id).IsActive == false || !MapOfMarketplaceProfies.containsKey(oldUsersMap.get(commUser.Id)?.profileId))))) {
                                                GroupMember gm = new GroupMember();
                                                gm.UserOrGroupId = commUser.id;
                                                gm.GroupId = dakotaMPViewAllGroup[0].Id;
                                                groupMembersToBeAdded.add(gm);
                                            } else if ((MapOfMarketplaceProfies.containsKey(commUser.profileId) && commUser.profileId == MapOfMarketplaceProfies.get(commUser.profileId).Id && commUser.IsActive == false && (Trigger.IsUpdate && oldUsersMap.get(commUser.Id).IsActive == true)) ||
                                                       (!MapOfMarketplaceProfies.containsKey(commUser.profileId) && (Trigger.IsUpdate && MapOfMarketplaceProfies.containsKey(oldUsersMap.get(commUser.Id)?.profileId) && MapOfMarketplaceProfies.get(oldUsersMap.get(commUser.Id)?.profileId).Id == oldUsersMap.get(commUser.Id)?.profileId))) {
                                                           removeInactiveMarketplaceUsersIds.add(commUser.id);
                                                       }
            }
        }
        if (removeInactiveMarketplaceUsersIds.size() > 0) {
            List<GroupMember> dakotaMPViewAllGroupMembers = [Select Id, Group.Name from GroupMember where UserOrGroupId In :removeInactiveMarketplaceUsersIds and Group.DeveloperName ='Dakota_MP_View_All_Group'];
            groupMembersToBeRemoved.addAll(dakotaMPViewAllGroupMembers);
        }
        
        if (groupMembersToBeAdded.size() > 0) {
            insert groupMembersToBeAdded;
        }
        if (groupMembersToBeRemoved.size() > 0) {
            delete groupMembersToBeRemoved;
        }
    }
    
    public static void updateUserInDakotaOCIOGroup(List<User> newUsers, Map<Id, User> oldUsersMap){
        List<GroupMember> groupMembersToBeAdded = new List<GroupMember>();
        List<GroupMember> groupMembersToBeRemoved = new List<GroupMember>();
        Set<Id> removeInactiveMarketplaceUsersIds = new Set<Id>();
        List<String> marketplaceProfiesList = new List<String> { 'Dakota OCIO Community' };
            Map<Id,Profile> MapOfMarketplaceProfies = new Map<Id, Profile>([SELECT Id, Name from Profile where Name IN :marketplaceProfiesList]);
        List<Group> dakotaMPViewAllGroup = [Select Id from Group where DeveloperName = 'OCIO_Community_User_Group'];
        List<User> allNewUsers = [SELECT Id,ContactId,IsActive, Contact.AccountId,X13F_Investments_Access__c, Profile.UserLicense.Name, ProfileId FROM User WHERE Id IN: newUsers];
        
        for (User commUser: allNewUsers) {        
            if (commUser.Profile.UserLicense.Name != 'Customer Community Login') {
                if (MapOfMarketplaceProfies.containsKey(commUser.profileId)
                    && commUser.profileId == MapOfMarketplaceProfies.get(commUser.profileId).Id 
                    && commUser.IsActive == true && 
                    ((Trigger.IsInsert) || (Trigger.IsUpdate 
                                            && (oldUsersMap.get(commUser.Id).IsActive == false || !MapOfMarketplaceProfies.containsKey(oldUsersMap.get(commUser.Id)?.profileId))))) {
                                                GroupMember gm = new GroupMember();
                                                gm.UserOrGroupId = commUser.id;
                                                gm.GroupId = dakotaMPViewAllGroup[0].Id;
                                                groupMembersToBeAdded.add(gm);
                                            } else if ((MapOfMarketplaceProfies.containsKey(commUser.profileId) && commUser.profileId == MapOfMarketplaceProfies.get(commUser.profileId).Id && commUser.IsActive == false && (Trigger.IsUpdate && oldUsersMap.get(commUser.Id).IsActive == true)) ||
                                                       (!MapOfMarketplaceProfies.containsKey(commUser.profileId) && (Trigger.IsUpdate && MapOfMarketplaceProfies.containsKey(oldUsersMap.get(commUser.Id)?.profileId) && MapOfMarketplaceProfies.get(oldUsersMap.get(commUser.Id)?.profileId).Id == oldUsersMap.get(commUser.Id)?.profileId))) {
                                                           removeInactiveMarketplaceUsersIds.add(commUser.id);
                                                       }
            }
        }
        if (removeInactiveMarketplaceUsersIds.size() > 0) {
            List<GroupMember> dakotaMPViewAllGroupMembers = [Select Id, Group.Name from GroupMember where UserOrGroupId In :removeInactiveMarketplaceUsersIds and Group.DeveloperName ='OCIO_Community_User_Group'];
            groupMembersToBeRemoved.addAll(dakotaMPViewAllGroupMembers);
        }
        
        if (groupMembersToBeAdded.size() > 0) {
            insert groupMembersToBeAdded;
        }
        if (groupMembersToBeRemoved.size() > 0) {
            delete groupMembersToBeRemoved;
        }
    }
    
    public static void communityUserThreshold(List<User> newUsers){
        
        List<Profile> prof = [SELECT Id, Name from Profile where Name='Dakota Customer Community' or Name='Dakota OCIO Community'];
        
        for(User commUser: newUsers){
            if(commUser.profileId == prof[0].Id){
                communityUser+=1;
            }
        }
        
        checkUserLicense();
        
        if(thresholdLicense >= remainingLicense && communityUser > 0) {
            UserLicenseNotification.sendUserLicenseNotificationEmail(true);
        }
    }
    
    /**
* DSC-708: Function set is community user checkbox and organization id of community user
*/
    public static void setCommunityUsersFields(List<User> newUsers,Map<Id, User> oldUserMap){
        //getting required fields for organization id
        List<User> allNewUsers = [SELECT Id,ContactId,IsActive, Contact.AccountId,X13F_Investments_Access__c, Profile.UserLicense.Name, ProfileId FROM User WHERE Id IN: newUsers];
        List<User> updateUserList = new List<User>();
        
        List<Id> contactList = new List<Id>();
        List<Boolean> contactIsActive = new List<Boolean>();
        
        for(User commUser: allNewUsers){
            if(commUser.Profile.UserLicense.Name == 'Customer Community Plus'){
                //DSC-708 logic to set field values here
                if(Trigger.isInsert)
                {
                    User usertoUpdate = new User(Id = commUser.Id, is_community_user__c = true, organization_ID__c = commUser.Contact.AccountId,Legacy_Record_Imported__c=true);
                    updateUserList.add(usertoUpdate);
                }
                // DSC-1086  -> Existing Marketplace Contacts to be removed from the GP dataset
                if(Trigger.isInsert || (Trigger.isUpdate && commUser.IsActive != oldUserMap.get(commUser.Id).IsActive) )
                {
                    contactList.add(commUser.ContactId);
                    contactIsActive.add(commUser.IsActive);
                } 
            }
        }
        if(updateUserList.size() > 0) {
            update updateUserList;
        }
        if(contactList.size()>0){
            updateContactsOfActiveCommunityuser(contactList,contactIsActive);
        }
    }
    
    public static void communityUserDeactivated(List<User> newUsers, Map<Id, User> oldUserMap){
        
        Boolean sendEmail = false;
        Map<Id, User> oldUsersMap = oldUserMap;
        List<Profile> prof = [SELECT Id, Name from Profile where Name='Dakota Customer Community'];
        
        
        for(User commUser: newUsers){
            if(commUser.profileId == prof[0].Id && oldUsersMap.containsKey(commUser.Id) && oldUsersMap.get(commUser.Id).IsActive == true && commUser.IsActive ==false){  
                sendEmail = true;
            }            
        }
        
        checkUserLicense();
        
        if(sendEmail == true && thresholdLicense >= remainingLicense){
            UserLicenseNotification.sendUserLicenseNotificationEmail(true);
        }
    }
    
    /**
* DSC-458 : Giving permission of searches/investment records based
* on the checkbox selected on user object
* DSC-849 : Giving access to 'DC Plan' type accounts based on checkbox on the user object
* */ 
    public static void givePermissionOfSearchesAndInvestmentObject(List<User> newUsers, Map<Id, User> oldUserMap)
    {
        Set<Id> removeSearchesAccessUserIds = new Set<Id>();
        Set<Id> removePublicInvestmentsUserIds = new Set<Id>();
        Set<Id> remove13FInvestmentsUserIds = new Set<Id>();
        //DSC-729 Events, Tasks, Notes Access
        Set<Id> removeActivitiesUserIds = new Set<Id>();
        // DSC-849 : Form 5500 Records access
        Set<Id> removeForm5500AccessUserIds = new Set<Id>();
        // DSC-1114 : Insurance Records access
        Set<Id> removeInsuranceRecordsAccessUserIds = new Set<Id>();
        // DSC-1140 : LP & GP(Investment Firm) Records access
        Set<Id> removeInvFirmRecordsAccessUserIds = new Set<Id>();
        
        Set<Id> giveSearchesAccessUserIds = new Set<Id>();
        Set<Id> givePublicInvestmentsUserIds = new Set<Id>();
        Set<Id> give13FInvestmentsUserIds = new Set<Id>();
        //DSC-729 Events, Tasks, Notes Access
        Set<Id> giveActivitiesUserIds = new Set<Id>();
        // DSC-849 : Form 5500 Records access
        Set<Id> giveForm5500AccessUserIds = new Set<Id>();
        // DSC-1114 : Insurance Records access
        Set<Id> giveInsuranceRecordsAccessUserIds = new Set<Id>();
        // DSC-1140 : LP & GP(Investment Firm) Records access
        Set<Id> giveInvFirmRecordsAccessUserIds = new Set<Id>();
        
        String errorMessage ='You cannot assign such permission to inactive users.';
        List<Id> acccountListToUpdate = new List<Id>();
        List<User> allNewUsers = [SELECT Id,AccountId, ContactId,IsActive,X13F_Investments_Access__c,Activities_Access__c,Searches_Access__c,LP_GP_Data_Access__c,
                                  Public_Investments_Access__c, Contact.AccountId, Profile.UserLicense.Name,Restrict_Access_of_Form_5500__c,Restrict_Insurance_Record_Access__c, ProfileId FROM User WHERE Id IN: newUsers];
        
        for(User u : allNewUsers)
        {
            if(u.Profile.UserLicense.Name != 'Customer Community Login')
            {
                if((Trigger.IsInsert || (Trigger.IsUpdate && u.Searches_Access__c != oldUserMap.get(u.Id).Searches_Access__c)) && u.Searches_Access__c == true)
                {
                    if(!u.IsActive)
                    {
                        u.addError(errorMessage);
                    }
                    else 
                    {
                        giveSearchesAccessUserIds.add(u.Id);                    
                    }
                }
                if((Trigger.IsInsert || (Trigger.IsUpdate && u.Public_Investments_Access__c != oldUserMap.get(u.Id).Public_Investments_Access__c)) && u.Public_Investments_Access__c == true)
                {
                    
                    if(!u.IsActive)
                    {
                        u.addError(errorMessage);
                    }
                    else 
                    {
                        givePublicInvestmentsUserIds.add(u.Id);                    
                    }
                }
                if((Trigger.IsInsert || (Trigger.IsUpdate && u.X13F_Investments_Access__c != oldUserMap.get(u.Id).X13F_Investments_Access__c)) && u.X13F_Investments_Access__c == true)
                {
                    if(!u.IsActive)
                    {
                        u.addError(errorMessage);
                    }
                    else 
                    {
                        give13FInvestmentsUserIds.add(u.Id);                    
                    }
                }
                //DSC-729 Adding users with checkbox unchecked for Activities and notes in add List
                if((Trigger.IsInsert || (Trigger.IsUpdate && u.Activities_Access__c != oldUserMap.get(u.Id).Activities_Access__c)) && u.Activities_Access__c == true)
                {
                    if(!u.IsActive)
                    {
                        u.addError(errorMessage);
                    }
                    else 
                    {
                        giveActivitiesUserIds.add(u.Id);                   
                    }
                }
                // DSC-849 : Form 5500 accounts access
                if((Trigger.IsInsert || (Trigger.IsUpdate && u.Restrict_Access_of_Form_5500__c != oldUserMap.get(u.Id).Restrict_Access_of_Form_5500__c)) && u.Restrict_Access_of_Form_5500__c == false)
                {
                    if(!u.IsActive)
                    {
                        u.addError(errorMessage);
                    }
                    else 
                    {
                        giveForm5500AccessUserIds.add(u.Id);                   
                    }
                }
                // DSC-1114 : Insurance Records access
                if((Trigger.IsInsert || (Trigger.IsUpdate && u.Restrict_Insurance_Record_Access__c != oldUserMap.get(u.Id).Restrict_Insurance_Record_Access__c)) && u.Restrict_Insurance_Record_Access__c == false)            
                {
                    if(!u.IsActive)
                    {
                        u.addError(errorMessage);
                    }
                    else 
                    {
                        
                        giveInsuranceRecordsAccessUserIds.add(u.Id);                   
                    }
                }
                // DSC-1140 : Investment Firm Records access
                if((Trigger.IsInsert || (Trigger.IsUpdate && u.LP_GP_Data_Access__c != oldUserMap.get(u.Id).LP_GP_Data_Access__c)) && u.LP_GP_Data_Access__c == true)
                {
                    if(!u.IsActive)
                    {
                        u.addError(errorMessage);
                    }
                    else 
                    {
                        giveInvFirmRecordsAccessUserIds.add(u.Id);                   
                    }
                }
                
                if(Trigger.IsUpdate && oldUserMap.get(u.Id).Searches_Access__c && u.Searches_Access__c == false)
                {
                    removeSearchesAccessUserIds.add(u.Id);
                }
                if(Trigger.IsUpdate && oldUserMap.get(u.Id).Public_Investments_Access__c && u.Public_Investments_Access__c == false)
                {
                    removePublicInvestmentsUserIds.add(u.Id);
                }
                if(Trigger.IsUpdate && oldUserMap.get(u.Id).X13F_Investments_Access__c && u.X13F_Investments_Access__c == false)
                {
                    remove13FInvestmentsUserIds.add(u.Id);
                }
                //DSC-729 Adding users with checkbox unchecked for Activities and notes in removal List
                if(Trigger.IsUpdate && oldUserMap.get(u.Id).Activities_Access__c && u.Activities_Access__c == false)
                {
                    removeActivitiesUserIds.add(u.Id);
                }
                // DSC-849 : Form 5500 accounts access
                if(Trigger.IsUpdate && oldUserMap.get(u.Id).Restrict_Access_of_Form_5500__c != u.Restrict_Access_of_Form_5500__c && u.Restrict_Access_of_Form_5500__c == true)
                {
                    removeForm5500AccessUserIds.add(u.Id);
                }
                // DSC-1114 : Insurance Records access
                if(Trigger.IsUpdate && u.Restrict_Insurance_Record_Access__c != oldUserMap.get(u.Id).Restrict_Insurance_Record_Access__c && u.Restrict_Insurance_Record_Access__c == true)
                {
                    removeInsuranceRecordsAccessUserIds.add(u.Id);
                }
                // DSC-1140 : LP & GP(Investment Firm) Records access
                if(Trigger.IsUpdate && oldUserMap.get(u.Id).LP_GP_Data_Access__c && u.LP_GP_Data_Access__c == false)
                {
                    removeInvFirmRecordsAccessUserIds.add(u.Id);
                }
                
                if(u.AccountId != null && u.isActive == true) {
                    if(Trigger.isInsert || (Trigger.isUpdate && oldUserMap.get(u.Id)!= null  &&  (u.Restrict_Access_of_Form_5500__c != oldUserMap.get(u.Id).Restrict_Access_of_Form_5500__c) || (u.Restrict_Insurance_Record_Access__c != oldUserMap.get(u.Id).Restrict_Insurance_Record_Access__c))){
                        acccountListToUpdate.add(u.AccountId);
                    }
                }
            }
        }
        
        triggerDCICallout(acccountListToUpdate);
        //updateForm5500checkboxDCI(acccountListToUpdate);
        List<PermissionSetAssignment> permissionSetToBeAssigned = new List<PermissionSetAssignment>();
        List<PermissionSetAssignment> permissionSetToBeRemoved = new List<PermissionSetAssignment>();
        List<GroupMember> groupMembersToBeAdded = new List<GroupMember>();
        List<GroupMember> groupMembersToBeRemoved = new List<GroupMember>();
        
        if(giveSearchesAccessUserIds.size() > 0)
        {
            List<PermissionSet> searchesPermissionSet = [Select Id,Name from PermissionSet where Name = 'Marketplace_Searches_Permission'];
            List<PermissionSetAssignment> existingAssignees = [Select Id,AssigneeId from PermissionSetAssignment where PermissionSet.Name='Marketplace_Searches_Permission'];
            Set<Id> existingUserIds = new Set<Id>();
            for(PermissionSetAssignment assignees : existingAssignees)
            {
                existingUserIds.add(assignees.AssigneeId);
            }
            if(searchesPermissionSet.size() > 0)
            {
                
                for(Id userId : giveSearchesAccessUserIds)
                {
                    if(!existingUserIds.contains(userId))
                    {
                        PermissionSetAssignment pma = new PermissionSetAssignment();
                        pma.AssigneeId = userId;
                        pma.PermissionSetId = searchesPermissionSet[0].Id;
                        permissionSetToBeAssigned.add(pma);
                    }
                }
            }
        }
        
        if(givePublicInvestmentsUserIds.size() > 0)
        {
            List<Group> publicInvestmentGroup = [Select Id from Group where DeveloperName = 'Public_Investments_Group'];
            
            if(publicInvestmentGroup.size() > 0)
            {
                for(Id userId : givePublicInvestmentsUserIds)
                {
                    GroupMember gm = new GroupMember();
                    gm.UserOrGroupId = userId;
                    gm.GroupId = publicInvestmentGroup[0].Id;
                    groupMembersToBeAdded.add(gm);
                }
            }
            
            List<PermissionSet> publicInvestmentPermissionSet = [Select Id from PermissionSet where Name = 'Public_Investment_Permission'];
            List<PermissionSetAssignment> existingAssignees = [Select Id,AssigneeId from PermissionSetAssignment where PermissionSet.Name='Public_Investment_Permission'];
            Set<Id> existingUserIds = new Set<Id>();
            for(PermissionSetAssignment assignees : existingAssignees)
            {
                existingUserIds.add(assignees.AssigneeId);
            }
            if(publicInvestmentPermissionSet.size() > 0)
            {
                for(Id userId : givePublicInvestmentsUserIds)
                {
                    if(!existingUserIds.contains(userId))
                    {
                        PermissionSetAssignment pma = new PermissionSetAssignment();
                        pma.AssigneeId = userId;
                        pma.PermissionSetId = publicInvestmentPermissionSet[0].Id;
                        permissionSetToBeAssigned.add(pma);
                    }
                }
            }
        }
        
        if(give13FInvestmentsUserIds.size() > 0)
        {
            List<Group> X_13FInvestmentGroup = [Select Id from Group where DeveloperName = 'X13F_Filing_Investments'];
            if(X_13FInvestmentGroup.size() > 0)
            {
                for(Id userId : give13FInvestmentsUserIds)
                {
                    GroupMember gm = new GroupMember();
                    gm.UserOrGroupId = userId;
                    gm.GroupId = X_13FInvestmentGroup[0].Id;
                    groupMembersToBeAdded.add(gm);
                }
            }
            
            List<PermissionSet> X_13FInvestmentPermissionSet = [Select Id,Name from PermissionSet where Name = 'X13F_Filings_Permissions'];
            List<PermissionSetAssignment> existingAssignees = [Select Id,AssigneeId from PermissionSetAssignment where PermissionSet.Name='X13F_Filings_Permissions'];
            Set<Id> existingUserIds = new Set<Id>();
            for(PermissionSetAssignment assignees : existingAssignees)
            {
                existingUserIds.add(assignees.AssigneeId);
            }
            if(X_13FInvestmentPermissionSet.size() > 0)
            {
                for(Id userId : give13FInvestmentsUserIds)
                {
                    if(!existingUserIds.contains(userId))
                    {
                        PermissionSetAssignment pma = new PermissionSetAssignment();
                        pma.AssigneeId = userId;
                        pma.PermissionSetId = X_13FInvestmentPermissionSet[0].Id;
                        permissionSetToBeAssigned.add(pma);
                    }
                }
            }
        }
        //DSC-729 Giving Activities Access
        if(giveActivitiesUserIds.size() > 0)
        {
            List<PermissionSet> activitiesPermissionSet = [Select Id,Name from PermissionSet where Name = 'Activities_Permission'];
            List<PermissionSetAssignment> existingAssignees = [Select Id,AssigneeId from PermissionSetAssignment where PermissionSet.Name='Activities_Permission'];
            Set<Id> existingUserIds = new Set<Id>();
            for(PermissionSetAssignment assignees : existingAssignees)
            {
                existingUserIds.add(assignees.AssigneeId);
            }
            if(activitiesPermissionSet.size() > 0)
            {
                for(Id userId : giveActivitiesUserIds)
                {
                    if(!existingUserIds.contains(userId))
                    {
                        PermissionSetAssignment pma = new PermissionSetAssignment();
                        pma.AssigneeId = userId;
                        pma.PermissionSetId = activitiesPermissionSet[0].Id;
                        permissionSetToBeAssigned.add(pma);
                    }
                }
            }
        }
        
        // DSC-849 : Form 5500 accounts access
        // DSC-921 : Plan Admin Contacts access
        if(giveForm5500AccessUserIds.size() > 0)
        {
            List<Group> form5500RecordsGroup = [Select Id from Group where DeveloperName = 'Form_5500_Records_Group'];
            if(form5500RecordsGroup.size() > 0)
            {
                for(Id userId : giveForm5500AccessUserIds)
                {
                    GroupMember gm = new GroupMember();
                    gm.UserOrGroupId = userId;
                    gm.GroupId = form5500RecordsGroup[0].Id;
                    groupMembersToBeAdded.add(gm);
                }
            }
        }
        
        // DSC-1114 : Insurance Records access
        if(giveInsuranceRecordsAccessUserIds.size() > 0)
        {
            List<Group> insuranceRecordsGroup = [Select Id from Group where DeveloperName = 'Insurance_Records_Access_Group'];
            if(insuranceRecordsGroup.size() > 0)
            {
                for(Id userId : giveInsuranceRecordsAccessUserIds)
                {
                    GroupMember gm = new GroupMember();
                    gm.UserOrGroupId = userId;
                    gm.GroupId = insuranceRecordsGroup[0].Id;
                    groupMembersToBeAdded.add(gm);
                }
            }
        }
        
        // DSC-1140 : LP & GP(Investment Firm) Records access
        if(giveInvFirmRecordsAccessUserIds.size() > 0)
        {
            List<Group> invFirmRecordsGroup = [Select Id from Group where DeveloperName = 'LP_GP_Data_Access_Group'];
            if(invFirmRecordsGroup.size() > 0)
            {
                for(Id userId : giveInvFirmRecordsAccessUserIds)
                {
                    GroupMember gm = new GroupMember();
                    gm.UserOrGroupId = userId;
                    gm.GroupId = invFirmRecordsGroup[0].Id;
                    groupMembersToBeAdded.add(gm);
                }
            }
            
            List<PermissionSet> invFirmPermissionSet = [Select Id,Name from PermissionSet where Name = 'LP_and_GP_Fields_Access'];
            List<PermissionSetAssignment> existingAssignees = [Select Id,AssigneeId from PermissionSetAssignment where PermissionSet.Name='LP_and_GP_Fields_Access'];
            Set<Id> existingUserIds = new Set<Id>();
            for(PermissionSetAssignment assignees : existingAssignees)
            {
                existingUserIds.add(assignees.AssigneeId);
            }
            if(invFirmPermissionSet.size() > 0)
            {
                for(Id userId : giveInvFirmRecordsAccessUserIds)
                {
                    if(!existingUserIds.contains(userId))
                    {
                        PermissionSetAssignment pma = new PermissionSetAssignment();
                        pma.AssigneeId = userId;
                        pma.PermissionSetId = invFirmPermissionSet[0].Id;
                        permissionSetToBeAssigned.add(pma);
                    }
                }
            }
        }
        
        if(removeSearchesAccessUserIds.size() > 0)
        {
            List<PermissionSetAssignment> searchesPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId In :removeSearchesAccessUserIds and
                                                                            PermissionSet.Name='Marketplace_Searches_Permission'];
            permissionSetToBeRemoved.addAll(searchesPermissionSetAssignees);
        }
        if(removePublicInvestmentsUserIds.size() > 0)
        {
            List<GroupMember> publicInvestmentGroupMembers = [Select Id, Group.Name from GroupMember where UserOrGroupId In :removePublicInvestmentsUserIds and Group.DeveloperName ='Public_Investments_Group'];
            groupMembersToBeRemoved.addAll(publicInvestmentGroupMembers);
            
            List<PermissionSetAssignment> publicInvstPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId In :removePublicInvestmentsUserIds and
                                                                               PermissionSet.Name='Public_Investment_Permission'];
            permissionSetToBeRemoved.addAll(publicInvstPermissionSetAssignees);
        }
        
        if(remove13FInvestmentsUserIds.size() > 0)
        {
            List<GroupMember> X_13FInvestmentGroupMembers = [Select Id, Group.Name from GroupMember where UserOrGroupId In :remove13FInvestmentsUserIds and Group.DeveloperName = 'X13F_Filing_Investments'];
            groupMembersToBeRemoved.addAll(X_13FInvestmentGroupMembers);
            
            List<PermissionSetAssignment> X_13FPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId In :remove13FInvestmentsUserIds and
                                                                         PermissionSet.Name='X13F_Filings_Permissions'];
            permissionSetToBeRemoved.addAll(X_13FPermissionSetAssignees);
        }
        
        //DSC-729 Removing Activities Access
        if(removeActivitiesUserIds.size() > 0)
        {
            List<PermissionSetAssignment> activitiesPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId In :removeActivitiesUserIds and
                                                                              PermissionSet.Name='Activities_Permission'];
            permissionSetToBeRemoved.addAll(activitiesPermissionSetAssignees);
        }
        // DSC-849 : Form 5500 accounts access
        // DSC-921 : Plan Admin contacts access revoke
        if(removeForm5500AccessUserIds.size() > 0)
        {
            List<GroupMember> form5500RecordsGroupMembers = [Select Id, Group.Name from GroupMember where UserOrGroupId In :removeForm5500AccessUserIds and Group.DeveloperName ='Form_5500_Records_Group'];
            groupMembersToBeRemoved.addAll(form5500RecordsGroupMembers);
        }
        
        // DSC-1114 : Insurance Records access revoke
        if(removeInsuranceRecordsAccessUserIds.size() > 0)
        {
            List<GroupMember> insuranceRecordsGroup = [Select Id, Group.Name from GroupMember where UserOrGroupId In :removeInsuranceRecordsAccessUserIds and Group.DeveloperName ='Insurance_Records_Access_Group'];
            groupMembersToBeRemoved.addAll(insuranceRecordsGroup);
        }
        
        // DSC-1140 : LP & GP(Investment Firm) Records access
        if(removeInvFirmRecordsAccessUserIds.size() > 0)
        {
            List<GroupMember> investmentFirmRecordsGroup = [Select Id, Group.Name from GroupMember where UserOrGroupId In :removeInvFirmRecordsAccessUserIds and Group.DeveloperName ='LP_GP_Data_Access_Group'];
            groupMembersToBeRemoved.addAll(investmentFirmRecordsGroup);
            
            List<PermissionSetAssignment> invFirmPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId In :removeInvFirmRecordsAccessUserIds and
                                                                           PermissionSet.Name='LP_and_GP_Fields_Access'];
            permissionSetToBeRemoved.addAll(invFirmPermissionSetAssignees);
        }
        
        
        if(permissionSetToBeAssigned.size() > 0) {
            insert permissionSetToBeAssigned;
        }
        if(permissionSetToBeRemoved.size() > 0) {
            delete permissionSetToBeRemoved;
        }
        if(groupMembersToBeAdded.size() > 0) {
            insert groupMembersToBeAdded;
        }
        if(groupMembersToBeRemoved.size() > 0) {
            delete groupMembersToBeRemoved;
        }
    }
    
    public static void giveAccessOfInvestmentRecords(List<User> newUsers, Map<Id, User> oldUserMap)
    {
        Map<Id,Profile> communityProfiles= new Map<Id,Profile>([SELECT Id,Name from Profile where 
                                                                Name = 'Marketplace User - Premium Membership' or Name = 'Marketplace User - Emerging Manager Membership' or
                                                                Name = 'Marketplace User - Platinum Membership' or Name = 'Marketplace User - Standard Membership' or
                                                                Name = 'Dakota Customer Community' or Name = 'Marketplace Lite Customer']);
        Map<Id,String> profileNameToId = new Map<Id,String>();
        for(Profile pf : communityProfiles.values())
        {
            profileNameToId.put(pf.Id,pf.Name);
        }
        
        List<User> giveInvestmentsAccessUsers = new List<User>();
        Set<Id> remove13FInvestmentsAccessUsers = new Set<Id>();
        Set<Id> removePublicInvestmentsAccessUsers = new Set<Id>();
        List<GroupMember> groupMembersToBeAdded = new List<GroupMember>();
        List<GroupMember> groupMembersToBeRemoved = new List<GroupMember>();
        List<User> allNewUsers = [SELECT Id,ContactId,IsActive,X13F_Investments_Access__c,Public_Investments_Access__c, Contact.AccountId, Profile.UserLicense.Name, ProfileId FROM User WHERE Id IN: newUsers];
        
        for(User u : allNewUsers)
        {
            if(u.Profile.UserLicense.Name != 'Customer Community Login')
            {
                if((Trigger.IsInsert || (Trigger.IsUpdate && u.ProfileId != oldUserMap.get(u.Id).ProfileId)) &&
                   (profileNameToId.get(u.ProfileId) == 'Marketplace User - Premium Membership' || profileNameToId.get(u.ProfileId) == 'Marketplace User - Platinum Membership' ||
                    profileNameToId.get(u.ProfileId) == 'Dakota Customer Community'))
                {
                    giveInvestmentsAccessUsers.add(u);
                    if(Trigger.IsUpdate && profileNameToId.get(u.ProfileId) == 'Dakota Customer Community' && u.X13F_Investments_Access__c == false)
                    {
                        remove13FInvestmentsAccessUsers.add(u.Id);
                    }
                }
                else if(Trigger.IsUpdate && u.ProfileId != oldUserMap.get(u.Id).ProfileId &&
                        (profileNameToId.get(u.ProfileId) == 'Marketplace User - Emerging Manager Membership' || profileNameToId.get(u.ProfileId) == 'Marketplace User - Standard Membership' || profileNameToId.get(u.ProfileId) == 'Marketplace Lite Customer')&&
                        (profileNameToId.get(oldUserMap.get(u.Id).ProfileId) == 'Marketplace User - Premium Membership' || profileNameToId.get(oldUserMap.get(u.Id).ProfileId) == 'Marketplace User - Platinum Membership' ||
                         profileNameToId.get(oldUserMap.get(u.Id).ProfileId) == 'Dakota Customer Community')){
                             if(u.Public_Investments_Access__c == false) 
                             {
                                 removePublicInvestmentsAccessUsers.add(u.Id);
                             }
                             if(u.X13F_Investments_Access__c == false) 
                             {
                                 remove13FInvestmentsAccessUsers.add(u.Id);
                             }
                         }
            }
        }
        
        if(giveInvestmentsAccessUsers.size() > 0)
        {
            List<Group> publicInvestmentGroup = [Select Id from Group where DeveloperName = 'Public_Investments_Group'];
            List<Group> X_13FInvestmentGroup = [Select Id from Group where DeveloperName = 'X13F_Filing_Investments'];
            for(User usr : giveInvestmentsAccessUsers)
            {
                GroupMember publicGM = new GroupMember();
                publicGM.UserOrGroupId = usr.Id;
                publicGM.GroupId = publicInvestmentGroup[0].Id;
                groupMembersToBeAdded.add(publicGM);
                
                if(profileNameToId.get(usr.ProfileId) != 'Dakota Customer Community')
                {
                    GroupMember X13F_FilingGM = new GroupMember();
                    X13F_FilingGM.UserOrGroupId = usr.Id;
                    X13F_FilingGM.GroupId = X_13FInvestmentGroup[0].Id;
                    groupMembersToBeAdded.add(X13F_FilingGM);
                }
            }
        }
        
        if(removePublicInvestmentsAccessUsers.size() > 0)
        {
            List<GroupMember> publicInvestmentGroupMembers = [Select Id, Group.Name from GroupMember where UserOrGroupId In :removePublicInvestmentsAccessUsers and Group.DeveloperName ='Public_Investments_Group'];
            groupMembersToBeRemoved.addAll(publicInvestmentGroupMembers);
        }
        
        if(remove13FInvestmentsAccessUsers.size() > 0)
        {
            List<GroupMember> X_13FInvestmentGroupMembers = [Select Id, Group.Name from GroupMember where UserOrGroupId In :remove13FInvestmentsAccessUsers and Group.DeveloperName = 'X13F_Filing_Investments'];
            groupMembersToBeRemoved.addAll(X_13FInvestmentGroupMembers);
        }
        
        if(groupMembersToBeRemoved.size() > 0)
        {
            delete groupMembersToBeRemoved;
        }
        if(groupMembersToBeAdded.size() > 0)
        {
            insert groupMembersToBeAdded;
        }
    }
    
    public static void getNewUpdatedUsersForWelcomeEmail(Boolean isUpdated, List<User> newUsers, Map<Id, User> newUserMap, Map<Id, User> oldUserMap)
    {
        Boolean isActive = false;
        List<Id> newUpdatedUsers = new List<Id>();
        Map<Id,String> mapOfProfileIdToName = new Map<Id,String>();
        Map<Id,String> mapOfProfileIdToLicenseName = new Map<Id,String>();
        List<User> allNewUsers = [SELECT Id,ContactId,IsActive,Profile.Name,Email_Sent__c,LastLoginDate, Contact.AccountId, Profile.UserLicense.Name, ProfileId FROM User WHERE Id IN: newUsers];
        Set<Id> profileIDs = new Set<Id>();
        
        if(Trigger.isUpdate)
        {
            for(User usr: oldUserMap.values())
            {
                profileIDs.add(usr.ProfileId);
            }
            
            List<Profile> profiles = [SELECT Id,Name,UserLicense.Name FROM Profile WHERE Id In :profileIDs];
            for(Profile prof : profiles)
            {
                mapOfProfileIdToName.put(prof.Id,prof.Name);
                mapOfProfileIdToLicenseName.put(prof.Id,prof.UserLicense.Name);
            }
        }
        
        
        List<String> customerCommunityProfiles = new List<String>{
            'Dakota Customer Community',
                'Marketplace User - Emerging Manager Membership',
                'Marketplace User - Platinum Membership',
                'Marketplace User - Premium Membership',
                'Marketplace User - Standard Membership',
                'Marketplace Lite Customer',
                'Dakota OCIO Community'
                };  
                    
                if(isUpdated)   //if the user is activated
                {
                    for(User usr: allNewUsers)
                    {
                        if((( Trigger.isInsert || 
                             ((Trigger.isUpdate) && 
                              (usr.isActive != oldUserMap.get(usr.Id).isActive) || 
                              (usr.Profile.name != mapOfProfileIdToName.get(oldUserMap.get(usr.Id).profileId) && customerCommunityProfiles.contains(usr.Profile.name) && !customerCommunityProfiles.contains(mapOfProfileIdToName.get(oldUserMap.get(usr.Id).profileId)) && (usr.Email_Sent__c == false && usr.LastLoginDate ==null))))) && 
                           usr.isActive == true && customerCommunityProfiles.contains(usr.Profile.name))
                        {
                            newUpdatedUsers.add(usr.Id);
                        }
                    }
                } else {
                    for(User usr: newUsers) //if the user is newly created
                    {
                        newUpdatedUsers.add(usr.Id);
                    }
                }
        if(newUpdatedUsers.size()> 0) {
            sendWelcomeEmailToCommunityUsers(newUpdatedUsers, isUpdated);
        }
    }
    
    @future
    public static void sendWelcomeEmailToCommunityUsers(List<Id> newUpdatedUsers, Boolean isUpdated)
    {
        List<String> emailTemplateNames = new List<String>{
            'CommunityWelcomeEmailTemplateMarketplace',
            'CommunityWelcomeEmailTemplateResearch',
            'Custom_Welcome_Email_for_MP_Trial_Users',
            'Custom_Welcome_Email_for_Research_Trial_Users',
            'CommunityWelcomeEmailTemplatePortfolio',
            'Custom_Welcome_Email_for_Portfolio_Trial_Users'
        };
        List<EmailTemplate> communityUserEmailTemplates = [SELECT Id, Name, Subject, Description, HtmlValue, DeveloperName, Body FROM EmailTemplate 
                                                            WHERE DeveloperName IN :emailTemplateNames];

        Map<String, EmailTemplate> emailTemplateMap = new Map<String, EmailTemplate>();
        for(EmailTemplate emailTemplate : communityUserEmailTemplates) {
            emailTemplateMap.put(emailTemplate.DeveloperName, emailTemplate);
        }

        EmailTemplate emailTemplate = emailTemplateMap.get('CommunityWelcomeEmailTemplateMarketplace');
        EmailTemplate emailTemplate2 = emailTemplateMap.get('Custom_Welcome_Email_for_MP_Trial_Users');
        
        List<User> allNewUsers = [SELECT Id, Name, UserName, Email, isActive, ContactId, Contact.Firstname, Contact.Lastname, Contact.AccountId , ProfileId, Profile.Name,LastLoginDate
                                  FROM User WHERE Id IN: newUpdatedUsers];
        
        List<Id> accountIDs = new List<Id>();
        List<User> marketplaceUsers = new List<User>();
        
        for (User usr: allNewUsers)
        {
            accountIDs.add(usr.Contact.AccountId);
            marketplaceUsers.add(usr);
        }
        
        Map<Id, Account> accMap =new Map<Id, Account>( [SELECT Id, Name, Trial_Start_Date__c, Active_Draft_Trial__c FROM Account WHERE Id IN: accountIDs]);

        Messaging.SingleEmailMessage[] messages = new List<Messaging.SingleEmailMessage>();
        try {
            
            if(emailTemplate != null)
            {
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                
                Boolean isTrial = false;
                List<String> receiverEmails = new List<String>();
                for(User usr: marketplaceUsers)
                {
                    Boolean isResearch = (usr.Profile?.Name =='Dakota Research Community' || usr.Profile?.Name =='Dakota OCIO Community');
                    Boolean isPortfolio = (usr.Profile?.Name =='Dakota Portfolio Community');
                    if (isResearch) {
                        emailTemplate = emailTemplateMap.get('CommunityWelcomeEmailTemplateResearch');
                        emailTemplate2 = emailTemplateMap.get('Custom_Welcome_Email_for_Research_Trial_Users');
                    } else if (isPortfolio) {
                        emailTemplate = emailTemplateMap.get('CommunityWelcomeEmailTemplatePortfolio');
                        emailTemplate2 = emailTemplateMap.get('Custom_Welcome_Email_for_Portfolio_Trial_Users');
                    }
                    String body = emailTemplate.Body;
                    String subject = emailTemplate.Subject;
                    if(accMap.get(usr.Contact.AccountId).Trial_Start_Date__c != null && accMap.get(usr.Contact.AccountId).Active_Draft_Trial__c == true)    //is Trial User
                    {

                        isTrial = true;
                        if(isUpdated == false) //user created
                        {
                            if(usr.isActive == true)
                                System.resetPasswordWithEmailTemplate(usr.Id, true, emailTemplate2.DeveloperName);
                        }
                    }
                    else
                    {
                        if(isUpdated == false) //user created
                        {
                            if(usr.isActive == true)
                                System.resetPasswordWithEmailTemplate(usr.Id, true, emailTemplate.DeveloperName);
                        }
                    }
                    
                    if(isUpdated == true)
                    {                       
                        if(usr.LastLoginDate != null || test.isRunningTest())
                        {
                            if(isTrial == true)
                            {
                                if(emailTemplate2 != null)
                                    body = emailTemplate2.HTMLValue;
                            } 
                            String communityName = isResearch ? 'Dakota Research' : isPortfolio ? 'Dakota Portfolio' : 'Dakota Marketplace';
                            subject = 'Welcome to ' + communityName;
                            body = body.replace('{!Community_Name}', communityName);
                            String communityUrl =  isResearch ? System.label.OCIO_Community_Login_URL 
                                                    : isPortfolio ? System.label.Portfolio_Community_Login_URL 
                                                    : System.label.MP_Community_Login_URL;
                            body = body.replace('{!Community_Url}', communityUrl );
                            
                            if(usr.Contact.Firstname != null && usr.Contact.Firstname != '') {
                                body = body.replace('{!Receiving_User.FirstName}',usr.Contact.Firstname);
                            }
                            else {
                                body = body.replace('{!Receiving_User.FirstName}', '');
                            }
                            
                            if(usr.Email != null)
                                body = body.replace('{!Receiving_User.Username}',usr.UserName);
                            
                            body = body.replace('{!Organization.Name}', 'Dakota Network');
                            receiverEmails.clear();
                            receiverEmails.add(usr.Email);
                            email.setSenderDisplayName(communityName);
                            email.setReplyTo('no-reply@dakota.co');
                            email.setToAddresses(receiverEmails); //only current iteration's user's email
                            if(isTrial == true)
                                email.setHtmlBody(body);
                            else {
                                email.setPlainTextBody(body);
                            }
                            email.setSubject(subject);
                            messages.add(email);
                        }  
                        else if(usr.LastLoginDate == null)
                        {
                            
                            if(isTrial == true)
                            {
                                if(emailTemplate2 != null)
                                    System.resetPasswordWithEmailTemplate(usr.Id, true, emailTemplate2.DeveloperName);
                            }
                            else {
                                System.resetPasswordWithEmailTemplate(usr.Id, true, emailTemplate.DeveloperName);
                            }
                        }                     
                        
                    }
                    usr.Email_Sent__c = true;
                }
                
            }
            if (messages != null) {
                Messaging.sendEmail(messages);
                update marketplaceUsers;
            }
                
        } catch (Exception ex) {
            System.debug(ex.getMessage() + ex.getStackTraceString());
        }
    }
    
    public static void removeProductOwnerinAccountAddInfo(List<User> newUsers, Map<Id, User> oldUserMap)
    {
        List<Id> contactIds = new List<Id>();
        for(User commUser: newUsers){
            if(!commUser.isActive && oldUserMap.get(commUser.Id).isActive && commUser.ContactId!=null){
                contactIds.add(commUser.ContactId);
            }
        }
        if(contactIds!=null && contactIds.size()>0)
        {
            updateAccountAdditionalInfo(contactIds);
        }
    }
    
    @Future
    public static void updateAccountAdditionalInfo(List<Id> contactIds){
        List<Account_Additional_Information__c> accAddInfoList = [SELECT Id, Contact__c 
                                                                  FROM Account_Additional_Information__c
                                                                  WHERE Contact__c IN: contactIds];
        if(accAddInfoList!=null && accAddInfoList.size()>0)
        {
            for(Account_Additional_Information__c accAddInfo: accAddInfoList)
            {
                accAddInfo.Contact__c = null;
            }
            update accAddInfoList;
        }
    }
    
    public static void updateForm5500checkboxDCI(List<Id> acccountListToUpdate)
    {
        
        //no acccounts needed to updated
        if(acccountListToUpdate.size() < 1 ){
            return;
        }
        
        //this map saves account Id as key and Boolean map regarding form5500 Access as value
        Map<Id, Boolean> form5500PermissionFlagMap = new Map<Id, Boolean>();
        
        for (User commUser : [SELECT Id, Name, Restrict_Access_of_Form_5500__c, AccountId FROM User WHERE AccountId IN : acccountListToUpdate]) {
            if(form5500PermissionFlagMap.get(commUser.AccountId) != null) {
                //if any user of the Account has Form5500 Access, we mark it as thay have Form5500 records permission
                if(commUser.Restrict_Access_of_Form_5500__c == true && form5500PermissionFlagMap.get(commUser.AccountId) == false) {
                    form5500PermissionFlagMap.put(commUser.AccountId, commUser.Restrict_Access_of_Form_5500__c);
                }
            } else {
                form5500PermissionFlagMap.put(commUser.AccountId, commUser.Restrict_Access_of_Form_5500__c);
            } 
        }
        
        if(form5500PermissionFlagMap.keySet().size() > 0 ) {
            System.enqueueJob(new DataIntegerationsBitCallout([SELECT Id, Name, Data_Integerations__c, Is_Trial_User__c, Client_Active__c FROM Account WHERE Id IN: form5500PermissionFlagMap.keySet()], form5500PermissionFlagMap));
        }
        
    }
    
    
    
    public static void triggerDCICallout(List<Id> acccountListToUpdate)
    {
        //no acccounts needed to updated
        if(acccountListToUpdate.size() < 1 ){
            return;
        }
        
        //this map saves account Id as key and Boolean map regarding form5500 Access as value
        Map<Id, Boolean> form5500PermissionFlagMap = new Map<Id, Boolean>();
        
        //this map saves account Id as key and Boolean map regarding Insurance Account Access as value
        Map<Id, Boolean> insuranceAccountPermissionFlagMap = new Map<Id, Boolean>();
        
        for (User commUser : [SELECT Id, Name,Restrict_Access_of_Form_5500__c, Restrict_Insurance_Record_Access__c, AccountId FROM User WHERE AccountId IN : acccountListToUpdate]) {
            if(form5500PermissionFlagMap.get(commUser.AccountId) != null) {
                //if any user of the Account has Form5500 Access, we mark it as thay have Form5500 records permission
                if(commUser.Restrict_Access_of_Form_5500__c == true && form5500PermissionFlagMap.get(commUser.AccountId) == false) {
                    form5500PermissionFlagMap.put(commUser.AccountId, commUser.Restrict_Access_of_Form_5500__c);
                }
            } else {
                form5500PermissionFlagMap.put(commUser.AccountId, commUser.Restrict_Access_of_Form_5500__c);
            } 
            
            if(insuranceAccountPermissionFlagMap.get(commUser.AccountId) != null) {
                //if any user of the Account has Form5500 Access, we mark it as thay have Form5500 records permission
                if(commUser.Restrict_Insurance_Record_Access__c == true && insuranceAccountPermissionFlagMap.get(commUser.AccountId) == false) {
                    insuranceAccountPermissionFlagMap.put(commUser.AccountId, commUser.Restrict_Insurance_Record_Access__c);
                }
            } else {
                insuranceAccountPermissionFlagMap.put(commUser.AccountId, commUser.Restrict_Insurance_Record_Access__c);
            } 
        }
        
        if(form5500PermissionFlagMap.keySet().size() > 0 || insuranceAccountPermissionFlagMap.keySet().size() > 0 ) {
            System.enqueueJob(new DataIntegerationsBitCallout([SELECT Id, Name, Data_Integerations__c, Is_Trial_User__c, Client_Active__c FROM Account WHERE Id IN: form5500PermissionFlagMap.keySet() OR Id IN: insuranceAccountPermissionFlagMap.keySet()], form5500PermissionFlagMap, insuranceAccountPermissionFlagMap));
        }
    }
    
    
    public static void updateLastExportDateAndHistoryTracking(List<User> newUsers, Map<Id, User> oldUserMap)
    {
        User usr = [Select Id, Is_Community_User__c From User where Id =:UserInfo.getUserId()];
        if(usr.Is_Community_User__c == false || Test.isRunningTest()) 
        {
            Boolean recordsUpdated = Trigger.isUpdate && oldUserMap != null;
            List<User_History__c> userHistoryRecords = new List<User_History__c>();
            Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get('User').getDescribe().fields.getMap();
            
            for(User commUser: newUsers)
            {
                if((recordsUpdated && oldUserMap.get(commUser.Id) != null && 
                    (oldUserMap.get(commUser.Id).Allow_Account_and_Contacts_Export__c !=commUser.Allow_Account_and_Contacts_Export__c || commUser.Export_Batch_Limit__c == null || ( oldUserMap.get(commUser.Id).Export_Batch_Limit__c!=commUser.Export_Batch_Limit__c) ))
                   && commUser.Allow_Account_and_Contacts_Export__c == true)
                {
                    commUser.Last_Export_Reset_Date__c =  Date.Today().addDays(30);
                    if(commUser.Export_Batch_Limit__c == null) {
                        commUser.Export_Batch_Limit__c = integer.valueof(System.Label.Initial_Export_Batch_Limit);
                    }
                }
                
                if(recordsUpdated && oldUserMap.get(commUser.Id) != null && oldUserMap.get(commUser.Id).Allow_Account_and_Contacts_Export__c != commUser.Allow_Account_and_Contacts_Export__c)
                {
                    userHistoryRecords.add(createUserHistoryRecords(commUser,oldUserMap.get(commUser.Id),'Allow_Account_and_Contacts_Export__c',fieldMap));
                }
                if(recordsUpdated && oldUserMap.get(commUser.Id) != null && oldUserMap.get(commUser.Id).Export_Batch_Limit__c != commUser.Export_Batch_Limit__c)
                {
                    userHistoryRecords.add(createUserHistoryRecords(commUser,oldUserMap.get(commUser.Id),'Export_Batch_Limit__c',fieldMap));
                }
                if(recordsUpdated && oldUserMap.get(commUser.Id) != null && oldUserMap.get(commUser.Id).Last_Export_Reset_Date__c != commUser.Last_Export_Reset_Date__c)
                {
                    userHistoryRecords.add(createUserHistoryRecords(commUser,oldUserMap.get(commUser.Id),'Last_Export_Reset_Date__c',fieldMap));
                }
            }
            if(userHistoryRecords.size()>0)
            {
                String userHistoryRecordsJSON = JSON.serialize(userHistoryRecords);
                InsertUserHistoryRecordsQueueable queueableInstance = new InsertUserHistoryRecordsQueueable(userHistoryRecordsJSON);
                Id jobId = System.enqueueJob(queueableInstance);
            }
        }
    }
    
    private static User_History__c createUserHistoryRecords(User newUser, User oldUser,String fieldName,Map<String, Schema.SObjectField> fieldMap)
    {
        String oldValue = '';
        String newValue = '';
        String fieldType = String.valueOf(fieldMap.get(fieldName).getDescribe().getType());
        
        if(fieldType == 'Double') 
        {
            oldValue = oldValue != null ? String.valueOf(Integer.ValueOf(oldUser.get(fieldName))) : oldValue;
            newValue = newValue != null ? String.valueOf(Integer.ValueOf(newUser.get(fieldName))) : newValue;
        }
        else if(fieldType == 'Date')
        {
            oldValue = oldValue != null ? String.valueOf(Date.ValueOf(oldUser.get(fieldName))) : oldValue;
            newValue = newValue != null ? String.valueOf(Date.ValueOf(newUser.get(fieldName))) : newValue;
        }
        else
        {
            oldValue = oldValue != null ? String.valueOf(oldUser.get(fieldName)) : oldValue;
            newValue = newValue != null ? String.valueOf(newUser.get(fieldName)) : newValue;
        }
        User_History__c userHistory = new User_History__c();
        userHistory.Record_Changed_By__c = UserInfo.getUserId();
        userHistory.User_Updated__c = newUser.Id;
        userHistory.Old_Value__c = oldValue;
        userHistory.New_Value__c = newValue;
        userHistory.Field_Name__c = fieldMap.get(fieldName).getDescribe().getLabel();
        return userHistory;
    }
    
    @future(callout=true)
    public static void updateContactsOfActiveCommunityuser(List<Id> contactList,List<Boolean> contactIsActive)
    {
        List<Contact> contactsList = [select id,Not_a_fit_for_MarketplaceII__c,Not_a_Fit_for_MarketplaceII_Reason__c from contact where Id IN:contactList];
        if(contactsList.size()>0)
        {
            for (Integer i = 0; i < contactsList.size(); i++)
            {
                Integer index = contactList.indexOf(contactsList[i].Id);
                Boolean activeFlag = contactIsActive[index];
                contactsList[i].Not_a_fit_for_MarketplaceII__c=activeFlag;
                contactsList[i].Not_a_Fit_for_MarketplaceII_Reason__c = activeFlag == true ? 'Active Community User' : null;
            }
            update contactsList;
        }
        
    }
    
    public static void createEmailNotificationPreferenceRecord(List<User> newUsers, Map<Id, User> oldUserMap) {
        try {
            Map<Id, User> usersMap = new Map<Id, User>(newUsers);
            insertEmailNotificationPreferences(usersMap.keySet());
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    }

    public static void createEmailNotificationPreferenceRecordOnUpdate(List<User> newUsers, Map<Id, User> oldUserMap) {
        try {
            Map<Id, User> usersMap = new Map<Id, User>();
            for (User u: newUsers) {
                User oldUser = oldUserMap.get(u.Id);
                if (u.IsActive == true && oldUser != null && u.IsActive != oldUser.IsActive) {
                    usersMap.put(u.Id, u);
                }
            }
            Set<Id> userIds = new Set<Id>();
            List<Email_Notification_Preferences__c> lstDefaultPreferences = [SELECT Id, OwnerId FROM Email_Notification_Preferences__c WHERE OwnerId IN : usersMap.keySet()];
            Map<Id, Email_Notification_Preferences__c> mapDefaultPreferences = new Map<Id, Email_Notification_Preferences__c>();
            for (Email_Notification_Preferences__c pref: lstDefaultPreferences) {
                mapDefaultPreferences.put(pref.OwnerId, pref);
            }
            for(Id userId: usersMap.keySet()) {
                if (mapDefaultPreferences.get(userId) == null) {
                    userIds.add(userId);
                }
            }
            if (userIds?.size() > 0) {
                insertEmailNotificationPreferences(userIds);
            }
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    }
    
    @future(callout=true)
    public static void insertEmailNotificationPreferences(Set<Id> userIds) {
        try {
            List<User> activeUsers = [
                                        SELECT 
                                            Id, IsActive, Contact.Searches_Asset_Class__c, Profile.Name, ProfileId 
                                        FROM User 
                                        WHERE Id IN: userIds
                                        AND IsActive = true
                                        AND Profile.Name IN ('Dakota Customer Community', 'Dakota Research Community', 'Dakota OCIO Community')
                                    ];
            List<Email_Notification_Preferences__c> lstDefaultPreferences = new List<Email_Notification_Preferences__c>();
            Id dakotaResearchRecordTypeId = Schema.SObjectType.Email_Notification_Preferences__c.getRecordTypeInfosByDeveloperName().get('DakotaResearch').getRecordTypeId();
            Id dakotaCustomerRecordTypeId = Schema.SObjectType.Email_Notification_Preferences__c.getRecordTypeInfosByDeveloperName().get('DakotaMarketplace').getRecordTypeId();
            for (User u: activeUsers) {
                Schema.DescribeFieldResult accountFieldResult = Email_Notification_Preferences__c.Account_Updates_Selection__c.getDescribe();
                List<Schema.PicklistEntry> accountPicklistValues = accountFieldResult.getPicklistValues();
                
                List<String> accountUpdatesSelection = new List<String>();
                for (Schema.PicklistEntry entry : accountPicklistValues) {
                    accountUpdatesSelection.add(entry.getValue());
                }
                
                Schema.DescribeFieldResult contactFieldResult = Email_Notification_Preferences__c.Contact_Updates_Selection__c.getDescribe();
                List<Schema.PicklistEntry> contactPicklistValues = contactFieldResult.getPicklistValues();
                
                List<String> contactUpdatesSelection = new List<String>();
                for (Schema.PicklistEntry entry : contactPicklistValues) {
                    contactUpdatesSelection.add(entry.getValue());
                }
                
                Schema.DescribeFieldResult metroAreaFieldResultFieldResult = Email_Notification_Preferences__c.MetroArea_Updates_Selection__c.getDescribe();
                List<Schema.PicklistEntry> metroAreaPicklistValues = metroAreaFieldResultFieldResult.getPicklistValues();
                
                List<String> metroAreaUpdatesSelection = new List<String>();
                for (Schema.PicklistEntry entry : metroAreaPicklistValues) {
                    metroAreaUpdatesSelection.add(entry.getValue());
                }
                
                Schema.DescribeFieldResult searchesFieldResult = Email_Notification_Preferences__c.Search_Updates_Selection__c.getDescribe();
                List<Schema.PicklistEntry> searchesPicklistValues = searchesFieldResult.getPicklistValues();
                
                List<String> searchesUpdatesSelection = new List<String>();
                List<String> selectedSearches = String.isNotBlank(u.Contact?.Searches_Asset_Class__c) ? u.Contact?.Searches_Asset_Class__c?.split(';') : new List<String>();
                Set<String> selectedSearchesSet = new Set<String>(selectedSearches);
                for (Schema.PicklistEntry entry : searchesPicklistValues) {
                    if (selectedSearchesSet.contains(entry.getValue())) {
                        searchesUpdatesSelection.add(entry.getValue());
                    }
                }

                Email_Notification_Preferences__c defaultPreferences = new Email_Notification_Preferences__c(OwnerId = u.Id, Account_Updates_Selection__c = String.join(accountUpdatesSelection, ';'), Contact_Updates_Selection__c = String.join(contactUpdatesSelection, ';') , Search_Updates_Selection__c = String.join(searchesUpdatesSelection, ';'), MetroArea_Updates_Selection__c = String.join(metroAreaUpdatesSelection, ';'));
                if (u.Profile.Name == 'Dakota Research Community' || u.Profile.Name == 'Dakota OCIO Community') {
                    defaultPreferences.RecordTypeId = dakotaResearchRecordTypeId;
                } else {
                    defaultPreferences.RecordTypeId = dakotaCustomerRecordTypeId;
                }
                lstDefaultPreferences.add(defaultPreferences);
            }

            if (lstDefaultPreferences.size() > 0) {
                insert lstDefaultPreferences;
            }
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    }
    
    public static void assignExportReportPermissions(List<User> newUsers) {
        try{
            List<String> marketplaceProfiesList = new List<String> { 'Dakota Customer Community', 'Dakota Research Community', 'Dakota OCIO Community'};
                Set<Id> marketplaceProfileIds = new Map<Id, Profile>(
                    [SELECT Id FROM Profile WHERE Name IN :marketplaceProfiesList]
                ).keySet();
            // Collect Account IDs from the User list
            Set<Id> contactIds = new Set<Id>();
            Map<Id,Id> profileIdMap = new Map<Id,Id>();
            for (User user : newUsers) {
                if (user.ContactId != null) {
                    contactIds.add(user.ContactId);
                }
                if(user.ProfileId != null) {
                    profileIdMap.put(user.Id, user.ProfileId);
                }
            }
            
            // Fetch related Account records
            Map<Id, Contact> contactMap = new Map<Id, Contact>(
                [SELECT Id, AccountId, Account.Active_Draft_Trial__c, Account.Trial_Start_Date__c
                 FROM Contact 
                 WHERE Id IN :contactIds]
            );
            
            // Update Users based on the Account conditions
            List<PermissionSetAssignment> permissionSetToBeAssigned = new List<PermissionSetAssignment>();
            List<User> usersToUpdate = new List<User>();
            for (User user : newUsers) {
                if (user.ContactId != null && contactMap.containsKey(user.ContactId) && contactMap.get(user.ContactId).AccountId != null ) {
                    if (Trigger.isInsert && !(contactMap.get(user.ContactId).Account.Active_Draft_Trial__c == true && contactMap.get(user.ContactId).Account.Trial_Start_Date__c != null) && marketplaceProfileIds.contains(profileIdMap.get(user.Id))) {
                        user.Allow_Export_Reports__c = true;
                    }
                }
            }
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    }
    
    public static void assignExportPermissionSet(List<User> newUsers) {
        try {
            List<PermissionSet> permissionSets = [SELECT Id, Name FROM PermissionSet WHERE Name = 'Export_Report_For_Marketplace_Users'];
            List<PermissionSetAssignment> permissionSetAssignments = new List<PermissionSetAssignment>();
            for (User user : newUsers) {
                if (user.Allow_Export_Reports__c == true) {
                    PermissionSetAssignment permissionSetAssignment = new PermissionSetAssignment();
                    permissionSetAssignment.AssigneeId = user.Id;
                    permissionSetAssignment.PermissionSetId = permissionSets[0].Id;
                    permissionSetAssignments.add(permissionSetAssignment);
                }
            }
            if (permissionSetAssignments.size() > 0) {
                insert permissionSetAssignments;
            }
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    }

    public static void restrictAccessOfInvestmentAnd5500Records(List<User> newUsers) {
        // Query profiles and store their IDs in a Set for quick lookup
        Set<Id> restrictedProfileIds = new Map<Id, Profile>(
            [SELECT Id FROM Profile WHERE Name IN ('Dakota OCIO Community', 'Dakota Research Community')]
        ).keySet();
    
        // Update access restriction flags for matching users
        for (User user : newUsers) {
            if (restrictedProfileIds.contains(user.ProfileId)) {
                user.Restrict_Insurance_Record_Access__c = true;
                user.Restrict_Access_of_Form_5500__c = true;
            }
        }
    }
    
    
    
    public static void updateExportPermissions(List<User> newUsers, Map<Id,User> oldUsers) {
        try {
            List<PermissionSet> permissionSets = [SELECT Id, Name FROM PermissionSet WHERE Name = 'Export_Report_For_Marketplace_Users'];
            List<PermissionSetAssignment> permissionSetAssignments = new List<PermissionSetAssignment>();
            Set<Id> userToRemovePermission = new Set<Id>();
            for (User user : newUsers) {
                if (user.Allow_Export_Reports__c == true && oldUsers.get(user.Id).Allow_Export_Reports__c == false) {
                    PermissionSetAssignment permissionSetAssignment = new PermissionSetAssignment();
                    permissionSetAssignment.AssigneeId = user.Id;
                    permissionSetAssignment.PermissionSetId = permissionSets[0].Id;
                    permissionSetAssignments.add(permissionSetAssignment);
                }
                if(user.Allow_Export_Reports__c == false && oldUsers.get(user.Id).Allow_Export_Reports__c == true ) {
                    userToRemovePermission.add(user.Id);
                }
            }
            if (permissionSetAssignments.size() > 0) {
                insert permissionSetAssignments;
            }
            if(userToRemovePermission.size() > 0) {
                List<PermissionSetAssignment> permissionSetAssignmentsToDelete = [SELECT Id FROM PermissionSetAssignment WHERE AssigneeId IN :userToRemovePermission AND PermissionSetId = :permissionSets[0].Id];
                delete permissionSetAssignmentsToDelete;
            }
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    } 
    
     public static void assignDakotabotPermissionSet(List<User> newUsers) {
        try {
            List<PermissionSet> permissionSets = [SELECT Id, Name FROM PermissionSet WHERE Name = 'Enable_Dakota_Bot'];
            List<PermissionSetAssignment> permissionSetAssignments = new List<PermissionSetAssignment>();
            for (User user : newUsers) {
                if (user.Enable_Dakota_Copilot__c == true) {
                    PermissionSetAssignment permissionSetAssignment = new PermissionSetAssignment();
                    permissionSetAssignment.AssigneeId = user.Id;
                    permissionSetAssignment.PermissionSetId = permissionSets[0].Id;
                    permissionSetAssignments.add(permissionSetAssignment);
                }
            }
            if (permissionSetAssignments.size() > 0) {
                insert permissionSetAssignments;
            }
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    }
    public static void updateDakotabotPermissions(List<User> newUsers, Map<Id,User> oldUsers) {
        try {
            List<PermissionSet> permissionSets = [SELECT Id, Name FROM PermissionSet WHERE Name = 'Enable_Dakota_Bot'];
            List<PermissionSetAssignment> permissionSetAssignments = new List<PermissionSetAssignment>();
            Set<Id> userToRemovePermission = new Set<Id>();
            for (User user : newUsers) {
                if (user.Enable_Dakota_Copilot__c == true && oldUsers.get(user.Id).Enable_Dakota_Copilot__c == false) {
                    PermissionSetAssignment permissionSetAssignment = new PermissionSetAssignment();
                    permissionSetAssignment.AssigneeId = user.Id;
                    permissionSetAssignment.PermissionSetId = permissionSets[0].Id;
                    permissionSetAssignments.add(permissionSetAssignment);
                }
                if(user.Enable_Dakota_Copilot__c == false && oldUsers.get(user.Id).Enable_Dakota_Copilot__c == true ) {
                    userToRemovePermission.add(user.Id);
                }
            }
            if (permissionSetAssignments.size() > 0) {
                insert permissionSetAssignments;
            }
            if(userToRemovePermission.size() > 0) {
                List<PermissionSetAssignment> permissionSetAssignmentsToDelete = [SELECT Id FROM PermissionSetAssignment WHERE AssigneeId IN :userToRemovePermission AND PermissionSetId = :permissionSets[0].Id];
                delete permissionSetAssignmentsToDelete;
            }
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    } 
    
}