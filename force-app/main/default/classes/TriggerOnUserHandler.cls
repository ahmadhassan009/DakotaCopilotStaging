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
        //TriggerOnUserService.giveAccessOfInvestmentRecords(userList, oldUserMap);
        TriggerOnUserService.getNewUpdatedUsersForWelcomeEmail(false, userList, newUserMap, oldUserMap);
        TriggerOnUserService.setCommunityUsersFields(userList);
        TriggerOnUserService.updateUserInDakotaMPViewAllGroup(userList, oldUserMap);
        TriggerOnUserService.createEmailNotificationPreferenceRecord(userList, oldUserMap);
    }
    
    public void afterUpdate()
    {
        TriggerOnUserService.communityUserDeactivated(userList, oldUserMap);
        TriggerOnUserService.givePermissionOfSearchesAndInvestmentObject(userList, oldUserMap);
        //TriggerOnUserService.giveAccessOfInvestmentRecords(userList, oldUserMap);
        TriggerOnUserService.getNewUpdatedUsersForWelcomeEmail(true, userList, newUserMap, oldUserMap);
        TriggerOnUserService.removeProductOwnerinAccountAddInfo(userList, oldUserMap);
        TriggerOnUserService.updateUserInDakotaMPViewAllGroup(userList, oldUserMap);
    }
    public void beforeUpdate()
    {
        TriggerOnUserService.updateLastExportDateAndHistoryTracking(userList, oldUserMap);
    }
}