public without sharing class EventTaskDetailPageController {


    @AuraEnabled
    public static Event fetchEvent(Id recordId)
    {
        return [SELECT Id, Subject, Description, Set_Up_By_new__c, Set_Up_By_new__r.Name, OwnerId, Owner.Name, WhoId, Who.Name, WhatId, What.Name, IsAllDayEvent, StartDateTime, EndDateTime,Is_Community_Activity__c,Type
                FROM Event where id=:recordId];
    }

    @AuraEnabled
    public static Task fetchTask(Id recordId)
    {
        return  [SELECT Id, Subject, Status, Priority, Set_Up_By_new__c, Set_Up_By_new__r.Name,OwnerId, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, Description
                FROM Task where id=:recordId];
    }

    @AuraEnabled
    public static String objectNamefromId(Id recordId)
    {
        return  recordId.getSObjectType().getDescribe().getName();
    }

    @AuraEnabled 
    public static String getUserTimeZone()
    {
        TimeZone tz = UserInfo.getTimeZone();
        return String.valueOf(tz);
    }
}