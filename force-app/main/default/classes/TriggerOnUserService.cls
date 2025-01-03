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
    
    public static void communityUserThreshold(List<User> newUsers){
        
        List<Profile> prof = [SELECT Id, Name from Profile where Name='Dakota Customer Community'];
        
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
    public static void setCommunityUsersFields(List<User> newUsers){
        //getting required fields for organization id
        List<User> allNewUsers = [SELECT Id, Contact.AccountId, Profile.UserLicense.Name, ProfileId FROM User WHERE Id IN: newUsers];
        List<User> updateUserList = new List<User>();
        for(User commUser: allNewUsers){
            if(commUser.Profile.UserLicense.Name == 'Customer Community Plus'){
                //DSC-708 logic to set field values here
                User usertoUpdate = new User(Id = commUser.Id, is_community_user__c = true, organization_ID__c = commUser.Contact.AccountId);
                updateUserList.add(usertoUpdate);
            }
        }
        if(updateUserList.size() > 0) {
            update updateUserList;
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
        // DSC-1140 : Investment Firm Records access
        Set<Id> removeInvFirmRecordsAccessUserIds = new Set<Id>();
        // DSC-1114 : Insurance Records access
        Set<Id> removeInsuranceRecordsAccessUserIds = new Set<Id>();

        Set<Id> giveSearchesAccessUserIds = new Set<Id>();
        Set<Id> givePublicInvestmentsUserIds = new Set<Id>();
        Set<Id> give13FInvestmentsUserIds = new Set<Id>();
        //DSC-729 Events, Tasks, Notes Access
        Set<Id> giveActivitiesUserIds = new Set<Id>();
        // DSC-849 : Form 5500 Records access
        Set<Id> giveForm5500AccessUserIds = new Set<Id>();
        // DSC-1140 : Investment Firm Records access
        Set<Id> giveInvFirmRecordsAccessUserIds = new Set<Id>();
        // DSC-1114 : Insurance Records access
        Set<Id> giveInsuranceRecordsAccessUserIds = new Set<Id>();

        String errorMessage ='You cannot assign such permission to inactive users.';

        for(User u : newUsers)
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
            if((Trigger.IsInsert || (Trigger.IsUpdate && u.Form_5500_Records_Access__c != oldUserMap.get(u.Id).Form_5500_Records_Access__c)) && u.Form_5500_Records_Access__c == true)
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
            // DSC-1114 : Insurance Records access
            if((Trigger.IsInsert || (Trigger.IsUpdate && u.Restrict_Insurance_Record_Access__c != oldUserMap.get(u.Id).Restrict_Insurance_Record_Access__c)) && u.Restrict_Insurance_Record_Access__c == false)             {
                if(!u.IsActive)
                {
                    u.addError(errorMessage);
                }
                else 
                {
                    giveInsuranceRecordsAccessUserIds.add(u.Id);                   
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
            if(Trigger.IsUpdate && oldUserMap.get(u.Id).Form_5500_Records_Access__c && u.Form_5500_Records_Access__c == false)
            {
                removeForm5500AccessUserIds.add(u.Id);
            }
            // DSC-1140 : LP & GP(Investment Firm) Records access
            if(Trigger.IsUpdate && oldUserMap.get(u.Id).LP_GP_Data_Access__c && u.LP_GP_Data_Access__c == false)
            {
                removeInvFirmRecordsAccessUserIds.add(u.Id);
            }
            // DSC-1114 : Insurance Records access
            if(Trigger.IsUpdate && u.Restrict_Insurance_Record_Access__c != oldUserMap.get(u.Id).Restrict_Insurance_Record_Access__c && u.Restrict_Insurance_Record_Access__c == true)
            {
                removeInsuranceRecordsAccessUserIds.add(u.Id);
            }
        }
        
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
        
        // DSC-1140 : LP & GP(Investment Firm) Records access
        if(removeInvFirmRecordsAccessUserIds.size() > 0)
        {
            List<GroupMember> investmentFirmRecordsGroup = [Select Id, Group.Name from GroupMember where UserOrGroupId In :removeInvFirmRecordsAccessUserIds and Group.DeveloperName ='LP_GP_Data_Access_Group'];
            groupMembersToBeRemoved.addAll(investmentFirmRecordsGroup);
            
            List<PermissionSetAssignment> invFirmPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId In :removeInvFirmRecordsAccessUserIds and
                                                                               PermissionSet.Name='LP_and_GP_Fields_Access'];
            permissionSetToBeRemoved.addAll(invFirmPermissionSetAssignees);
        }
        // DSC-1114 : Insurance Records access revoke
        if(removeInsuranceRecordsAccessUserIds.size() > 0)
        {
            List<GroupMember> insuranceRecordsGroup = [Select Id, Group.Name from GroupMember where UserOrGroupId In :removeInsuranceRecordsAccessUserIds and Group.DeveloperName ='Insurance_Records_Access_Group'];
            groupMembersToBeRemoved.addAll(insuranceRecordsGroup);
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

    public static void getNewUpdatedUsersForWelcomeEmail(Boolean isUpdated, List<User> newUsers, Map<Id, User> newUserMap, Map<Id, User> oldUserMap)
    {
        Boolean isActive = false;
        List<Id> newUpdatedUsers = new List<Id>();
        Map<Id,String> mapOfProfileIdToName = new Map<Id,String>();
        List<User> allNewUsers = [SELECT Id,ContactId,IsActive,Profile.Name,Email_Sent__c,LastLoginDate, Contact.AccountId, Profile.UserLicense.Name, ProfileId FROM User WHERE Id IN: newUsers];
        Set<Id> profileIDs = new Set<Id>();
        
        if (Trigger.isUpdate && !Test.isRunningTest()) {
            for (User usr: oldUserMap.values()) {
                profileIDs.add(usr.ProfileId);
            }
        
            List<Profile> profiles = [SELECT Id, Name, UserLicense.Name FROM Profile WHERE Id In :profileIDs];
            for (Profile prof : profiles) {
                mapOfProfileIdToName.put(prof.Id, prof.Name);
            }
        }
            
        
        List<String> customerCommunityProfiles = new List<String>{
            'Dakota Customer Community',
            'Marketplace User - Emerging Manager Membership',
            'Marketplace User - Platinum Membership',
            'Marketplace User - Premium Membership',
            'Marketplace User - Standard Membership',
            'Marketplace Lite Customer'
        };        
        if(isUpdated)   //if the user is activated
        {
            for(User usr: allNewUsers)
            {

                if((( Trigger.isInsert || 
                ((Trigger.isUpdate) && 
                (usr.isActive != oldUserMap.get(usr.Id).isActive) || 
                (usr.Profile.name != mapOfProfileIdToName.get(oldUserMap.get(usr.Id).profileId) && customerCommunityProfiles.contains(usr.Profile.name) && !customerCommunityProfiles.contains(mapOfProfileIdToName.get(oldUserMap.get(usr.Id).profileId)) && (usr.Email_Sent__c == false && usr.LastLoginDate ==null))))) && 
                usr.isActive == true && customerCommunityProfiles.contains(usr.Profile.name)) {
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
        EmailTemplate emailTemplate = [SELECT Id, Name, Subject, Description, HtmlValue, DeveloperName, Body FROM EmailTemplate
                                       WHERE DeveloperName = 'CommunityWelcomeEmailTemplate'];
        EmailTemplate emailTemplate2 = [SELECT Id, Name, Subject, Description, HtmlValue, DeveloperName, Body FROM EmailTemplate
                                        WHERE DeveloperName = 'Custom_Welcome_Email_for_Trial_Users'];
        
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
                
                String body = emailTemplate.Body;
                String subject = emailTemplate.Subject;
                Boolean isTrial = false;
                List<String> receiverEmails = new List<String>();
                for(User usr: marketplaceUsers)
                {
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
                        
                            subject = 'Welcome to Dakota Marketplace';
                            body = body.replace('{!Community_Name}', 'Dakota Marketplace');
                            body = body.replace('{!Community_Url}', System.label.MP_Community_Login_URL);
                            
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
                            email.setSenderDisplayName('Dakota Marketplace');
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

    public static void createEmailNotificationPreferenceRecord(List<User> newUsers, Map<Id, User> oldUserMap) {
        try {
            Map<Id, User> usersMap = new Map<Id, User>(newUsers);
            insertEmailNotificationPreferences(usersMap.keySet());
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    }


    @future(callout=true)
    public static void insertEmailNotificationPreferences(Set<Id> userIds) {
        try {
            List<User> actvieUsers = [SELECT Id, IsActive, Contact.Searches_Asset_Class__c, Profile.UserLicense.Name, ProfileId FROM User WHERE Id IN: userIds];
            List<Email_Notification_Preferences__c> lstDefaultPreferences = new List<Email_Notification_Preferences__c>();
            for (User u: actvieUsers) {
                if (u.IsActive == true && u.Profile.UserLicense.Name == 'Customer Community Plus') {
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
    
                    Email_Notification_Preferences__c defaultPreferences = new Email_Notification_Preferences__c(OwnerId = u.Id, Account_Updates_Selection__c = String.join(accountUpdatesSelection, ';'), Contact_Updates_Selection__c = String.join(contactUpdatesSelection, ';') , Search_Updates_Selection__c = String.join(searchesUpdatesSelection, ';'));
                    lstDefaultPreferences.add(defaultPreferences);
                }
            }

            if (lstDefaultPreferences.size() > 0) {
                insert lstDefaultPreferences;
            }
        } catch (Exception e) {
            System.debug('Exception Occurred: ' + e);
        }
    }
}