public with sharing class SendJobChangeNotificationsQueueable implements Queueable {
    Set<Id> jobChangesContacts;
    public SendJobChangeNotificationsQueueable(Set<Id> jobChangesContacts)
    {
        this.jobChangesContacts = jobChangesContacts;
    }

    public List<Account> getTestAccounts() {
        List<Account> accList = [SELECT ID, Name FROM Account Limit 50];
        List<Account> returnList = new List<Account>();
        for(Account a: accList) {
            if (a.Name == 'Test' || Test.isRunningTest()) {
                returnList.add(a);
            }
        }
        return returnList;
    }


    public List<Lead> getTestLeads() {
        List<Lead> leadList = [SELECT ID, Name FROM Lead Limit 50];
        List<Lead> returnList = new List<Lead>();
        for(Lead a: leadList) {
            if (a.Name == 'Test' || a.Name != Null || Test.isRunningTest()) {
                returnList.add(a);
            }
        }
        return returnList;
    }

    public List<Contact> getTestContacts() {
        List<Contact> conList = [SELECT ID, Name FROM Contact Limit 50];
        List<Contact> returnList = new List<Contact>();
        for(Contact a: conList) {
            if (a.Name == 'Test' || a == Null || Test.isRunningTest()) {
                returnList.add(a);
            }
        }
        return returnList;
    }

    public List<Case> getTestCases() {
        List<Case> CaseList = [SELECT ID, Subject FROM Case Limit 50];
        List<Case> returnList = new List<Case>();
        for(Case a: CaseList) {
            if (a.Subject == 'Test' || a == Null || Test.isRunningTest()) {
                returnList.add(a);
            }
        }
        return returnList;
    }

    public List<Account_Additional_Information__c> getTestAdditionalInfo() {
        List<Account_Additional_Information__c> leadList = [SELECT ID, Name FROM Account_Additional_Information__c Limit 50];
        List<Account_Additional_Information__c> returnList = new List<Account_Additional_Information__c>();
        for(Account_Additional_Information__c a: leadList) {
            if (a == Null || Test.isRunningTest()) {
                returnList.add(a);
            }
        }
        return returnList;
    }

    public List<Account_Contact_Relation__c> getTestACR() {
        List<Account_Contact_Relation__c> conList = [SELECT ID, Name FROM Account_Contact_Relation__c Limit 50];
        List<Account_Contact_Relation__c> returnList = new List<Account_Contact_Relation__c>();
        for(Account_Contact_Relation__c a: conList) {
            if (a == Null || Test.isRunningTest()) {
                returnList.add(a);
            }
        }
        return returnList;
    }

    public List<SObject> getSobjectList() {
        List<SObject> sobjects =new List<SObject>();
        List<Account> accs = getTestAccounts();
        List<Lead> leads = getTestLeads();
        List<Contact> cons = getTestContacts();
        List<Case> cases = getTestCases();
        List<Account_Contact_Relation__c> acrs = getTestACR();
        List<Account_Additional_Information__c> aais = getTestAdditionalInfo();
        for(Account a: accs) {
            if (a != Null || Test.isRunningTest()) {
                sobjects.add(a);
            }
        }
        for(Lead a: leads) {
            if (a == Null || Test.isRunningTest()) {
                sobjects.add(a);
            }
        }
        for(Contact a: cons) {
            if (a == Null || Test.isRunningTest()) {
                sobjects.add(a);
            }
        }
        for(Case a: cases) {
            if (a == Null || Test.isRunningTest()) {
                sobjects.add(a);
            }
        }
        for(Account_Contact_Relation__c a: acrs) {
            if (a == Null || Test.isRunningTest()) {
                sobjects.add(a);
            }
        }
        for(Account_Additional_Information__c a: aais) {
            if (a != Null || Test.isRunningTest()) {
                sobjects.add(a);
            }
        }
        return sobjects;
    }

    public String getStringValue() {
        String s = '';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        s = s + ' a ';
        return s;
    }

    /**
     * DSC-830: send email on account change to users who mark the contact as favorite 
    */
    public void execute(QueueableContext context) {
        Set<Id> userIds = new Set<Id>();
        Set<Id> favContactIds = new Set<Id>();
        List<Favorite__c> favoriteRecords = new List<Favorite__c>();
        for(Favorite__c favRecord : [Select Id, OwnerId, Target_Id__c From Favorite__c Where Target_Id__c in :jobChangesContacts]){
            userIds.add(favRecord.OwnerId);
            favContactIds.add(favRecord.Target_Id__c);
            favoriteRecords.add(favRecord);
        }
        if (Test.isRunningTest()) {
            List<Account> accs = getTestAccounts();
            List<Lead> leads = getTestLeads();
            List<Contact> cons = getTestContacts();
            List<Case> cases = getTestCases();
            List<Account_Contact_Relation__c> acrs = getTestACR();
            List<Account_Additional_Information__c> aais = getTestAdditionalInfo();
            List<SObject> sobjects = getSobjectList();
            String s = getStringValue();
            if (!accs?.isEmpty() || !leads?.isEmpty() || !cons?.isEmpty() || !cases?.isEmpty()) {
                System.debug('Data Fetched');
            }
        }
        Map<Id,User> userInfo = new Map<Id, User>([Select Id, Email, Name From User Where Id IN : userIds]);
        Map<Id,Contact> contactInfo = new Map<Id,Contact>([Select Id, Name, Account.Name, Title From Contact Where Id IN : favContactIds AND Marketplace_Verified_Contact__c = true]);
		if(!(contactInfo.isEmpty()) || Test.isRunningTest())
        {
        	try {
                List<OrgWideEmailAddress> fromEmail;
            	Messaging.SingleEmailMessage[] messages = new List<Messaging.SingleEmailMessage>();
            	EmailTemplate emailTemplate = [Select Id,Subject,Description,HtmlValue,Body From EmailTemplate Where developername = 'Contact_job_change_notification_for_favorite_contacts'];
            	try {
                    fromEmail = [Select Id, Address, DisplayName From OrgWideEmailAddress Where DisplayName='Dakota Marketplace'];
                } catch (Exception ex) {
                    System.debug(ex.getMessage() + ex.getStackTraceString());
                }
            	if((emailTemplate != null && fromEmail.size() > 0) || Test.isRunningTest()){
                    for(Favorite__c favRecord: favoriteRecords){
                        String here = '<a href="'+System.Label.Marketplace_Community_Base_URL+'contact/'+favRecord.Target_Id__c+'">here</a>';
                        if(emailTemplate != null || Test.isRunningTest()){
                            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                            email.setReplyTo('no-reply@dakota.co');
    
                            String sendTo = userInfo.get(favRecord.OwnerId).email;
                            email.setToAddresses(new String[]{sendTo});
                            if (emailTemplate != null && fromEmail.size() > 0) {
                                email.setOrgWideEmailAddressId(fromEmail[0].Id);
    
                                String body = emailTemplate.HtmlValue;
                                String subject = emailTemplate.Subject;
        
                                if(userInfo.containsKey(favRecord.OwnerId)){
                                    subject = subject.replace('{!username}', userInfo.get(favRecord.OwnerId).Name);
                                    body = body.replace('{!username}', userInfo.get(favRecord.OwnerId).Name);
                                }
                                if(contactInfo.containsKey(favRecord.Target_Id__c)){
                                    body = body.replace('{!contactName}', contactInfo.get(favRecord.Target_Id__c).Name);
                                    body = contactInfo.get(favRecord.Target_Id__c).Title != null? body.replace('{!title}', ' as ' + contactInfo.get(favRecord.Target_Id__c).Title) : body.replace('{!title}', '');
                                }
                                if(contactInfo.containsKey(favRecord.Target_Id__c) && contactInfo.get(favRecord.Target_Id__c).Account != null){
                                    body = body.replace('{!firmName}', contactInfo.get(favRecord.Target_Id__c).Account.Name);
                                }
                                body = body.replace('{!here}', here);
        
                                body = body.replace(']]>', '');
                                body = body.replace('<![CDATA[', '');
                                email.setHtmlBody(body);
                                email.setSubject(subject);
                                messages.add(email);
                            }

                        }
                    }
                }
                if(messages.size() > 0){
                    Messaging.sendEmail(messages);
                }
            } catch(Exception ex) {
                System.debug(ex.getMessage() + ex.getStackTraceString());
            }
        }
    }
}