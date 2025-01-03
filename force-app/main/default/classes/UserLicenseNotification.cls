global with sharing class UserLicenseNotification Implements Schedulable {
    /**
     * DSC-282 : User license availability 
     */
    global void execute(SchedulableContext sc)
    {
        sendUserLicenseNotificationEmail(false);
    }
        
    public static void sendUserLicenseNotificationEmail(Boolean urgentEmail)
    {
        try {
            Integer totalLicense = 0;
            Integer remainingLicense = 0;
            
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            List<EmailTemplate> emailTemplate = [Select Id,Subject,Description,HtmlValue,DeveloperName,Body from EmailTemplate where name = 'UserLicenseNotificationEmailTemplate'];
            if(EmailTemplate.size() > 0){
                List<UserLicense> userLicense = [SELECT Name, TotalLicenses, UsedLicenses from UserLicense where Name='Customer Community Plus'];
                
                email.setReplyTo('no-reply@dakota.co');
                email.setUseSignature(false); 
                email.setBccSender(false); 
                email.setSaveAsActivity(false); 
                
                List<String> sendTo = new List<String>();
                sendTo.addAll((Label.userLicenseNotificationRecipient).split(';'));
                email.setToAddresses(sendTo);
                
                for(UserLicense item : userLicense){
                    totalLicense = item.TotalLicenses;
                    remainingLicense = item.TotalLicenses - item.UsedLicenses;
                }
                
                String Body = emailTemplate.get(0).Body;
                String Subject = emailTemplate.get(0).Subject;
                
                //DSC-371 : Show current date time
                Body = Body.replace('{!Today}', System.now().format());

                if(totalLicense != 0){
                    Body = Body.replace('{!TotalLicense__c}', String.valueOf(totalLicense));
                }
                
                if(remainingLicense !=0){
                    Body = Body.replace('{!RemainingLicense__c}', String.valueOf(remainingLicense));
                }
                
                if(urgentEmail) {
                    Subject = Subject.replace('{!Urgent__c}', 'URGENT! - ');
                } else {
                    Subject = Subject.replace('{!Urgent__c}', ' ');
                }
                
                email.setSubject(Subject);
                email.setPlainTextBody(Body);
                Messaging.sendEmail(New Messaging.SingleEmailMessage[]{email});
            }
        } catch(Exception ex) {  
            System.debug(ex.getMessage() + ex.getStackTraceString());
        }
    }		
}