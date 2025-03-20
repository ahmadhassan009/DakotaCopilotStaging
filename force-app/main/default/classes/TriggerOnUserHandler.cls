public class TriggerOnUserHandler {
    
    public Boolean isUpdated = false;
    List<User> userList;
    Map<Id,User> newUserMap;
    Map<Id,User> oldUserMap;
    
    public TriggerOnUserHandler(List<User> userList, Map<Id,User> newUserMap, Map<Id,User> oldUserMap)
    {
        this.userList = userList;
        this.newUserMap = newUserMap;
        this.oldUserMap = oldUserMap;
    }
    
    public void afterInsert()
    {
        TriggerOnUserService.communityUserThreshold(userList);
        TriggerOnUserService.givePermissionOfSearchesAndInvestmentObject(userList, oldUserMap);
        TriggerOnUserService.giveAccessOfInvestmentRecords(userList, oldUserMap);
        TriggerOnUserService.getNewUpdatedUsersForWelcomeEmail(false, userList, newUserMap, oldUserMap);
        TriggerOnUserService.setCommunityUsersFields(userList,oldUserMap);
        TriggerOnUserService.updateUserInDakotaMPViewAllGroup(userList, oldUserMap);
        TriggerOnUserService.updateUserInDakotaOCIOGroup(userList, oldUserMap);        
        TriggerOnUserService.createEmailNotificationPreferenceRecord(userList, oldUserMap);
        TriggerOnUserService.assignExportPermissionSet(userList);
        TriggerOnUserService.assignDakotabotPermissionSet(userList);
    }
    
    public void afterUpdate()
    {
        TriggerOnUserService.communityUserDeactivated(userList, oldUserMap);
        TriggerOnUserService.givePermissionOfSearchesAndInvestmentObject(userList, oldUserMap);
        TriggerOnUserService.giveAccessOfInvestmentRecords(userList, oldUserMap);
        TriggerOnUserService.getNewUpdatedUsersForWelcomeEmail(true, userList, newUserMap, oldUserMap);
        TriggerOnUserService.removeProductOwnerinAccountAddInfo(userList, oldUserMap);
        TriggerOnUserService.updateUserInDakotaMPViewAllGroup(userList, oldUserMap);
        TriggerOnUserService.updateUserInDakotaOCIOGroup(userList, oldUserMap);
        TriggerOnUserService.setCommunityUsersFields(userList,oldUserMap);
        TriggerOnUserService.createEmailNotificationPreferenceRecordOnUpdate(userList, oldUserMap);
        TriggerOnUserService.updateExportPermissions(userList, oldUserMap);
        TriggerOnUserService.updateDakotabotPermissions(userList, oldUserMap);
    }
    public void beforeUpdate()
    {
        TriggerOnUserService.updateLastExportDateAndHistoryTracking(userList, oldUserMap);
    }
    public void beforeInsert()
    {
        TriggerOnUserService.assignExportReportPermissions(userList);
        TriggerOnUserService.restrictAccessOfInvestmentAnd5500Records(userList);
    }
}