public without sharing class ActivitiesCustomRelatedListHelper 
{
    public class ActivitiesException extends Exception {}
    //DSC-729: Permission message
    private static String permissionMsg = 'You don\'t have necessary permissions to perform this action';
    
    public class ActivityHelper
    {
        @AuraEnabled public String Id { get; set; }
        @AuraEnabled public String Subject { get; set; }
        @AuraEnabled public String Status { get; set; }
        @AuraEnabled public String Priority { get; set; }
        @AuraEnabled public Boolean isTask { get; set; }
        @AuraEnabled public String OwnerId { get; set; }
        @AuraEnabled public String OwnerName { get; set; }
        @AuraEnabled public String SetUpByNewId { get; set; }
        @AuraEnabled public String SetUpByNewName { get; set; }
        @AuraEnabled public String CreatedById { get; set; }
        @AuraEnabled public String WhoId { get; set; }
        @AuraEnabled public String WhoName { get; set; }
        @AuraEnabled public String WhatId { get; set; }
        @AuraEnabled public String WhatName { get; set; }
        @AuraEnabled public Date ActivityDate { get; set; }
        @AuraEnabled public Boolean allDayEvent { get; set; }
        @AuraEnabled public DateTime startDateTime { get; set; }
        @AuraEnabled public DateTime endDateTime { get; set; }
        @AuraEnabled public String eventDescription { get; set; }
        @AuraEnabled public String taskDescription { get; set; }
    }
    
    @AuraEnabled
    public static String getOrganizationId()
    {     
        List<User> users = [SELECT Id, ContactId,Contact.AccountId
                            FROM User 
                            WHERE Id=:UserInfo.getUserId()  
                            AND IsPortalEnabled=true
                            AND ContactId!=null
                            AND Contact.AccountId!=null];
        if(users!=null && users.size()>0)
        {
            return users[0].Contact.AccountId;
        }
        return null;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getSessionId()
    {
        return RecordsFavoriteController.getSessionIdFrmVFPg();
    }
    
    @AuraEnabled
    public static Boolean checkActivityPermissions(){
        try {
            if(Schema.SObjectType.Event.isAccessible() && Schema.SObjectType.Task.isAccessible()) {
                return true;
            }
            return false;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    /**
     * function returns account name
     */
    @AuraEnabled
    public static Account getAccountName(Id recordId) {
        return [
            SELECT Name
            FROM Account
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ];
    }
    
    @AuraEnabled
    public static Contact getContactName(Id recordId) {
        return [
            SELECT Id, Name
            FROM Contact
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ];
    }

    @AuraEnabled
    public static string getSFBaseUrl()
    {
        String sfdcBaseURL = URL.getSalesforceBaseUrl().toExternalForm();
        return sfdcBaseURL;
    }
    
    /** 
    * function returns the name of the object
    */
    @AuraEnabled
    public static String getObjectName(String recordId)
    {
        return Id.valueOf(recordId).getSObjectType().getDescribe().getName();
    }
    
    @AuraEnabled
    public static SObject fetchParentRecord(Id recordId) 
    {
        if(recordId.getSObjectType().getDescribe().getName()=='Contact')
        {
            return [
                SELECT Id, Name
                FROM Contact
                WHERE Id =: recordId
                ORDER BY Name LIMIT 1
            ];
        }
        else 
        {
            return [
                SELECT Id, Name
                FROM Account
                WHERE Id =: recordId
                ORDER BY Name LIMIT 1
            ];
        }
    }
    
    @AuraEnabled
    public static Boolean recordExists(Id recordId) {
        if(recordId.getSObjectType().getDescribe().getName()=='Task')
        {
            List<Task> tasks = [SELECT Id FROM Task WHERE Id = :recordId];
            if(tasks!=null && tasks.size()>0)
                return true;
        }
        else {
            List<Event> events =[SELECT Id FROM Event WHERE Id = :recordId];
            if(events!=null && events.size()>0)
                return true;
        }
        return false;
    }
    
    @AuraEnabled
    public static Boolean deleteActivity(Id recordId)
    {
        try{
            List<Database.DeleteResult> deletedActivities = new List<Database.DeleteResult>();
            if(recordId.getSObjectType().getDescribe().getName()=='Task')
            {
                //DSC-729: Throw Exception when there are no permissions
                if(!Schema.SObjectType.Task.isAccessible()) {
                    throw new ActivitiesException(permissionMsg);
                }
                deletedActivities = Database.delete([SELECT Id
                FROM Task
                WHERE Id = :recordId]);
            }
            else {
                //DSC-729: Throw Exception when there are no permissions
                if(!Schema.SObjectType.Task.isAccessible()) {
                    throw new ActivitiesException(permissionMsg);
                }
                deletedActivities = Database.delete([SELECT Id
                FROM Event
                WHERE Id = :recordId]);
            }
            if(deletedActivities!=null && deletedActivities.size()>0)
                return true;
            
            return false;
        }
        catch(Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    public static String getAssigneeUserId() {
        String assigneeUsername  = System.Label.community_activities_assignee;
        List<User> assigneeUser = [SELECT Id FROM User WHERE username = :assigneeUsername];
        if (assigneeUser != null && assigneeUser.size() > 0) {
            return assigneeUser[0].Id;
        }
        return '';
    }
}