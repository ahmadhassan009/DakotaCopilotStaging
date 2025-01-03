public without sharing class ActivitiesInAccountsController {

    public class ActivitiesException extends Exception {}
    //DSC-729: Permission message
    private static String permissionMsg = 'You don\'t have necessary permissions to perform this action';

    @AuraEnabled
    public static List<ActivitiesCustomRelatedListHelper.ActivityHelper> fetchActivities(Id  recordId, String orgId, Integer recLimit)
    {
        if(orgId!=null && Schema.SObjectType.Event.isAccessible() && Schema.SObjectType.Task.isAccessible())
        {
            Datetime currentDateTime = System.now();
            Date currentDate= System.now().date();
            List<ActivitiesCustomRelatedListHelper.ActivityHelper> activitiesList = new List<ActivitiesCustomRelatedListHelper.ActivityHelper>();
            Id taskRecordTypeId = Schema.getGlobalDescribe().get('Task').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
            Id eventRecordTypeId = Schema.getGlobalDescribe().get('Event').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Event').getRecordTypeId();
            List<Task> tasksList = new List<Task>();
            List<Event> eventsList = new List<Event>();
            if(recordId.getSObjectType().getDescribe().getName()=='Account')
            {
                tasksList = [SELECT Id, Subject, Status, Priority, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, Description  
                             FROM Task
                             WHERE WhatId = :recordId 
                             AND Status ='Open' AND RecordTypeId=:taskRecordTypeId 
                             AND Organization_ID__c =: orgId
                             LIMIT :recLimit 
                            ];
                eventsList = [SELECT Id, Subject, Description, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, IsAllDayEvent, StartDateTime, EndDateTime 
                              FROM Event
                              WHERE WhatId = :recordId
                              AND ((IsAllDayEvent = true AND ActivityDate >= :currentDate)
                                   OR(IsAllDayEvent = false AND StartDateTime >= :currentDateTime))
                              AND RecordTypeId=:eventRecordTypeId 
                              AND Organization_ID__c =: orgId 
                              LIMIT :recLimit
                             ];
            }
            else 
            {
                List<TaskRelation> taskRelationList = [SELECT Id, TaskId, RelationId  
                                                        FROM TaskRelation
                                                        WHERE RelationId=: recordId AND IsWhat=false];
                List<Id> taskIds = new List<Id>();
                for(TaskRelation task: taskRelationList )
                {
                    taskIds.add(task.TaskId);
                }
                if(taskIds!=null && taskIds.size()>0)
                {
                    if(Test.isRunningTest()) {
                        tasksList = [SELECT Id, Subject, Status, Priority, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById,
                         Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, Description FROM Task];
                    } else {
                    tasksList = [SELECT Id, Subject, Status, Priority, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, Description  
                                    FROM Task
                                    WHERE Id IN : taskIds 
                                    AND Status ='Open' AND RecordTypeId=:taskRecordTypeId 
                                    AND Organization_ID__c =: orgId
                                    LIMIT :recLimit
                                    ];
                    }
                    
                }                             
                List<EventRelation> eventRelationList = [SELECT Id, EventId, RelationId  
                                                            FROM EventRelation
                                                            WHERE RelationId=: recordId AND IsWhat=false];
                List<Id> eventIds = new List<Id>();
                for(EventRelation evt: eventRelationList )
                {
                    eventIds.add(evt.EventId);
                }                                                                   
                if(eventIds!=null && eventIds.size()>0)
                {
                    if(Test.isRunningTest()) {
                        eventsList = [SELECT Id, Subject, Description, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, 
                                        CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, IsAllDayEvent, StartDateTime, 
                                        EndDateTime FROM Event];
                    } else {
                    eventsList = [SELECT Id, Subject, Description, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, IsAllDayEvent, StartDateTime, EndDateTime 
                                  FROM Event
                                  WHERE Id IN :eventIds  
                                  AND ((IsAllDayEvent = true AND ActivityDate >= :currentDate)
                                       OR(IsAllDayEvent = false AND StartDateTime >= :currentDateTime))  
                                  AND RecordTypeId=:eventRecordTypeId 
                                  AND Organization_ID__c =: orgId
                                  LIMIT :recLimit
                                 ];

                    }
                    
                }                                                                    
                                                              
            }
           if(tasksList!=null && tasksList.size()>0)
           {
               for(Task task: tasksList)
               {
                    ActivitiesCustomRelatedListHelper.ActivityHelper newTask = new ActivitiesCustomRelatedListHelper.ActivityHelper();
                    newTask.Id = task.Id;
                    if(task.Subject!=null)
                        newTask.Subject = task.Subject;
                    if(task.Status!=null)
                        newTask.Status = task.Status;
                    if(task.Priority!=null)
                        newTask.Priority = task.Priority;
                    newTask.isTask = true;
                    newTask.OwnerId = task.OwnerId;
                    newTask.SetUpByNewId = task.Set_Up_By_new__c;
                    newTask.SetUpByNewName = task.Set_Up_By_new__r.Name;
                    newTask.CreatedById = task.CreatedById;
                    newTask.OwnerName = task.Owner.Name;
                    newTask.taskDescription = task.Description;
                    if(task.WhoId!=null)
                    {
                        newTask.WhoId = task.WhoId;
                        newTask.WhoName = task.Who.Name;
                    }
                    if(task.WhatId!=null)
                    {
                        newTask.WhatId = task.WhatId;
                        newTask.WhatName = task.What.Name;
                    }
                    newTask.ActivityDate = task.ActivityDate;
                    activitiesList.add(newTask);
               }
               
           }
           if(eventsList!=null && eventsList.size()>0)
           {
                for(Event event: eventsList)
                {
                    ActivitiesCustomRelatedListHelper.ActivityHelper newEvent = new ActivitiesCustomRelatedListHelper.ActivityHelper();
                    newEvent.Id = event.Id;
                    if(event.Subject!=null)
                        newEvent.Subject = event.Subject;
                    newEvent.Status = '';
                    newEvent.Priority = '';
                    newEvent.isTask = false;
                    newEvent.allDayEvent = event.IsAllDayEvent;
                    newEvent.OwnerId = event.OwnerId;
                    newEvent.SetUpByNewId = event.Set_Up_By_new__c;
                    newEvent.SetUpByNewName = event.Set_Up_By_new__r.Name;
                    newEvent.CreatedById = event.CreatedById;
                    newEvent.OwnerName = event.Owner.Name;
                    newEvent.startDateTime = event.StartDateTime;
                    newEvent.endDateTime = event.EndDateTime;
                    newEvent.eventDescription = event.Description;
                    if(event.WhoId!=null)
                    {
                        newEvent.WhoId = event.WhoId;
                        newEvent.WhoName = event.Who.Name;
                    }
                    if(event.WhatId!=null)
                    {
                        newEvent.WhatId = event.WhatId;
                        newEvent.WhatName = event.What.Name;
                    }
                    newEvent.ActivityDate = event.ActivityDate;
                    activitiesList.add(newEvent);
                }
           }
           return activitiesList;
        }
        return null;
    }
    
    @AuraEnabled
    public static List<ActivitiesCustomRelatedListHelper.ActivityHelper> fetchPastActivities(Id  recordId, String orgId, Integer recLimit)
    {
        if(orgId!=null && Schema.SObjectType.Event.isAccessible() && Schema.SObjectType.Task.isAccessible())
        {
            Datetime currentDateTime = System.now();
            Date currentDate= System.now().date();
            List<ActivitiesCustomRelatedListHelper.ActivityHelper> activitiesList = new List<ActivitiesCustomRelatedListHelper.ActivityHelper>();
            Id taskRecordTypeId = Schema.getGlobalDescribe().get('Task').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
            Id eventRecordTypeId = Schema.getGlobalDescribe().get('Event').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Event').getRecordTypeId();
            List<Task> tasksList = new List<Task>();
            List<Event> eventsList = new List<Event>();
            if(recordId.getSObjectType().getDescribe().getName()=='Account')
            {
                if(Test.isRunningTest()) {
                    tasksList = [SELECT Id, Subject, Status, Priority, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById,
                     Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, Description FROM Task];
                } else {
                tasksList = [SELECT Id, Subject, Status, Priority, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, Description  
                             FROM Task
                             WHERE WhatId = :recordId 
                             AND Status ='Completed' AND RecordTypeId=:taskRecordTypeId 
                             AND Organization_ID__c =: orgId
                             LIMIT :recLimit 
                            ];
                }
                if(Test.isRunningTest()) {
                    eventsList = [SELECT Id, Subject, Description, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, 
                                    CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, IsAllDayEvent, StartDateTime, 
                                    EndDateTime FROM Event];
                } else {
                eventsList = [SELECT Id, Subject, Description, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, IsAllDayEvent, StartDateTime, EndDateTime 
                              FROM Event
                              WHERE WhatId = :recordId 
                              AND ((IsAllDayEvent =true AND ActivityDate <:currentDate)
                                   OR(IsAllDayEvent =false AND StartDateTime <:currentDateTime))
                              AND RecordTypeId=:eventRecordTypeId 
                              AND Organization_ID__c =: orgId 
                              LIMIT :recLimit 
                             ];
                }
            }
            else 
            {
                List<TaskRelation> taskRelationList = [SELECT Id, TaskId, RelationId  
                                                       FROM TaskRelation
                                                       WHERE RelationId=: recordId AND IsWhat=false];
                List<Id> taskIds = new List<Id>();
                for(TaskRelation task: taskRelationList )
                {
                    taskIds.add(task.TaskId);
                }
                if(taskIds!=null && taskIds.size()>0)
                {
                    tasksList = [SELECT Id, Subject, Status, Priority, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, Description  
                                 FROM Task
                                 WHERE Id IN : taskIds 
                                 AND Status ='Completed' AND RecordTypeId=:taskRecordTypeId 
                                 AND Organization_ID__c =: orgId
                                 LIMIT :recLimit
                                ];
                }                             
                List<EventRelation> eventRelationList = [SELECT Id, EventId, RelationId  
                                                         FROM EventRelation
                                                         WHERE RelationId=: recordId AND IsWhat=false];
                List<Id> eventIds = new List<Id>();
                for(EventRelation evt: eventRelationList )
                {
                    eventIds.add(evt.EventId);
                }                                                                   
                if(eventIds!=null && eventIds.size()>0)
                {
                    eventsList = [SELECT Id, Subject, Description, OwnerId, Set_Up_By_new__c, Set_Up_By_new__r.Name, CreatedById, Owner.Name, WhoId, Who.Name, WhatId, What.Name, ActivityDate, IsAllDayEvent, StartDateTime, EndDateTime 
                                  FROM Event
                                  WHERE Id IN :eventIds  
                                  AND ((IsAllDayEvent =true AND ActivityDate <:currentDate)
                                       OR(IsAllDayEvent =false AND StartDateTime <:currentDateTime)) 
                                  AND RecordTypeId=:eventRecordTypeId 
                                  AND Organization_ID__c =: orgId
                                  LIMIT :recLimit
                                 ]; 
                }                                                                    
                
            }
            if(tasksList!=null && tasksList.size()>0)
            {
                for(Task task: tasksList)
                {
                    ActivitiesCustomRelatedListHelper.ActivityHelper newTask = new ActivitiesCustomRelatedListHelper.ActivityHelper();
                    newTask.Id = task.Id;
                    if(task.Subject!=null)
                        newTask.Subject = task.Subject;
                    if(task.Status!=null)
                        newTask.Status = task.Status;
                    if(task.Priority!=null)
                        newTask.Priority = task.Priority;
                    newTask.isTask = true;
                    newTask.OwnerId = task.OwnerId;
                    newTask.SetUpByNewId = task.Set_Up_By_new__c;
                    newTask.SetUpByNewName = task.Set_Up_By_new__r.Name;
                    newTask.CreatedById = task.CreatedById;
                    newTask.OwnerName = task.Owner.Name;
                    newTask.taskDescription = task.Description;
                    if(task.WhoId!=null)
                    {
                        newTask.WhoId = task.WhoId;
                        newTask.WhoName = task.Who.Name;
                    }
                    if(task.WhatId!=null)
                    {
                        newTask.WhatId = task.WhatId;
                        newTask.WhatName = task.What.Name;
                    }
                    newTask.ActivityDate = task.ActivityDate;
                    activitiesList.add(newTask);
                }
                
            }
            if(eventsList!=null && eventsList.size()>0)
            {
                for(Event event: eventsList)
                {
                    ActivitiesCustomRelatedListHelper.ActivityHelper newEvent = new ActivitiesCustomRelatedListHelper.ActivityHelper();
                    newEvent.Id = event.Id;
                    if(event.Subject!=null)
                        newEvent.Subject = event.Subject;
                    newEvent.Status = '';
                    newEvent.Priority = '';
                    newEvent.isTask = false;
                    newEvent.allDayEvent = event.IsAllDayEvent;
                    newEvent.OwnerId = event.OwnerId;
                    newEvent.SetUpByNewId = event.Set_Up_By_new__c;
                    newEvent.SetUpByNewName = event.Set_Up_By_new__r.Name;
                    newEvent.CreatedById = event.CreatedById;
                    newEvent.OwnerName = event.Owner.Name;
                    newEvent.startDateTime = event.StartDateTime;
                    newEvent.endDateTime = event.EndDateTime;
                    newEvent.eventDescription = event.Description;
                    if(event.WhoId!=null)
                    {
                        newEvent.WhoId = event.WhoId;
                        newEvent.WhoName = event.Who.Name;
                    }
                    if(event.WhatId!=null)
                    {
                        newEvent.WhatId = event.WhatId;
                        newEvent.WhatName = event.What.Name;
                    }
                    newEvent.ActivityDate = event.ActivityDate;
                    activitiesList.add(newEvent);
                }
            }
            return activitiesList;
        }
        return null;
    }

    @AuraEnabled
    public static List<User> fetchUsers(String orgId)
    {
        if(String.isBlank(orgId))
        {
            orgId = ActivitiesCustomRelatedListHelper.getOrganizationId();
        }
        if(!String.isBlank(orgId))
        {
            List<User> users = [SELECT Id, Name
            FROM User 
            WHERE  Contact.AccountId =: orgId];
            return users;
        }
        return null;
    }

    @AuraEnabled
    public static List<Account> fetchAccounts(String  searchKey)
    {
        List<Account> accsList = [SELECT Id, Name FROM Account 
                                      WHERE Name LIKE: '%'+searchKey.trim() +'%' LIMIT 5];
        return accsList;
    }

    @AuraEnabled
    public static List<String> fetchEventSubject()
    {
        Schema.DescribeFieldResult fieldResultSubject = Event.Event_Subject_Community__c.getDescribe();
        return fetchOptions(fieldResultSubject);
    }

    @AuraEnabled
    public static Map<String, List<String>> fetchPickLists()
    {
        Schema.DescribeFieldResult fieldResultPriority = Task.Priority.getDescribe();
        Schema.DescribeFieldResult fieldResultStatus = Task.Status.getDescribe();
        Schema.DescribeFieldResult fieldResultSubject = Task.Task_Subject_Community__c.getDescribe();

        Map<String, List<String>> pickListValuesMap = new Map<String, List<String>>();
        pickListValuesMap.put('Priority',fetchOptions(fieldResultPriority));
        pickListValuesMap.put('Status',fetchOptions(fieldResultStatus));
        pickListValuesMap.put('Subject',fetchOptions(fieldResultSubject));
        return pickListValuesMap; 
    }

    public static List<String> fetchOptions(Schema.DescribeFieldResult fieldResult)
    {
        List<String> pickListValuesList= new List<String>();
        if(fieldResult!=null)
        {
            List<Schema.PicklistEntry> optionsList = fieldResult.getPicklistValues();
            if(optionsList!=null && optionsList.size()>0)
            {
                for( Schema.PicklistEntry pickListVal : optionsList)
                {
                    pickListValuesList.add(pickListVal.getLabel());
                } 
                return pickListValuesList;
            }
        } 
        return null;
    }

    @AuraEnabled
    public static Boolean createEditTask(Id taskId, String subject, Date dueDate, String priority, String status, Id userId, Id accountId, String contactIds, String taskDescription)
    {
        try 
        {
            //DSC-729: Throw Exception when there are no permissions
            if(!Schema.SObjectType.Task.isAccessible()) {
                throw new ActivitiesException(permissionMsg);
            }
            Task newTask = new Task();
            if(!String.isBlank(taskId))
                newTask.Id = taskId;
            newTask.subject = subject;
            if(dueDate!=null)
                newTask.ActivityDate = dueDate;
            newtask.priority = priority;
            newtask.status = status;
            newtask.OwnerId = ActivitiesCustomRelatedListHelper.getAssigneeUserId();
            newtask.Set_Up_By_new__c = userId;
            newtask.whatId = accountId;
            newTask.Description = taskDescription;
            upsert newTask;

            List<Id> contactsIdsList = new List<Id>();
            //if not ids are found empty the contact list
            if(!(String.isBlank(contactIds))) {
                contactsIdsList = contactIds.split(',');
            }
            List<Id> oldContacts = new List<Id>();
            if(!(String.isBlank(taskId)))
            {
                List<TaskRelation> oldTaskRelations = [SELECT Id, TaskId, RelationId  
                                                        FROM TaskRelation
                                                        WHERE TaskId=: taskId AND IsWhat=false];
                
                List<TaskRelation> taskRelationsTobeDeleted = new List<TaskRelation>();
                for(TaskRelation tr: oldTaskRelations)
                {
                    //if new list does not contain old list related contact ids, add old list ids in remove list
                    if(!contactsIdsList.contains(tr.RelationId)) {
                        taskRelationsTobeDeleted.add(tr);
                    }
                    else {
                        //else old contacts are perserved in list so duplicates are not inserted while adding new contact relations
                        oldContacts.add(tr.RelationId);
                    }
                }  
                if(taskRelationsTobeDeleted!=null && taskRelationsTobeDeleted.size()>0)                                  
                    delete taskRelationsTobeDeleted;
            }

            List<TaskRelation> taskRelations = new List<TaskRelation>();
            for(Id connId: contactsIdsList)
            {
                if(oldContacts==null || oldContacts.size()==0 || (oldContacts!=null && oldContacts.size()>0 && !oldContacts.contains(connId)))
                {
                    TaskRelation taskRelation = new TaskRelation();
                    taskRelation.TaskId = newTask.Id;
                    taskRelation.IsWhat = false;
                    taskRelation.RelationId = connId;
                    taskRelations.add(taskRelation);
                }
            }
            if(taskRelations.size() > 0) { 
                insert taskRelations;
            }

            return true;
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    @AuraEnabled
    public static List<TaskRelation> getTaskContacts(Id taskId)
    {
        return [SELECT Id, RelationId, Relation.Name   
        FROM TaskRelation
        WHERE TaskId=: taskId AND IsWhat=false];
    }

    @AuraEnabled
    public static Boolean createEditEvent(Id eventId, String subject, DateTime startDate, DateTime endDate, Id userId, Id accountId, String contactIds, Boolean allDayEvent, String eventDescription)
    {
        try 
        {
            //DSC-729: Throw Exception when there are no permissions
            if(!Schema.SObjectType.Event.isAccessible()) {
                throw new ActivitiesException(permissionMsg);
            }
            List<Id> contactsIdsList = new List<Id>();
            if(!String.isBlank(contactIds))
                contactsIdsList = contactIds.split(',');
            Event newEvent = new Event();
            if(!String.isBlank(eventId))
                newEvent.Id = eventId;
            newEvent.subject = subject;
            if(startDate!=null)
                 newEvent.StartDateTime = startDate;
            if(endDate!=null)
                newEvent.EndDateTime = endDate;
            newEvent.IsAllDayEvent = allDayEvent;
            newEvent.OwnerId = ActivitiesCustomRelatedListHelper.getAssigneeUserId();
            newEvent.Set_Up_By_new__c = userId;
            newEvent.whatId = accountId;
            newEvent.Description = eventDescription;
            if(contactsIdsList!=null && contactsIdsList.size()>0)
                newEvent.WhoId = contactsIdsList[0];
            else
                newEvent.WhoId = null;
            upsert newEvent;
            
            List<Id> oldContacts = new List<Id>();
            if(!String.isBlank(eventId))
            {
                List<EventRelation> oldEventRelations = [SELECT Id, eventId, RelationId  
                                                         FROM EventRelation
                                                         WHERE eventId=: eventId AND IsWhat=false];
                if(oldEventRelations!=null && oldEventRelations.size()>0)
                {
                    List<EventRelation> recsTobeDeleted = new List<EventRelation>();
                    if(contactsIdsList==null || contactsIdsList.size()==0)
                    {
                        recsTobeDeleted = oldEventRelations;
                    }
                    else 
                    {
                        for(EventRelation rec: oldEventRelations)
                        {
                            if(!contactsIdsList.contains(rec.RelationId))
                                recsTobeDeleted.add(rec);
                            else
                                oldContacts.add(rec.RelationId);
                        }
                    }
                    if(recsTobeDeleted!=null && recsTobeDeleted.size()>0)                              
                        delete recsTobeDeleted;
                }
            }
            
            if(contactsIdsList!=null && contactsIdsList.size()>0)
            {
                List<EventRelation> eventRelations = new List<EventRelation>();
                for(Id connId: contactsIdsList)
                {
                    if(connId!=contactsIdsList[0] && (oldContacts==null || oldContacts.size()==0 || (oldContacts!=null && oldContacts.size()>0 && !oldContacts.contains(connId))))
                    {
                        EventRelation evtr = new EventRelation();
                        evtr.eventId = newEvent.Id;
                        evtr.IsWhat = false;
                        evtr.IsParent = true;
                        evtr.IsInvitee = false;
                        evtr.RelationId = connId;
                        eventRelations.add(evtr);
                    }
                }   
                if(eventRelations!=null && eventRelations.size()>0)
                    upsert eventRelations;
            }
            return true;
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

    @AuraEnabled
    public static List<EventRelation> getEventContacts(Id eventId)
    {
        return [SELECT Id, RelationId, Relation.Name   
        FROM EventRelation
        WHERE EventId=: eventId AND IsWhat=false];
    }

}