public class CreateContactNotificationEmail {
    
    public static void sendContactCreateNotificationEmail(List<Contact> newContactsList){
        try {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            List<EmailTemplate> emailTemplate = [Select Id,Subject,Description,HtmlValue,Body from EmailTemplate where name = 'Send Email To Case Owner html'];
            Set<Id> casesIds = new Set<Id>();
            List<Contact> contactsRelatedToCases = new List<Contact>();
            for(Contact con :newContactsList)
            {
                if(con.Ref_Case_ID__c!=null)
                {
                    casesIds.add(con.Ref_Case_ID__c);
                    contactsRelatedToCases.add(con);
                }
            }      
            if(casesIds!=null && casesIds.size()>0)
            {
                List<Case> caseRecords = [Select Id, OwnerId, CaseNumber, First_Name__c, Contact_Last_Name__c from case where Id IN: casesIds AND OwnerId!=null];
                if(caseRecords!=null && caseRecords.size()>0)
                {
                    Set<Id> casesOwnerIds = new Set<Id>();
                    for(Case cs :caseRecords)
                    {
                        casesOwnerIds.add(cs.OwnerId);
                    }
                    Map<Id, User> caseOwnersList = new Map<Id, User>([Select Id, Email, name from User where Id IN: casesOwnerIds]);
                    if(caseOwnersList!=null && caseOwnersList.size()>0)
                    {
                        Map<Id, User> caseOwnersInfoList = new Map<Id, User>();
                        for(Case cs :caseRecords)
                        {
                            if(caseOwnersList.get(cs.OwnerId) !=null)
                                caseOwnersInfoList.put(cs.Id, caseOwnersList.get(cs.OwnerId));
                        }
                        String communityUrl = (Label.Marketplace_Community_Base_URL!=null?Label.Marketplace_Community_Base_URL:'');
                        Messaging.SingleEmailMessage[] messages = new List<Messaging.SingleEmailMessage>();
                        for(Contact con :contactsRelatedToCases){
                            String communityContactURL = '<a href="'+communityUrl +'detail/' + con.Id+'" target="_blank">'+'here'+'</a>';	
                            String emailSubject = 'Contact Created Successfully'; 
                            User caseOwnerInfo  = caseOwnersInfoList.get(con.Ref_Case_ID__c);
                            if(emailTemplate !=null && emailTemplate.size()>0 && caseOwnerInfo != null){
                                email.setReplyTo('no-reply@dakota.co');
                                email.setUseSignature(false); 
                                email.setBccSender(false); 
                                email.setSaveAsActivity(false); 
                                
                                List<String> sendTo = new List<String>();
                                sendTo.add(caseOwnerInfo.Email);
                                email.setToAddresses(sendTo);
                                
                                String body = emailTemplate[0].HtmlValue;
                                String subject = emailTemplate[0].Subject;
                                
                                if(emailSubject !=null){
                                    subject = subject.replace('Contact Created Successfully', emailSubject);
                                }
                                
                                if(caseOwnerInfo.Name !=null){
                                    body = body.replace('{!Case.OwnerName}', caseOwnerInfo.Name);
                                }
                                
                                if(con.Id !=null){
                                    body = body.replace('{!ContactLink}', communityContactURL);
                                }
                                
                                body = body.replace(']]>', '');
                                body = body.replace('<![CDATA[', '');
                                email.setSubject(subject);
                                email.setHtmlBody(body);
                                messages.add(email);
                            }
                        }
                        if(messages != null)
                            Messaging.sendEmail(messages);
                    }
                }               
            }
        } catch(Exception ex) {  
            System.debug(ex.getMessage() + ex.getStackTraceString());
        }
    }
}