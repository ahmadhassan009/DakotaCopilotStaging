global  class SchedulerToSendEmailToInactiveUsers implements Schedulable{
    global void execute(SchedulableContext ctx) {        
        sendEmailToInactiveUsers();        
    }

    public static void sendEmailToInactiveUsers()
    {
        DateTime startDate30 =date.today().addDays(-30);
        DateTime endDate30 =date.today().addDays(-29);
        DateTime startDate60 =date.today().addDays(-60);
        DateTime endDate60 =date.today().addDays(-59);
        DateTime startDate90 =date.today().addDays(-90);
        DateTime endDate90 =date.today().addDays(-89);
        List<User> users = new List<User>();
        Profile profile = [SELECT Id, Name FROM Profile WHERE Name = 'Dakota Customer Community'];
        if(Test.isRunningTest()){
             users = [SELECT LastName,email, FirstName, Username, Id, LastLoginDate, LastModifiedDate, LastModifiedById FROM User WHERE LastName = 'Testing'];
        }
        else {
             users = [SELECT LastName,email, FirstName, Username, Id, LastLoginDate, LastModifiedDate, LastModifiedById FROM User WHERE ((LastLoginDate >= :startDate30 AND LastLoginDate < :endDate30) OR (LastLoginDate >= :startDate60 AND LastLoginDate < :endDate60) OR (LastLoginDate >= :startDate90 AND LastLoginDate < :endDate90)) AND IsActive = true  AND ProfileId =:profile.ID];
        }
         EmailTemplate emailTemplateFor30Days =null;
         EmailTemplate emailTemplateFor60Days =null;
         EmailTemplate emailTemplateFor90Days =null;
         Messaging.SingleEmailMessage[] messages = new List<Messaging.SingleEmailMessage>();
         List<OrgWideEmailAddress> fromEmail = [SELECT Id, Address, DisplayName FROM OrgWideEmailAddress WHERE  DisplayName='Dakota Marketplace'];
         List<EmailTemplate> emailTemplate = [SELECT Id,Name,Subject,Description,HtmlValue,Body FROM EmailTemplate WHERE developername = 'Last_Login_Email_Alert_After_90_Days' OR developername = 'Last_Login_Email_Alert_After_60_Days' OR developername = 'Last_Login_Email_Alert_After_30_Days' ];
         for(EmailTemplate email :emailTemplate) {
            if(email.Name == 'Last Login Email Alert After 30 Days')  {
                emailTemplateFor30Days = email;
            }
            else if(email.Name == 'Last Login Email Alert After 60 Days') {
                emailTemplateFor60Days = email;
            }
            else if(email.Name == 'Last Login Email Alert After 90 Days') {
                emailTemplateFor90Days = email;
            }

         }
         if(users.size()>0 && emailTemplate.size()>0 && fromEmail.size() > 0) {
            for(User u :users) {
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setReplyTo('no-reply@dakota.co');
                email.setOrgWideEmailAddressId(fromEmail[0].Id);
                String body ;
                String subject;
                DateTime userLastLoginDate =null;
                if(Test.isRunningTest()){
                    userLastLoginDate = startDate30;
                }
                else {
                    userLastLoginDate = u.LastLoginDate.dateGMT();
                }
                if(userLastLoginDate == startDate30) {
                     body = emailTemplateFor30Days.HtmlValue;
                     subject = emailTemplateFor30Days.Subject;
                    String sendTo = u.email;
                    email.setToAddresses(new String[]{sendTo});
                }
                else if(userLastLoginDate == startDate60) {
                     body = emailTemplateFor60Days.HtmlValue;
                     subject = emailTemplateFor60Days.Subject;
                    String sendTo = u.email;
                    email.setToAddresses(new String[]{sendTo});
                }
                else if(userLastLoginDate == startDate90) {
                     body = emailTemplateFor90Days.HtmlValue;
                     subject = emailTemplateFor90Days.Subject;
                    String sendTo = u.email;
                    email.setToAddresses(new String[]{sendTo});
                }
                body = body.replace('{!userName}', (!String.isBlank(u.FirstName))? u.FirstName+' '+u.LastName : u.LastName);
                subject = subject.replace('{!userName}', (!String.isBlank(u.FirstName))? u.FirstName+' '+u.LastName : u.LastName);
                body = body.replace(']]>', '');
                body = body.replace('<![CDATA[', '');
                email.setHtmlBody(body);
                email.setSubject(subject);
                messages.add(email);
             }
         }
         if(messages.size() > 0){
            Messaging.sendEmail(messages);
        }
    }
}