trigger DocuSign_Status_Mail on dsfs__DocuSign_Status__c (after insert, after update) 
{
Public with sharing class Email {
    Public void doEmail(dsfs__DocuSign_Status__c att)
    {
    try
    {
        String QuoteId = att.ZQuote__c; 
        String ParentIdDoc = att.Id;
        List<zqu__Quote__c> QuoteList = [select Id,Name,OwnerId,zqu__BillToContact__c,zqu__Account__c,zqu__PaymentMethod__c,
                                        zqu__Status__c,zqu__Number__c from zqu__Quote__c where Id =:QuoteId];
        zqu__Quote__c QuoteObj = QuoteList.get(QuoteList.size() - 1);
        String OwnId = QuoteObj.OwnerId;
        String AccId = QuoteObj.zqu__Account__c;
        User Usr = [select Name,Email from User where Id =:OwnId];
        Account Acc = [select Name from Account where Id =:AccId];
        String messageBody;    
        List<String> ccTo = new List<String>();    

        // Set the mail attributes
    
    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setUseSignature(false);
    String[] Email22 = new String[]{Usr.Email};
    
    mail.setToAddresses(Email22);
    mail.setSubject('Dakota: Quote Document has been signed off by both parties');
    messageBody='<html><body>Hello ' + Usr.Name +'!!<br></br><br></br>Following Quote has been successfully signed off through DocuSign by both parties. You can review and send it to Zuora for billing<br></br><br></br>Quote Number: <a href=https://dakotanetworks.my.salesforce.com/'+QuoteObj.Id+'> '+QuoteObj.zqu__Number__c+'</a><br></br>Account Name: '+Acc.Name+'  </a></body></html>';
    mail.setHtmlBody(messageBody);
    // Send the email
    Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }
   catch(Exception e) {
    System.debug('The following exception has occurred: ' + e.getMessage());
} 
  }
 

}
  try
  {
   List<dsfs__DocuSign_Status__c> DocStatusList = trigger.New; 
    dsfs__DocuSign_Status__c attn = DocStatusList.get(DocStatusList.size() -1);
    zqu__Quote__c upQuote=[select Id from zqu__Quote__c where Id=:attn.zQuote__c];
    upQuote.Docusign_Status__c=attn.dsfs__Envelope_Status__c;
    update upQuote;
    Email email = new Email();
    String Status = attn.dsfs__Envelope_Status__c;
    if(status.equalsIgnoreCase('Completed'))
    email.doEmail(attn);
   }
   catch(Exception e) {
    System.debug('The following exception has occurred: ' + e.getMessage());
}
          
}