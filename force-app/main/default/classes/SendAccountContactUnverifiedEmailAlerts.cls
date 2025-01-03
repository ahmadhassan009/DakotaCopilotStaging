public with sharing class SendAccountContactUnverifiedEmailAlerts {

    private static  List<OrgWideEmailAddress> fromEmail;
    private static String baseUrl = URL.getSalesforceBaseUrl().toExternalForm()+'/';
    private static List<String> senderUsersEmail;
    private static String internalUsersGroupDeveloperName = 'Dakota_Membership_Services';
    private static String objName = '';

    @InvocableMethod(label = 'Send Marketplace Account/Contact Unverified Emails')
    public static void sendUnverifiedEmails(List<Id> objectIds) {
        Messaging.SingleEmailMessage[] messages = new List<Messaging.SingleEmailMessage>();
        //getting email template
        List<EmailTemplate> emailTemplate = [Select Id,Subject,Description,HtmlValue,Body from EmailTemplate where DeveloperName = 'Account_Contact_Unverified_Email'];
        if (emailTemplate.size() == 0) {
            return;
        }
        //setting list with emails of internal users from a specific group
        setGroupUsersEmails();
        if(senderUsersEmail.size() <= 0) {
            return;
        }
        //setting the object name
        setObjName(objectIds);

        String activitieslistQuerysearchField = '';
        String dnotesListQuerySearchField = '';
        //getting account name to populate in template
        List<SObject> sObjectList = new List<SObject>();
        if (objName == 'Account') {
            activitieslistQuerysearchField = 'whatId';
            dnotesListQuerySearchField = 'Account__c';
            sObjectList = [SELECT Id, Name FROM Account WHERE Id IN: objectIds];
        } else {
            activitieslistQuerysearchField = 'whoId';
            dnotesListQuerySearchField = 'Contact__c';
            sObjectList = [SELECT Id, FirstName, MiddleName, LastName FROM Contact WHERE Id IN: objectIds];
        }
         //Quering all Acitivites and Notes from the provided list of Accounts
        String eventsListQuery = 'SELECT Id, OwnerId, Owner.FirstName, Owner.LastName, Subject, '+activitieslistQuerysearchField+' FROM Event WHERE '+activitieslistQuerysearchField+' IN :objectIds';
        List<Event> eventsList = new List<Event>((List<Event>)Database.query(eventsListQuery));

        String tasksListQuery = 'SELECT Id, OwnerId, Owner.FirstName, Owner.LastName, Subject, '+activitieslistQuerysearchField+' FROM Task WHERE '+activitieslistQuerysearchField+' IN :objectIds';
        List<Task> tasksList = new List<Task>((List<Task>)Database.query(tasksListQuery));

        String dNotesListQuery = 'SELECT Id, OwnerId, Owner.FirstName, Owner.LastName, Name, '+dnotesListQuerySearchField+' FROM Dakota_Notes__c WHERE '+dnotesListQuerySearchField+' IN :objectIds';
        List<Dakota_Notes__c> dNotesList = new List<Dakota_Notes__c>((List<Dakota_Notes__c>)Database.query(dNotesListQuery));
    
        //creating a map to store all users that are to be rendered on template
        Map<Id, Set<UserInfo>> mapUserInfo = new Map<Id, Set<UserInfo>>();

        //set contains id of All the Owners of Tasks, Events And notes
        Set<Id> userObjInfoIdsSet = new Set<Id>();

        //populating the userObjInfoIdsSet with Ids that will be used to Query User object for all required Info
        for (Event event : eventsList) {
            userObjInfoIdsSet.add(event.OwnerId);
        }
        for (Task task : tasksList) {
            userObjInfoIdsSet.add(task.OwnerId);
        }

        for (Dakota_Notes__c dnote : dnotesList) {
            userObjInfoIdsSet.add(dnote.OwnerId);
        }
        //Querying User Object for all required additional Information
        Map<Id, User> userObjInfoMap = new Map<Id, User>([SELECT Id, Username, Contact.FirstName, Contact.MiddleName, Contact.LastName, Contact.Id, Contact.AccountId, Contact.Account.Name FROM User WHERE Is_Community_User__c = true AND Id IN: userObjInfoIdsSet]);

        //looping events, task and Notes to populate mapUserInfo that will be rendered on Template
        for (Event event : eventsList) {
            User userObjInfo = userObjInfoMap.get(event.OwnerId);
            if(userObjInfo != null) {
                if(objName == 'Contact') {
                    populateUserInfoObject(userObjInfo, event.whoId, mapUserInfo);
                } else if(objName == 'Account') {
                    populateUserInfoObject(userObjInfo, event.whatId, mapUserInfo);
                }
            }
        } 
        for (Task task : tasksList) {
            User userObjInfo = userObjInfoMap.get(task.OwnerId);
            if(userObjInfo != null) {
                if(objName == 'Contact') {
                    populateUserInfoObject(userObjInfo, task.whoId, mapUserInfo);
                } else if(objName == 'Account') {
                    populateUserInfoObject(userObjInfo, task.whatId, mapUserInfo);
                }
            }
        }
        for (Dakota_Notes__c dnote : dnotesList) {
            User userObjInfo = userObjInfoMap.get(dnote.OwnerId);
            if(userObjInfo != null) {
                if(objName == 'Contact') {
                    populateUserInfoObject(userObjInfo, dnote.Contact__c, mapUserInfo);
                } else if(objName == 'Account') {
                    populateUserInfoObject(userObjInfo, dnote.Account__c, mapUserInfo);
                }   
            }
        }

        for (sObject sObj : sObjectList) {
            //getting userInfo List for Events and notes
            Set<UserInfo> toParseUserInfoSet = mapUserInfo.get(sObj.Id);
            if(toParseUserInfoSet != null) {
                messages.add(parseEmailTemplate(emailTemplate[0], sObj, toParseUserInfoSet));
            }
        }

        if(messages.size() > 0) {
            Messaging.sendEmail(messages);
        }

    }

    /**
     * Function sets the name of object
     */
    private static void setObjName(List<Id> idList) {
        if(idList.size()>0) {
            objName = idList[0].getSObjectType().getDescribe().getName();
        }
    }

    /**
     * function populates the wrapper class object and add entry in our main map "mapUserInfo"
     */
    private static void populateUserInfoObject(User userObjInfo, Id accountId, Map<Id, Set<UserInfo>> mapUserInfo) {
        UserInfo userInfo = new UserInfo();
        String fullName = '';
        if(userObjInfo.Contact.FirstName != null && !String.isBlank(userObjInfo.Contact.FirstName)) {
            fullName += userObjInfo.Contact.FirstName+' ';
        }
        if(userObjInfo.Contact.MiddleName != null && !String.isBlank(userObjInfo.Contact.MiddleName)) {
            fullName += userObjInfo.Contact.MiddleName+' ';
        }
        userInfo.FullName = fullName + userObjInfo.Contact.LastName;
        userInfo.contactId = userObjInfo.Contact.Id;
        userInfo.accountName = userObjInfo.Contact.Account.Name;
        userInfo.accountId = userObjInfo.Contact.AccountId;
       
        //creating map with userinfo list for every task, event and notes
        if(mapUserInfo.get(accountId) == null) {
            mapUserInfo.put(accountId, new Set<UserInfo>{userInfo});
        } else {
            Set<UserInfo> mapUserInfoInstance = mapUserInfo.get(accountId);
            mapUserInfoInstance.add(userInfo);
        }
    }

    /**
     * Function gets the User emails from the Internal Group
     */
    private static void setGroupUsersEmails() {
        List<User> usersEmail = [SELECT Email FROM User WHERE Id IN (SELECT UserOrGroupId FROM GroupMember WHERE Group.DeveloperName = :internalUsersGroupDeveloperName)];
        senderUsersEmail = new List<String>();
        string fromAddress;
        List<Dakota_Settings__mdt> dSettings = Dakota_Settings__mdt.getAll().values();
        for(Dakota_Settings__mdt ds : dSettings)
        {
            if (ds.DeveloperName == 'From_Address_for_Unverified_Email')
            {
                fromAddress = ds.Value__c;
                break;
            }
        }
        
        if(fromAddress != null)
        {
            fromEmail = [SELECT Id, Address, DisplayName FROM 
                        OrgWideEmailAddress WHERE DisplayName='Dakota Marketplace' 
                        AND Address = :fromAddress];
        }
        for (user u :usersEmail)
        {
            senderUsersEmail.add(u.Email);
        }
    }

    /**
     * Function parses email template and provide infomation to nested function to create email object
     */
    private static Messaging.SingleEmailMessage parseEmailTemplate(EmailTemplate emailTemplate, SObject sObj, Set<UserInfo> UserInfoList) {
    
        String body = emailTemplate.HtmlValue;
        String subject = emailTemplate.Subject;
        Account accObj;
        Contact conObj;
        String fullName = '';
        //checking which object to cast to
        if(objName == 'Account') {
            accObj = (Account)sObj;
            fullName = accObj.Name;
        } else if(objName == 'Contact') {
            conObj = (Contact)sObj;
            if(conObj.FirstName != null && !String.isBlank(conObj.FirstName)) {
                fullName += conObj.FirstName+' ';
            }
            if(conObj.MiddleName != null && !String.isBlank(conObj.MiddleName)) {
                fullName += conObj.MiddleName+' ';
            }
            fullName += conObj.LastName;
        }

        String communityAccountContactNameURL = '<a href="'+baseUrl + sObj.Id+'" target="_blank">'+fullName+'</a>';
        String communityUserListString = '';
        Set<Id> addedUsers = new Set<Id>();//set to remove duplicate users from the set of wrapper class objects
        for (UserInfo uInfo : UserInfoList) {
            //if user already added to template, skip the loop
            if(addedUsers.contains(uInfo.contactId)) {
                continue;
            }
            addedUsers.add(uInfo.contactId);
            String communityMemmberContactNameURL = '<a href="'+baseUrl  + uInfo.contactId+'" target="_blank">'+uInfo.FullName+'</a>';
            String communityMemmberAccountNameURL = '<a href="'+baseUrl  + uInfo.accountId+'" target="_blank">'+uInfo.accountName+'</a>';
            communityUserListString += '<br/>&bull;&emsp;'+communityMemmberContactNameURL+ ' at ' +communityMemmberAccountNameURL;
        }
        subject = subject.replace('{{AccountContactName}}',  fullName);
        body = body.replace('{{AccountContactName}}', communityAccountContactNameURL);
        body = body.replace('{{communityUserList}}', communityUserListString);
        body = body.replace('{{objectName}}', objName);
        return sendEmail(subject, body);
    }

    /**
     * Function to create email object to send to Internal Users Group
     */
    private static Messaging.SingleEmailMessage sendEmail(String subject, String body) {
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        if(fromEmail!=null && fromEmail.size()>0)
        {
            email.setOrgWideEmailAddressId(fromEmail[0].Id);
        }
        email.setReplyTo('no-reply@dakota.co');
        email.setUseSignature(false); 
        email.setBccSender(false); 
        email.setSaveAsActivity(false); 
        email.setToAddresses(senderUsersEmail);
        email.setSubject(subject);
        email.setHtmlBody(body);
        return email;
    }

    private class UserInfo {
        private String FullName;
        private String contactId;
        private String accountName;
        private String accountId;
    }
}