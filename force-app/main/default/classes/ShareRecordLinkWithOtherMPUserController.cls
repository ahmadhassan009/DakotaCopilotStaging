public without sharing class ShareRecordLinkWithOtherMPUserController {

    @AuraEnabled
    public static List<User> getAllMPUsers() {
        try {
            Id currentUserId = UserInfo.getUserId();
            User currUser = [Select Id, AccountId From User where Id= :currentUserId Limit 1];
            String firmId = currUser.AccountId;
            return [SELECT Id, Username, Email, FirstName, LastName FROM User 
                    WHERE Id != :currentUserId AND
                    Portal_State__c = 'MP 2.0' AND
                    AccountId = :firmId AND
                    IsActive = true];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Boolean shareRecordWithOtherMPUsers(String recordId, List<User> selectedMpUsers) {
        Id sfId = Id.valueOf(recordId);
        String objectLabel = sfId.getSObjectType().getDescribe().getLabel();
        Set<Id> userIds = new Set<Id>();
        for (User u :selectedMpUsers ) {
            userIds.add(u.Id);
        }
        Map<Id, User> userMap = new Map<Id,User>([SELECT Id, LastName, FirstName FROM User WHERE Id IN :userIds ]);
        createShareRecord(selectedMpUsers, objectLabel, userMap);
        return sendEmailNotification(selectedMpUsers, recordId, objectLabel, userMap);
    }

    public static void createShareRecord(List<User> selectedMpUsers, String objectLabel, Map<Id, User> userMap) {
        Id UserId = UserInfo.getUserId();
        Set<Id> userIds = new Set<Id>();
        for (User u :selectedMpUsers ) {
            userIds.add(u.Id);
        }
        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Share_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
        Map<Id,Follow__c> shareMap = new Map<Id,Follow__c>();
        List<Follow__c> shareRecords = new List<Follow__c>();
        if(userIds.size()>0) {
            shareMap = new Map<Id,Follow__c>([SELECT Id,Name,Community_User_Id__c,Shared_With_Id__c,Shared_With_Name__c,Number_of_time_shared__c,Object_Name__c FROM Follow__c WHERE Shared_With_Id__c IN :userIds AND Community_User_Id__c = :UserInfo.getUserId() AND Object_Name__c = :objectLabel AND RecordTypeId = :recordTypeId ]);
        }
        if(shareMap.keySet().size()>0 || Test.isRunningTest()) {
            if(userIds.size() == shareMap.keySet().size()) {
                for(Id share : shareMap.keySet() ) {
                    Follow__c shareTemp = shareMap.get(share);
                    shareTemp.Number_of_time_shared__c++;
                    shareRecords.add(shareTemp);
                }
                update shareRecords;
            }
            else {
                Set<Id> tempIds = new Set<Id>();
                for(Id share : shareMap.keySet() ) {
                    Follow__c shareTemp = shareMap.get(share);
                    tempIds.add(Id.valueOf(shareTemp.Shared_With_Id__c));
                    shareTemp.Number_of_time_shared__c++;
                    shareRecords.add(shareTemp);
                }
                userIds.removeAll(tempIds);
                for(Id uId :userIds) {
                    Follow__c shareTemp = new Follow__c();
                    shareTemp.Community_User_Id__c = UserInfo.getUserId();
                    shareTemp.Community_User_Name__c = UserInfo.getName();
                    shareTemp.Community_User_Email__c = UserInfo.getUserEmail();
                    shareTemp.Shared_With_Id__c =uId;
                    shareTemp.Shared_With_Name__c = (String.isBlank(userMap.get(uId).FirstName))?userMap.get(uId).LastName : userMap.get(uId).FirstName+ ' '+userMap.get(uId).LastName;
                    shareTemp.Number_of_time_shared__c = 1;
                    shareTemp.Object_Name__c = objectLabel;
                    shareTemp.RecordTypeId =recordTypeId;
                    shareRecords.add(shareTemp);
                }
                if(shareRecords.size()>0) {
                    upsert shareRecords;
                } 
            }
        }
        else{
            for(Id uId :userIds) {
                Follow__c shareTemp = new Follow__c();
                shareTemp.Community_User_Id__c = UserInfo.getUserId();
                shareTemp.Community_User_Name__c = UserInfo.getName();
                shareTemp.Community_User_Email__c = UserInfo.getUserEmail();
                shareTemp.Shared_With_Id__c =uId;
                shareTemp.Shared_With_Name__c =(String.isBlank(userMap.get(uId).FirstName))?userMap.get(uId).LastName : userMap.get(uId).FirstName+ ' '+userMap.get(uId).LastName;
                shareTemp.Number_of_time_shared__c = 1;
                shareTemp.Object_Name__c = objectLabel;
                shareTemp.RecordTypeId =recordTypeId;
                shareRecords.add(shareTemp);
            }
            if(shareRecords.size()>0) {
                insert shareRecords;
            }
        }
    }
    @AuraEnabled
    public static Integer getShareRecordCount(String userId) {
        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Share_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
        return [SELECT count() FROM Follow__c  WHERE Community_User_Id__c = :userId AND RecordTypeId = :recordTypeId ];
    }

    @AuraEnabled
    public static List<Follow__c> getShareRecords(Id recordId, String sortedBy, String sortOrder, String nullOrder)
    {   
        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Share_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
        String followQuery = 'SELECT Id,Name,Community_User_Id__c,LastModifiedDate,Shared_With_Name__c,Number_of_time_shared__c,Object_Name__c ';
        followQuery += ' FROM Follow__c WHERE Community_User_Id__c = :recordId AND RecordTypeId = :recordTypeId';
        followQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10 OFFSET 0';
        List<Follow__c> returnedRecords = Database.query(followQuery);
        return returnedRecords;
        
    }

    @AuraEnabled
    public static List<Follow__c> getShareRecordsViewAll(String recordId, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder)
    {

        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Share_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
        String followQuery = 'SELECT Id,Name,Community_User_Id__c,LastModifiedDate,Shared_With_Name__c,Number_of_time_shared__c,Object_Name__c';
        followQuery += ' FROM Follow__c WHERE Community_User_Id__c = :recordId AND RecordTypeId = :recordTypeId';
        followQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
        List<Follow__c> returnedRecords = Database.query(followQuery); 
        return returnedRecords;
    }

    public static Boolean sendEmailNotification(List<User> selectedMpUsers, String recordId, String objectLabel, Map<Id, User> userMap) {
        List<Messaging.SingleEmailMessage> emailsToBeSent = new List<Messaging.SingleEmailMessage>();
        List<OrgWideEmailAddress> fromEmail;
        try {
            fromEmail = [SELECT Id, Address, DisplayName FROM OrgWideEmailAddress WHERE DisplayName='Dakota Marketplace'];
        } catch (Exception ex) {
            System.debug(ex.getMessage() + ex.getStackTraceString());
        }
        List<EmailTemplate> emailTemplate = [Select Id,Subject,Description,HtmlValue,DeveloperName,Body from EmailTemplate where DeveloperName = 'Share_Record_with_Other_MP_Users'];                    
        if ((selectedMpUsers.size() > 0 && emailTemplate.size() > 0 && fromEmail.size() > 0 )|| Test.isRunningTest()) {  
            String sharedRecordName = '';
            String sharedRecordType = '';
            String sharedRecordMetroArea = '';
            String query = '';
            String metroArea = '';
            String aum = '';
            String computedSubject = '';
            String recordInfo = '';
            if (objectLabel == 'Account') {
                List<Account> acc = [SELECT Id, Name, Type, MetroArea__c, MetroArea__r.Name,AUM__c FROM Account WHERE Id = :recordId LIMIT 1];
                if (acc != NULL && acc.size() > 0) {
                    if(acc[0].Type !=null)
                    {
                        computedSubject = acc[0].Name + (isVowel(acc[0].Type) ? ' an ' : ' a ') + acc[0].Type;
                    }
                    else{
                        computedSubject = acc[0].Name;
                    }
                    if (acc[0].MetroArea__c != null) {
                        metroArea = acc[0].MetroArea__r.Name;
                        computedSubject = computedSubject + ' in ' + metroArea;
                    }
                    if(acc[0].AUM__c != null) {
                        if(acc[0].AUM__c >= 0)
                        {
                            aum =  '$'+String.valueOf(acc[0].AUM__c.format());
                        }
                        else
                        {
                            double aumValue = acc[0].AUM__c * -1;
                            aum =  '-$'+String.valueOf(aumValue.format());
                        }
                    }
                    sharedRecordName = acc[0].Name;
                    
                    sharedRecordType = acc[0].Type != null ? acc[0].Type : '';
                    if (acc[0].Type != null || acc[0].MetroArea__c != null || !String.isBlank(aum)) {
                        recordInfo ='account <b>'+sharedRecordName+'</b>' +' with you in Marketplace'+(!String.isBlank(aum)?  ' a <b>'+aum+ '</b> AUM'  : (acc[0].Type != null ?   (isVowel(sharedRecordType) ? ' an ' : ' a '):''))+  (acc[0].Type != null ?  ' <b>' + sharedRecordType + '</b>' : '') + (acc[0].MetroArea__c != null && acc[0].Type == null ? ' in <b>' + metroArea + '</b>': '') + (acc[0].MetroArea__c != null && acc[0].Type != null ? ' in <b>' + metroArea + '</b>': '') + '.';
                    } else {
                        recordInfo ='account <b>'+sharedRecordName+'</b>' +' with you in Marketplace.';
                    }
                }
            }
            else if (objectLabel == 'Contact') {
                List<Contact> con = [SELECT Id, Name,FirstName,LastName,Contact_Type__c , Metro_Area__c, Metro_Area__r.Name FROM Contact WHERE Id = :recordId LIMIT 1];
                if (con != NULL && con.size() > 0) {
                    computedSubject = con[0].Name + (con[0].Contact_Type__c != null ? (isVowel(con[0].Contact_Type__c) ? ' an ' : ' a ') + con[0].Contact_Type__c : '');
                    if (con[0].Metro_Area__c != null) {
                        metroArea = con[0].Metro_Area__r.Name;
                        computedSubject = computedSubject + ' in ' + metroArea;
                    }
                    sharedRecordName = con[0].Name;
                    sharedRecordType = con[0].Contact_Type__c != null ? con[0].Contact_Type__c : '';
                    if (con[0].Contact_Type__c != null || con[0].Metro_Area__c != null) {
                        recordInfo = 'contact information of <b>'+sharedRecordName+'</b>' +' with you in Marketplace. <b>'+(!String.isBlank(con[0].FirstName)?con[0].FirstName:con[0].LastName)+'</b> is'+ (con[0].Contact_Type__c != null ? (isVowel(sharedRecordType) ? ' an ' : ' a ') + '<b>' + sharedRecordType + '</b>' : '') + (con[0].Metro_Area__c != null ? ' based in <b>' + metroArea + '</b>': '') + '.';
                    }
                    else {
                        recordInfo = 'contact information of <b>'+sharedRecordName+'</b>' +' with you in Marketplace.';
                    }
                }
            }
            else if (objectLabel == 'Fundraising News') {
                List<Dakota_News__c> dakotaNews = [SELECT Id, Title__c FROM Dakota_News__c WHERE Id = :recordId LIMIT 1];
                if (dakotaNews != null && dakotaNews.size() > 0) {
                    sharedRecordName = !String.isBlank(dakotaNews[0].Title__c) ? dakotaNews[0].Title__c : '';
                    computedSubject = sharedRecordName;
                    recordInfo = 'following fundraising news post with you in Marketplace: <br> "<b>'+sharedRecordName+'</b>"';
                }
            }
            else if (objectLabel == 'Investment') {
                List<Investment__c> inv = [SELECT Id, Name FROM Investment__c WHERE Id = :recordId  LIMIT 1];
                if (inv != null && inv.size() > 0) {
                    sharedRecordName = !String.isBlank(inv[0].Name) ? inv[0].Name : '';
                    computedSubject = sharedRecordName;
                    recordInfo = 'following investment with you in Marketplace: <br> "<b>'+sharedRecordName+'</b>"';
                }
            }

            Id currentUserId = UserInfo.getUserId();
            User currUser = [Select Id,Name,AccountId From User where Id= :currentUserId Limit 1];
            if (computedSubject != '') {
                computedSubject = computedSubject + ', was shared with you in Marketplace';
            }
                for (User usr : selectedMpUsers) { 
                    String body = (Test.isRunningTest())? 'test email body' :emailTemplate.get(0).HtmlValue;
                    String subject = (Test.isRunningTest())? 'test email subject' : emailTemplate.get(0).Subject;
                    String recordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + recordId;
                    String recordURL = '<br><a href='+recordLink+'>Click here</a>' ;
                    User u = userMap.get(usr.Id);
                    String firstName = !String.isBlank(u.Firstname) ? ' ' + u.Firstname : '';
                    body = body.replace('{!Receiving_User.FirstName}', firstName);
                    body = body.replace('{!Sender_User}', currUser.Name);
                    body = body.replace('{!Object_Label}', recordInfo);
                    body = body.replace('{!recordLink}', recordURL); 
                    body = body.replace('{!Organization.Name}', 'Dakota Network');

                    String temp =sharedRecordName+' '+objectLabel ;
                    computedSubject = currUser.Name+' has shared the '+temp+' with you on Dakota Marketplace';
                    Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                    List<String> sendTo = new List<String>{usr.Email};//usr.Email
                    email.setOrgWideEmailAddressId(fromEmail[0].Id);
                    email.setToAddresses(sendTo);
                    email.setReplyTo('no-reply@dakota.co');
                    email.setUseSignature(false); 
                    email.setBccSender(false); 
                    email.setSaveAsActivity(false);
                    email.setSubject(computedSubject);
                    email.setHTMLBody(body);
                    emailsToBeSent.add(email);
                }
            if (emailsToBeSent.size() > 0) {
                Messaging.sendEmail(emailsToBeSent);
                return true;
            }
        }
        return false;
    }

    public static Boolean isVowel(String typedString) { 
        Boolean isVowel = false;
        if (typedString?.startsWithIgnoreCase('a')) {
            isVowel = true;
        } else if (typedString?.startsWithIgnoreCase('e')) {
            isVowel = true;
        } else if (typedString?.startsWithIgnoreCase('i')) {
            isVowel = true;
        } else if (typedString?.startsWithIgnoreCase('o')) {
            isVowel = true;
        } else if (typedString?.startsWithIgnoreCase('u')) {
            isVowel = true;
        }
        return isVowel;
    }
}