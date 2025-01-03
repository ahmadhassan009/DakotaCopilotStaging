public class TriggerOnMemberNoteService {
    
    public static void sendNotesNotificationEmail(List<Member_Comments__c> newMemberNotes, List<Member_Comments__c> oldMemberNotes, Map<Id, Member_Comments__c> oldMap, Boolean isUpdated, Boolean isDeleted)
    {
        List<Member_Comments__c> notesToProcess = new List<Member_Comments__c>();
        List<Id> memberNotesOwnerIds =  new List<Id>();
        List<Id> accountIds =  new List<Id>();
        List<Id> contactIds =  new List<Id>();

        if(isDeleted == true)
        {
            for(Member_Comments__c note: oldMemberNotes)
            {
                notesToProcess.add(note);
            }
        }
        else
        {
            for(Member_Comments__c note: newMemberNotes)
            {
                notesToProcess.add(note);
            }
        }
        
        for(Member_Comments__c note: notesToProcess)
        {
            memberNotesOwnerIds.add(note.OwnerId);
            accountIds.add(note.Account__c);
            contactIds.add(note.Contact__c);
        }  
        
        try {
           	 
            Messaging.SingleEmailMessage[] messages = new List<Messaging.SingleEmailMessage>();
            EmailTemplate emailTemplate = [SELECT Id, Subject, Description, HtmlValue, DeveloperName, Body FROM EmailTemplate WHERE DeveloperName = 'Comments_Email'];
            Map<Id,User> commentOwnerInfo = new Map<Id, User>([Select Id, Email, name from User where Id IN : memberNotesOwnerIds]);
            Map<Id,Account> accountId = new Map<Id, Account>([Select Id, name from Account where Id IN : accountIds]);
            Map<Id,Contact> contactId = new Map<Id, Contact>([Select Id, name from Contact where Id IN : contactIds]);
            List<User> usersEmail = [SELECT Email FROM User WHERE Id IN (SELECT UserOrGroupId FROM GroupMember WHERE Group.Name = 'Dakota Internal Users Group')];
            List<String> senderUsersEmail = new List<String>();
            User currentUser = [SELECT ID, Name FROM User WHERE Id=:UserInfo.getUserId()];
            
            List<OrgWideEmailAddress> fromEmail = [SELECT Id, Address, DisplayName FROM 
            OrgWideEmailAddress WHERE DisplayName='Dakota Marketplace' AND Address = 'marketplace@dakota.com'];

            for (user u :usersEmail)
            {
                senderUsersEmail.add(u.Email);
            }
            
            for(Member_Comments__c note: notesToProcess)
            {
 
                if(emailTemplate !=null)
                {
                    Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                    email.setReplyTo('no-reply@dakota.co');
                    
                    email.setToAddresses(senderUsersEmail);   
                    if(fromEmail!=null && fromEmail.size()>0)
                    {
                        email.setOrgWideEmailAddressId(fromEmail[0].Id);
                    }
                    String body = emailTemplate.HtmlValue;
                    String subject = emailTemplate.Subject;
                    String sfdcURL = System.Label.Instance_url;

                    if(isUpdated == true)
                    {
                        String oldVal = oldMap.get(note.id).Comment_Details__c;
                        body = body.replace('{!CommentLink}','<br/> <br/>' + 'To see the member comment in Salesforce, visit this link: ' + sfdcURL + note.Id);
                        body = body.replace('{!New_Update_Text}', 'A member comment is edited.');
                        body =  body.replace('{!Added_or_Updated}', 'edited');

                        if(oldVal == null)
                        {
                            body = body.replace('{!OldCommentDetail}', 'Old Comment: ' + '' + '<br/> <br/>');
                        }
                        else
                        {
                            body = body.replace('{!OldCommentDetail}', 'Old Comment: ' + oldVal + '<br/> <br/>');
                        }

                        body = body.replace('{!isNew}', 'New Comment: ');
                        subject = 'Member Comment Edited';

                    } else if (isDeleted == true)
                    {
                        body = body.replace('{!CommentLink}', '');
                        body = body.replace('{!New_Update_Text}', 'A member comment is deleted.');
                        body = body.replace('{!OldCommentDetail}', '');
                        body = body.replace('{!Added_or_Updated}', 'deleted');
                        body = body.replace('{!isNew}', 'Comment: ');
                        subject = 'Member Comment Deleted';
                    }
                    else
                    {
                        body = body.replace('{!CommentLink}', '<br/> <br/>' + 'To see the member comment in Salesforce, visit this link: ' + sfdcURL + note.Id);
                        body = body.replace('{!New_Update_Text}', 'A new member comment is added.');
                        body = body.replace('{!Added_or_Updated}', 'added');
                        body = body.replace('{!OldCommentDetail}', '');
                        body = body.replace('{!isNew}', 'Comment: ');
                    }
                    
                    if(note.OwnerId !=null)
                    {
                        body = body.replace('{!CommentOwner}', currentUser.Name);
                    }
                    
                    if(note.Comment_Details__c !=null)
                    {
                        body = body.replace('{!CommentDetail}', note.Comment_Details__c);
                    }
                    else
                    {
                        body = body.replace('{!CommentDetail}', '');
                    }
                    
                    if(note.Account__c !=null)
                    {
                        body = body.replace('{!RelatedAccountContact}', accountId.get(note.Account__c).Name);
                        body = body.replace('{!RelatedObject}', 'Account');
                    }
                    else
                    {
                        body = body.replace('{!RelatedAccountContact}', contactId.get(note.Contact__c).Name);
                        body = body.replace('{!RelatedObject}', 'Contact');
                    }

                    email.setHtmlBody(body);
                    email.setSubject(subject);
                    messages.add(email);
                }
            }
            Messaging.sendEmail(messages);

        } catch(Exception ex) {  
            System.debug(ex.getMessage() + ex.getStackTraceString());
        }
    }
}