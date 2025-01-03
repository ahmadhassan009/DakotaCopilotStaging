public class TriggerOnContactService {
    
    public static List<Update__c> logRecordHistoryInParentAccounts(List<Contact> newContacts, Map<Id,Contact> oldContacts)
    {
        List<Update__c> recordHistoriesToInsert = new List<Update__c>();
        
        Set<Id> accountIds = new Set<Id>();
        if(newContacts!=null)
        {
            for(Contact con : newContacts)
            {
                accountIds.add(con.AccountId);
            }
        }
        if(oldContacts!=null)
        {
            for(Contact con : oldContacts.values())
            {
                accountIds.add(con.AccountId);
            }
        }
        Map<Id,Account> accountsOfContacts = new Map<Id,Account>([Select Id,Name,Website,Type,toLabel(Investment_Focus_single__c) from Account where Id In: accountIds]);
        Set<Id> jobChangesContacts = new Set<Id>();
        Id investmentFirmContactRecTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_360_Contact').getRecordTypeId();
        
        if(newContacts!=null) //Upsert case
        {
            for(Contact con : newContacts)
            {
                if(oldContacts==null || (oldContacts!=null && con.AccountId != oldContacts.get(con.Id).AccountId)) //Upsert
                {
                    recordHistoriesToInsert.add(createJoinedContactRecordHistory(con, accountsOfContacts, oldContacts,investmentFirmContactRecTypeId));
                }
                else if(oldContacts!=null && con.Title != oldContacts.get(con.Id).Title) //Update
                {
                    //Creates Activity Stream Record with updated Title
                    recordHistoriesToInsert.add(createContactTitleUpdateHistory(con,accountsOfContacts, oldContacts,investmentFirmContactRecTypeId));
                }
                // //filter contacts whose job changes
                // if(((Trigger.IsUpdate && oldContacts != null && (oldContacts.get(con.Id).AccountId != con.AccountId)))){
                //     jobChangesContacts.add(con.Id);
                // }
            }
            // /**
            // * DSC-830: send email on account change to users who mark the contact as favorite 
            // */
            // if(jobChangesContacts.size() > 0 ){
            //     System.enqueueJob(new SendJobChangeNotificationsQueueable(jobChangesContacts));
            // }
        }
        else if(oldContacts!=null) //Delete Case
        {
            for(Contact con : oldContacts.values())
            {
                if(con.AccountId!=null)
                {
                    recordHistoriesToInsert.add(createLeftContactRecordHistory(con,investmentFirmContactRecTypeId));
                }
            }
        }
        
        return recordHistoriesToInsert;
    }
    
    public static Update__c createJoinedContactRecordHistory(Contact con, Map<Id,Account> accountsOfContacts, Map<Id,Contact> oldContacts,Id investmentFirmContactRecTypeId)
    {
        Update__c activitystream = new Update__c();
        activitystream.Contact__c = con.Id; 
        activitystream.Firm_Joined__c = con.AccountId != null ? con.AccountId : null;
        activitystream.Firm_Left__c = oldContacts != null ? oldContacts.get(con.Id).AccountId != null ? oldContacts.get(con.Id).AccountId : null : null;
        activitystream.Firm_Left_Investment_Focus__c = oldContacts != null ? accountsOfContacts.get(oldContacts.get(con.Id).AccountId)!=null ? accountsOfContacts.get(oldContacts.get(con.Id).AccountId).Investment_Focus_single__c : null : null;
        activitystream.New_Title__c = con.Title;
        activitystream.Firm_Left_Account_Type__c = activitystream.Firm_Left__c != null ? accountsOfContacts.containsKey(activitystream.Firm_Left__c) ? accountsOfContacts.get(activitystream.Firm_Left__c).Type : null :null;
        activitystream.Old_Title__c = oldContacts != null ? oldContacts.get(con.Id).Title != null ? oldContacts.get(con.Id).Title : null : con.Title;
        activitystream.New_Firm_Website__c = accountsOfContacts.containsKey(con.AccountId) ? accountsOfContacts.get(con.AccountId).Website : null;
        activitystream.Firm_Joined_Account_Type__c = accountsOfContacts.containsKey(con.AccountId) ? accountsOfContacts.get(con.AccountId).Type : null;
        activitystream.Firm_Joined_Investment_Focus__c = accountsOfContacts.containsKey(con.AccountId) ? accountsOfContacts.get(con.AccountId).Investment_Focus_single__c : null;
        activitystream.Type__c = 'Marketplace Personnel changes';
        activitystream.Last_Updated_Date__c = System.now();
        activitystream.RecordChangedBy__c = UserInfo.getUserId();
        activitystream.Is_Accessible__c = con.Marketplace_Verified_Contact__c;
        activitystream.Is_Accessible_Everest__c = con.RecordTypeId == investmentFirmContactRecTypeId ? true : false;
        activitystream.GDPR_Exempt__c = con.GDPR_Exempt__c;
        activitystream.Metro_Area__c = con.Metro_Area__c;
        return activitystream;
    }
    
    public static Update__c createContactTitleUpdateHistory(Contact con,Map<Id,Account> accountsOfContacts, Map<Id,Contact> oldContacts,Id investmentFirmContactRecTypeId)
    {
        Update__c activitystream = new Update__c();
        activitystream.Contact__c = con.Id;
        activitystream.Account__c = con.AccountId;
        activitystream.New_Title__c = con.Title;
        activitystream.Old_Title__c = oldContacts.get(con.Id).Title;
        activitystream.Type__c = 'Marketplace Personnel changes';
        activitystream.Last_Updated_Date__c = System.now();
        activitystream.RecordChangedBy__c = UserInfo.getUserId();
        activitystream.Is_Accessible__c = con.Marketplace_Verified_Contact__c;
        activitystream.Is_Accessible_Everest__c = con.RecordTypeId == investmentFirmContactRecTypeId ? true : false;
        activitystream.GDPR_Exempt__c = con.GDPR_Exempt__c;
        activitystream.Metro_Area__c = con.Metro_Area__c;
        activitystream.Role_Change_Account_Type__c = accountsOfContacts.containsKey(con.AccountId) ? accountsOfContacts.get(con.AccountId).Type : null;
        activitystream.Investment_Focus__c = accountsOfContacts.containsKey(con.AccountId) ? accountsOfContacts.get(con.AccountId).Investment_Focus_single__c : null;
        return activitystream;
    }
    
    public static Update__c createLeftContactRecordHistory(Contact con,Id investmentFirmContactRecTypeId)
    {
        Update__c oldAccountHistory = new Update__c();
        oldAccountHistory.Account__c = con.AccountId; 
        oldAccountHistory.Contact__c = con.Id; 
        oldAccountHistory.Firm_Left__c = con.AccountId; 
        oldAccountHistory.Contact_Deleted__c = (con.FirstName!=null ? con.FirstName +' '+con.LastName : con.LastName);
        oldAccountHistory.Type__c = 'Marketplace Personnel changes';
        oldAccountHistory.Last_Updated_Date__c = System.now();
        oldAccountHistory.RecordChangedBy__c = UserInfo.getUserId();
        oldAccountHistory.Is_Accessible__c = con.Marketplace_Verified_Contact__c;
        oldAccountHistory.Is_Accessible_Everest__c = con.RecordTypeId == investmentFirmContactRecTypeId ? true : false;
        oldAccountHistory.GDPR_Exempt__c = con.GDPR_Exempt__c;
        oldAccountHistory.Metro_Area__c = con.Metro_Area__c;
        return oldAccountHistory;
    }
    
    public static void logDeletionRecordHistoryInParentAccounts(List<Contact> newContacts, Map<Id,Contact> oldContacts, List<Update__c> leftHistories)
    {
        Set<Id> duplicateMergedContacts = new Set<Id>();
        List<Update__c> historyRecordsToBeInserted = new List<Update__c>();
        if(oldContacts != null) //Delete Case
        {
            for(Contact con : oldContacts.values())
            {
                if(con.MasterRecordId != null)
                {
                    duplicateMergedContacts.add(con.Id);
                }
            }
        }
        
        for(Update__c hist : leftHistories)
        {
            if(!duplicateMergedContacts.contains(hist.Contact__c)){
                hist.Contact__c = null;
                historyRecordsToBeInserted.add(hist);
            }
        }
        insert historyRecordsToBeInserted;
    }
    
    public static void insertPlatformValues(List<Contact> newCon)
    {
        List<refreshComponents__e> refreshRecordEvents = new List<refreshComponents__e>();
        for(Contact con:newCon)
        { 
            if(con.Metro_Area__c != null){
                refreshRecordEvents.add(new refreshComponents__e(
                    recordUsed__c = con.Metro_Area__c,
                    UserUsed__c = UserInfo.getUserId(),
                    userSession__c=UserInfo.getSessionId()
                ));
            }
            
            if(con.AccountId != null){
                refreshRecordEvents.add(new refreshComponents__e(
                    recordUsed__c = con.Metro_Area__c,
                    UserUsed__c = UserInfo.getUserId(),
                    userSession__c=UserInfo.getSessionId()
                )); 
            }
        }
        EventBus.publish(refreshRecordEvents);
    }
    
    public static void sendContactCreateNotificationEmail(List<Contact> newCon){
        
        CreateContactNotificationEmail.sendContactCreateNotificationEmail(newCon);
    }
    
    /**
    * DSC-765: On Account Update, Update the Organization of Community User (if created)
    */
    public static void updateOrganizationIdOnAccountUpdate(List<Contact> newContacts, Map<Id, Contact> oldContacts) {
        Map<String, User> communitytUserMap = new Map<String, User>();
        //getting the community users from the updated contact list
        for (User user : [SELECT Id,Contact.Id FROM User WHERE isPortalEnabled = true AND ContactId IN :newContacts]) {
            communitytUserMap.put(user.Contact.Id, user);
        }
        
        Map<Id, Id> communitytUserIdMap = new Map<Id, Id>();
        for(Contact con : newContacts) {
            Id oldAccountId;
            if(oldContacts.get(con.Id) != null) {
                oldAccountId = oldContacts.get(con.Id).AccountId;
            }
            //if contact's account is updated, add the conact user in User list to update Org Id
            if(con.AccountId != oldAccountId) {
                if(communitytUserMap.get(con.Id) != null) {
                    communitytUserIdMap.put(communitytUserMap.get(con.Id).Id, con.AccountId);
                }
            }
        }
        if(communitytUserIdMap.size() > 0) {
            //Queueuing job to update User to avoid mixed DML exception
            System.enqueueJob(new UpdateUserOrganizationIdQueueable(communitytUserIdMap));
        }
    }
    
    
    public static void populateNumberOfContactsOnMetroArea(List<Contact> newContacts, Map<Id, Contact> oldContacts)
    {        
        Set<Id> parentMetroAreaIds = new Set<Id>();
        Map<Id, Integer> contactCountMapForMP = new Map<Id, Integer>();
        Map<Id, Integer> contactCountMapForEverest = new Map<Id, Integer>();
        if(Trigger.isInsert || Trigger.isUpdate) //Insert or Update case
        {
            for(Contact con : newContacts)
            {
                if(Trigger.isInsert && con.Metro_Area__c!=null) //Insert case
                {
                    parentMetroAreaIds.add(con.Metro_Area__c);
                }
                else if(Trigger.isUpdate) //Update case
                {
                    if(con.Metro_Area__c!=oldContacts.get(con.Id).Metro_Area__c || con.RecordTypeId!=oldContacts.get(con.Id).RecordTypeId ||
                       con.Marketplace_Verified_Contact__c!=oldContacts.get(con.Id).Marketplace_Verified_Contact__c)
                    {
                        if(con.Metro_Area__c!=null)
                        {
                            parentMetroAreaIds.add(con.Metro_Area__c);
                            contactCountMapForMP.put(con.Metro_Area__c, 0);
                            if(con.Marketplace_Verified_Contact__c==oldContacts.get(con.Id).Marketplace_Verified_Contact__c)
                            {
                                contactCountMapForEverest.put(con.Metro_Area__c, 0);
                            }
                        }
                        if(oldContacts.get(con.Id).Metro_Area__c != null)
                        {
                            parentMetroAreaIds.add(oldContacts.get(con.Id).Metro_Area__c);
                            contactCountMapForMP.put(oldContacts.get(con.Id).Metro_Area__c,0);
                            if(con.Marketplace_Verified_Contact__c==oldContacts.get(con.Id).Marketplace_Verified_Contact__c)
                            {
                                contactCountMapForEverest.put(oldContacts.get(con.Id).Metro_Area__c,0);
                            }
                        }
                    }
                }
            }
        }
        
        if(Trigger.isDelete) //Delete case
        {
            for(Contact con : oldContacts.values())
            {
                if(con.Metro_Area__c!=null) //Insert case
                {
                    parentMetroAreaIds.add(con.Metro_Area__c);
                    contactCountMapForMP.put(con.Metro_Area__c, 0);
                    contactCountMapForEverest.put(con.Metro_Area__c, 0);
                }
            }            
        }
        
        //Prepare Count Map For Sort Order (Marketplace)
        for (AggregateResult aggRes : [Select Count(Id) numofInvestmentContacts, Metro_Area__c from Contact where RecordType.DeveloperName = 'Dakota_Investments_Contact' 
                                       and Marketplace_Verified_Contact__c = true and Metro_Area__c in :parentMetroAreaIds Group by Metro_Area__c]) 
        {
            Id parentMetroAreaId = (Id) aggRes.get('Metro_Area__c');
            Integer numofContacts = (Integer) aggRes.get('numofInvestmentContacts');
            contactCountMapForMP.put(parentMetroAreaId, numofContacts);
        }
        if(contactCountMapForMP.size()>0)
        {
            List<Metro_Area__c> metroareasToUpdate = new List<Metro_Area__c>();
            for(Metro_Area__c metroarea : [Select Id, Number_of_Contacts__c from Metro_Area__c where Id in :contactCountMapForMP.keySet()])
            {
                if(contactCountMapForMP.containsKey(metroarea.Id))
                {
                    metroarea.Number_of_Contacts__c = contactCountMapForMP.get(metroarea.Id);
                    metroareasToUpdate.add(metroarea);
                }
            }
            update metroareasToUpdate;
        }
        
        //Prepare Count Map For Sort Order (Everest)
        Id investmentFirmContactRecTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_360_Contact').getRecordTypeId();
        for (AggregateResult aggRes : [Select Count(Id) numofMarketplaceContacts, Metro_Area__c from Contact where RecordTypeId = :investmentFirmContactRecTypeId and
                                       Metro_Area__c in :parentMetroAreaIds Group by Metro_Area__c]) 
        {
            Id parentMetroAreaId = (Id) aggRes.get('Metro_Area__c');
            Integer numofContacts = (Integer) aggRes.get('numofMarketplaceContacts');
            contactCountMapForEverest.put(parentMetroAreaId, numofContacts);
        }
        if(contactCountMapForEverest.size()>0)
        {
            List<Metro_Area__c> metroareasToUpdate = new List<Metro_Area__c>();
            for(Metro_Area__c metroarea : [Select Id, Number_of_Everest_Contacts__c from Metro_Area__c where Id in :contactCountMapForEverest.keySet()])
            {
                if(contactCountMapForEverest.containsKey(metroarea.Id))
                {
                    metroarea.Number_of_Everest_Contacts__c = contactCountMapForEverest.get(metroarea.Id);
                    metroareasToUpdate.add(metroarea);
                }
            }
            update metroareasToUpdate;
        }
        
    }
    
    /**
    * Send Article 14 GDPR email when contact is MP verified
    */
    public static void sendNotificationOnMPVerification(List<Contact> newContacts, Map<Id, Contact> oldContacts)
    {
        Map<Id,Contact> marketplaceVerifiedContacts = new Map<Id,Contact>();
        Map<Id,Task> existingTaskForContacts = new Map<Id,Task>();
        for(Contact cnct:newContacts)
        {
            if((Trigger.IsInsert || 
                (Trigger.IsUpdate && oldContacts != null && oldContacts.get(cnct.Id) != null &&
                 ((oldContacts.get(cnct.Id).Marketplace_Verified_Contact__c == false && oldContacts.get(cnct.Id).RecordTypeId == Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId()) || (oldContacts.get(cnct.Id).GP_Verified_Contact__c == false && oldContacts.get(cnct.Id).RecordTypeId == Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_360_Contact').getRecordTypeId() )  || 
                  (oldContacts.get(cnct.Id).MailingCountry != null && !checkMailingCountry(oldContacts.get(cnct.Id).MailingCountry.toLowercase())) || 
                  (oldContacts.get(cnct.Id).MailingCountry == null && cnct.MailingCountry != oldContacts.get(cnct.Id).MailingCountry)
                 ))) &&
               ((cnct.Marketplace_Verified_Contact__c == true && cnct.RecordTypeId == Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId()) || (cnct.GP_Verified_Contact__c == true && cnct.RecordTypeId == Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_360_Contact').getRecordTypeId())) && 
               cnct.Email != null && 
               cnct.MailingCountry != null && 
               checkMailingCountry(cnct.MailingCountry.toLowercase()))
            {
                marketplaceVerifiedContacts.put(cnct.Id,cnct);
            }
        }
        
        List<Messaging.SingleEmailMessage> emailsToBeSent = new List<Messaging.SingleEmailMessage>();
        List<Task> tasksToBeCreated = new List<Task>();
        
        List<EmailTemplate> emailTemplate = [Select Id,Subject,Description,HtmlValue,DeveloperName,Body from EmailTemplate where DeveloperName = 'Marketplace_Verified_Contact_Email'];
        List<OrgWideEmailAddress> orgWideAddress = [Select Id, Address, DisplayName from OrgWideEmailAddress where Address = 'noreply@dakotalivemail.com' Limit 1];
        
        String taskAssigneeUserName = System.label.Article_14_GDPR_Task_Assignee;
        List<User> assigneeUser = [Select Id,Name from User where IsActive = true and UserName = :taskAssigneeUserName Limit 1];
        
        String investmentTaskRecordTypeId = Schema.SObjectType.Task.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Task').getRecordTypeId();
        String marketplaceTaskRecordTypeId = Schema.SObjectType.Task.getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
        String investmentContactRecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
        String marketplaceContactRecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_360_Contact').getRecordTypeId();
        
        if(marketplaceVerifiedContacts.size() > 0 && emailTemplate.size() > 0 && orgWideAddress.size() > 0 && assigneeUser.size() > 0)
        {
            List<Task> gdprTasks = [Select Id,Subject,WhoId from task where WhoId In :marketplaceVerifiedContacts.keySet() and Subject = 'Article 14 GDPR Notice'];
            
            for(Task gdprTask : gdprTasks)
            {
                existingTaskForContacts.put(gdprTask.WhoId,gdprTask);
            }
            
            for(Contact cnct : marketplaceVerifiedContacts.values())
            {
                if(!existingTaskForContacts.containsKey(cnct.Id))
                {
                    String body = emailTemplate.get(0).HtmlValue;
                    String taskBody =emailTemplate.get(0).Body;
                    String subject = emailTemplate.get(0).Subject;
                    body = body.replace('{{ContactFirstName}}',cnct.FirstName != null ? ' ' + cnct.FirstName : '');
                    taskBody = taskBody.replace('{{ContactFirstName}}',cnct.FirstName != null ? ' ' + cnct.FirstName : '');
                    
                    Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                    List<String> sendTo = new List<String>{cnct.Email};
                        email.setToAddresses(sendTo);
                    email.setReplyTo('no-reply@dakota.co');
                    email.setUseSignature(false); 
                    email.setBccSender(false); 
                    email.setSaveAsActivity(false);
                    email.setOrgWideEmailAddressId(orgWideAddress[0].Id);
                    email.setSubject(subject);
                    email.setHTMLBody(body);
                    emailsToBeSent.add(email);
                    
                    Task singleTask = new Task();
                    singleTask.OwnerId = assigneeUser[0].Id;
                    singleTask.ActivityDate = System.now().Date();
                    singleTask.WhoId = cnct.Id;
                    singleTask.WhatId = cnct.AccountId;
                    singleTask.Description = taskBody;
                    singleTask.Priority = 'Normal';
                    singleTask.Status = 'Completed';
                    singleTask.Subject = 'Article 14 GDPR Notice';
                    if(cnct.RecordTypeId == investmentContactRecordTypeId) 
                    {
                        singleTask.RecordTypeId = investmentTaskRecordTypeId;
                    }
                    else if(cnct.RecordTypeId == marketplaceContactRecordTypeId)
                    {
                        singleTask.RecordTypeId = marketplaceTaskRecordTypeId;
                    }
                    tasksToBeCreated.add(singleTask);
                }
            }
            
            if(emailsToBeSent.size() > 0)
            {
                Messaging.sendEmail(emailsToBeSent);
            }
            if(tasksToBeCreated.size() > 0)
            {
                insert tasksToBeCreated;
            }
        }
    }
    
    /**
    * Check if contact's mailing country is in GDPR countries
    */
    public static boolean checkMailingCountry(String mailingCountryOfContact)
    {
        if(mailingCountryOfContact =='austria' || mailingCountryOfContact == 'belgium' || mailingCountryOfContact == 'bulgaria' ||
           mailingCountryOfContact =='channel islands' || mailingCountryOfContact == 'cyprus' || mailingCountryOfContact == 'czech republic' ||
           mailingCountryOfContact =='denmark' || mailingCountryOfContact == 'england' || mailingCountryOfContact == 'estonia' ||
           mailingCountryOfContact =='finland' || mailingCountryOfContact == 'france' || mailingCountryOfContact == 'germany' ||
           mailingCountryOfContact =='greece' || mailingCountryOfContact == 'holland' || mailingCountryOfContact == 'hungary' ||
           mailingCountryOfContact =='ireland' || mailingCountryOfContact == 'italy' || mailingCountryOfContact == 'latvia' ||
           mailingCountryOfContact =='liechtenstein' || mailingCountryOfContact == 'lithuania' || mailingCountryOfContact == 'luxembourg' ||
           mailingCountryOfContact =='malta' || mailingCountryOfContact == 'the netherlands' || mailingCountryOfContact == 'netherlands' ||
           mailingCountryOfContact =='norway' || mailingCountryOfContact == 'poland' || mailingCountryOfContact == 'portugal' ||
           mailingCountryOfContact =='romania' || mailingCountryOfContact == 'slovakia' || mailingCountryOfContact == 'slovenia' ||
           mailingCountryOfContact =='spain' || mailingCountryOfContact == 'sweden' || mailingCountryOfContact == 'united kingdom' || mailingCountryOfContact == 'uk' ||
           mailingCountryOfContact =='monaco' || mailingCountryOfContact == 'jersey' || mailingCountryOfContact == 'isle of man')
        {
            return true;
        }
        return false;
    }
    
    /**
    * Only users with System Admin profile should be allowed to uncheck
    * Requested Removal per GDPR checkbox
    */
    public static void gpdrRemovalRequest(List<Contact> newContacts, Map<Id, Contact> oldContacts)
    {
        List<Profile> userProfile = [SELECT Id, Name FROM Profile WHERE Name = 'System Administrator'];
        for(Contact cnct : newContacts)
        {
            if(cnct.Requested_Removal_per_GDPR__c == false && oldContacts != null 
               && oldContacts.get(cnct.Id).Requested_Removal_per_GDPR__c == true &&
               userinfo.getProfileId() != userProfile[0].Id)
            {
                cnct.addError('You don\'t have permission to uncheck Requested Removal per GDPR checkbox. Please contact System Administrator.');
            }
        }
    }
    
    
    /**
    * Update Pardot Domain Field value on the basis of Record Type
    */
    public static void updatePardotDomain(List<Contact> newContacts, Map<Id, Contact> oldContacts)
    {
        for(Contact conn: newContacts)
        {
            if((Trigger.isUpdate && oldContacts!=null && (oldContacts.get(conn.Id).RecordTypeId != conn.RecordTypeId || conn.Pardot_Domain__c!=null) || Trigger.isInsert))
            {
                if(conn.RecordTypeId == Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId())
                {
                    conn.Pardot_Domain__c = 'Investment Sales';
                }
                else                
                {                   
                    conn.Pardot_Domain__c = null;
                }                
            }
        }      
    }
    
    public static void updateCountryField(List<Contact> newContacts, Map<Id, Contact> oldContacts)
    {
        for(Contact con : newContacts)
        {
            if(Trigger.isInsert || Trigger.isUpdate && con.MailingCountry != oldContacts.get(con.Id).MailingCountry)
            {
                if(con.MailingCountry != null && (con.MailingCountry.toLowercase() == 'united states' || con.MailingCountry.toLowercase() == 'us' ||
                                                  con.MailingCountry.toLowercase() == 'u.s.' || con.MailingCountry.toLowercase() == 'u.s' || con.MailingCountry.toLowercase() == 'u.s.a.' || 
                                                  con.MailingCountry.toLowercase() == 'u.s.a' || con.MailingCountry.toLowercase() == 'united states of america'))
                {                   
                    con.MailingCountry = 'USA';
                }
            }
        }                  
    }
    
    public static void setCPRATrackingField(List<Contact> newContacts, Map<Id, Contact> oldContacts, Map<ID,Contact> triggeredcontactMap)
    {
        Map<ID,Contact> contactMap = new Map<ID,Contact>();
        for(Contact con : newContacts)
        {
            if((Trigger.IsInsert && (con.MailingState == 'CA' || con.MailingState == 'California')))
            {
                Set<String> CPRA_Options = new Set<String>{'Title','Bio','Email','Phone'};
                if(con.Email == null) CPRA_Options.remove('Email');
                if(con.Title == null) CPRA_Options.remove('Title');
                if(con.Phone == null) CPRA_Options.remove('Phone');
                if(con.Biography__c == null) CPRA_Options.remove('Bio');
                con.California_Privacy_Regulation_Tracker__c = CPRA_Options.size() > 0 ? String.join(new List<String>(CPRA_Options),';') : null;
            }
            else if (Trigger.IsUpdate && 
                     ((con.Email != oldContacts.get(con.Id).Email && oldContacts.get(con.Id).Email == null) ||
                      (con.Title != oldContacts.get(con.Id).Title && oldContacts.get(con.Id).Title == null) || 
                      (con.Phone != oldContacts.get(con.Id).Phone  && oldContacts.get(con.Id).Phone == null) ||
                      (con.MailingState != oldContacts.get(con.Id).MailingState) ||
                      (con.Biography__c != oldContacts.get(con.Id).Biography__c && oldContacts.get(con.Id).Biography__c == null)) &&
                     (con.MailingState == 'CA' || con.MailingState == 'California'))
            {
                contactMap.put(con.Id,con);
            }
            else if(Trigger.IsUpdate && (con.MailingState != 'CA' && con.MailingState != 'California'))
            {
                con.California_Privacy_Regulation_Tracker__c = null;
            }
        }
        if(contactMap != null && contactMap.size() > 0)
        {
            List<Contact> conWithCPRAList = new List<Contact>(); 
            String tempCPRT = '';
            conWithCPRAList = [SELECT Id, California_Privacy_Regulation_Tracker__c, Phone, Biography__c, Email, Title,(SELECT Id, Contact_Field__c,Contact__c FROM CPRA_Tracking__r) 
                               FROM Contact WHERE Id IN :contactMap.keySet()];
            if(conWithCPRAList != null && conWithCPRAList?.size() > 0)
            {
                for(Contact con : conWithCPRAList)
                {
                    if(con.CPRA_Tracking__r != null && con.CPRA_Tracking__r.size() > 0)
                    {
                        tempCPRT = TriggerOnCPRATrackingService.getMissingContactFields(con.CPRA_Tracking__r, triggeredcontactMap);
                        if(tempCPRT != '')
                        {
                            triggeredcontactMap.get(con.Id).California_Privacy_Regulation_Tracker__c = tempCPRT;
                        }
                        else
                        {
                            triggeredcontactMap.get(con.Id).California_Privacy_Regulation_Tracker__c = 'All Information Publicly Available';
                        }
                    }
                    else {
                        Set<String> CPRA_Options = new Set<String>{'Title','Bio','Email','Phone'};
                        if(triggeredcontactMap.get(con.Id).Email == null) CPRA_Options.remove('Email');
                        if(triggeredcontactMap.get(con.Id).Title == null) CPRA_Options.remove('Title');
                        if(triggeredcontactMap.get(con.Id).Phone == null) CPRA_Options.remove('Phone');
                        if(triggeredcontactMap.get(con.Id).Biography__c == null) CPRA_Options.remove('Bio');
                        triggeredcontactMap.get(con.Id).California_Privacy_Regulation_Tracker__c = CPRA_Options.size() > 0 ? String.join(new List<String>(CPRA_Options),';') : null;
                    }
                }
                
            }
        }
    }
}