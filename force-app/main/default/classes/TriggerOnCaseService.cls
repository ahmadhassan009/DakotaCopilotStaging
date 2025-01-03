public class TriggerOnCaseService {
    
    public static void setPhoneAndBillingAddress(List<Case> newCases, Map<Id,Case> oldCases)
    {
        Id caseRecordTypeId = Schema.getGlobalDescribe().get('Case').getDescribe().getRecordTypeInfosByDeveloperName().get('Create_Contacts').getRecordTypeId();
        Map<ID,Account> accMap = new Map<ID,Account>();   
        for(Case c : newCases)
        {
            accMap.put(c.AccountId,null);        
        }     
        accMap = new Map<ID,Account>([Select ID, Phone,BillingStreet,BillingCity,BillingState,BillingPostalCode,BillingCountry from Account where ID IN :accMap.keySet()]);
        for(Case newCase:newCases)
        {
            if(newCase.RecordTypeId == caseRecordTypeId){     
                if(newCase.Phone__c == null)
                {
                    newCase.Phone__c = accMap.get(newCase.AccountId).Phone;
                }
                if(newCase.Mailing_Street__c == null &&
                   newCase.Mailing_Zip_Postal_Code__c == null && newCase.Mailing_City__c == null
                   && newCase.Mailing_State__c == null && newCase.Mailing_Country__c == null)
                {
                    newCase.Mailing_Street__c = accMap.get(newCase.AccountId).BillingStreet;  
                    newCase.Mailing_Zip_Postal_Code__c = accMap.get(newCase.AccountId).BillingPostalCode;               
                    newCase.Mailing_City__c = accMap.get(newCase.AccountId).BillingCity;               
                    newCase.Mailing_State__c = accMap.get(newCase.AccountId).BillingState;               
                    newCase.Mailing_Country__c = accMap.get(newCase.AccountId).BillingCountry;               
                }        
            }
        }
    }
    
    public static void setContactSearchAssetClasses(List<Case> newCases, Map<Id,Case> oldCases)
    {
        Set<Id> contactIds = new Set<Id>();
        List<Case> casesToBeWorkedOn = new List<Case>();
        
        for(Case newCase:newCases)
        {
            if(newCase.Origin == 'Web' && newCase.Subject == 'Asset Class Preference' && newCase.ContactId != null && 
               (Trigger.IsInsert || (Trigger.IsUpdate && oldCases != null && oldCases.get(newCase.Id) != null && oldCases.get(newCase.Id).ContactId == null)))
            {
                contactIds.add(newCase.ContactId);
                casesToBeWorkedOn.add(newCase);
            }
        }
        
        Map<Id,Contact> matchedContacts = new Map<Id,Contact>([Select Id,Name,Email,Searches_Asset_Class__c,Searches_Email__c from Contact where Id In :contactIds]);
        
        List<Contact> contactsToBeUpdated = new List<Contact>();
        for(Case newCase:casesToBeWorkedOn)
        {
            if(matchedContacts.containsKey(newCase.ContactId))
            {
                Contact cnct = matchedContacts.get(newCase.ContactId);
                String assetClassValues = '';
                Boolean updateAssetClass = false;
                Boolean searchesEmailStatusChanged = false;
                if(cnct.Searches_Email__c == false)
                {
                    cnct.Searches_Email__c = true;
                    searchesEmailStatusChanged = true;
                }
                if(newCase.Emerging_Manager_Searches__c)
                {
                    updateAssetClass = true;
                    assetClassValues += 'Emerging Manager Searches' + ';';
                }
                if(newCase.Equities_and_Fixed_Income_Searches__c)
                {
                    updateAssetClass = true;
                    assetClassValues += 'Fixed Income' + ';';
                    
                }
                if(newCase.Private_Credit_Searches__c)
                {
                    updateAssetClass = true;
                    assetClassValues += 'Private Credit' + ';';
                }
                if(newCase.Private_Equity_Searches__c)
                {
                    updateAssetClass = true;
                    assetClassValues += 'Private Equity' + ';';
                }
                if(newCase.Private_Real_Estate_Searches__c)
                {
                    updateAssetClass = true;
                    assetClassValues += 'Private Real Estate' + ';';
                }
                if(newCase.Equities__c)
                {
                    updateAssetClass = true;
                    assetClassValues += 'Equities' + ';';
                }
                if(newCase.Hedge_Funds__c)
                {
                    updateAssetClass = true;
                    assetClassValues += 'Hedge Funds' + ';';
                }
                if(newCase.International_Equities__c)
                {
                    updateAssetClass = true;
                    assetClassValues += 'International Equities' + ';';
                }
                
                if(updateAssetClass == true || searchesEmailStatusChanged == true)
                {
                    if(updateAssetClass == true)
                    {
                        assetClassValues.replace(';;', ';');
                        cnct.Searches_Asset_Class__c = assetClassValues;
                    }
                    contactsToBeUpdated.add(cnct);
                    newCase.Status = 'Closed';
                }
                else 
                {
                    newCase.Status = 'Closed';
                }                
            }
        }
        
        if(contactsToBeUpdated.size() > 0)
        {
            update contactsToBeUpdated;
        }
    }
    public static void sendEmailtoApprovers(List<Case> newCases)
    {
        
        List<Id> caseOwnerIds =  new List<Id>();
        for(Case cs: newCases){
            caseOwnerIds.add(cs.OwnerId);
        }        
        try {
            Messaging.SingleEmailMessage[] messages = new List<Messaging.SingleEmailMessage>();
            EmailTemplate emailTemplate = [Select Id,Subject,Description,HtmlValue,Body from EmailTemplate where developername = 'Case_Approval_Email_Custom'];
            Map<Id,User> caseOwnerInfo = new Map<Id, User>([Select Id, Email, name from User where Id IN : caseOwnerIds]);
            Id caseRecordTypeId = Schema.getGlobalDescribe().get('Case').getDescribe().getRecordTypeInfosByDeveloperName().get('Create_Contacts').getRecordTypeId();
            Map<ID,Account> accMap = new Map<ID,Account>();
            List<OrgWideEmailAddress> fromEmail = [SELECT Id, Address, DisplayName FROM 
                                                    OrgWideEmailAddress WHERE DisplayName='Dakota Marketplace' AND Address = 'marketplace@dakota.com'];
            for(Case c : newCases)
            {
                accMap.put(c.AccountId,null);
            }     
            accMap = new Map<ID,Account>([Select ID, Name from Account where ID IN :accMap.keySet()]);
            
            for(Case cs: newCases){

                
                if(cs.RecordTypeId == caseRecordTypeId){
                    String caseUrl = '<a href="'+System.Label.Instance_url+ 'lightning/r/Case/' + cs.Id +'/view/" target="_blank">'+System.Label.Instance_url + 'lightning/r/Case/' + cs.Id +'/view'+'</a>';	            
                    if(emailTemplate !=null){
                        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                        email.setReplyTo('no-reply@dakota.co');
                        
                        List<String> sendTo = new List<String>();
                        sendTo.addAll((Label.Case_Approvers).split(';'));
                        email.setToAddresses(sendTo);
                        if(fromEmail != null && fromEmail.size() > 0)
                        {
                            email.setOrgWideEmailAddressId(fromEmail[0].Id);
                        }
                        
                        String body = emailTemplate.HtmlValue;
                        String subject = emailTemplate.Subject;
                        String accountName;
                        String contactName;
                        String contactEmail;
                        if(cs.OwnerId !=null){
                            body = body.replace('{!CaseOwner}', caseOwnerInfo.get(cs.OwnerId).Name);
                        }                        
                        if(cs.Id !=null){
                            body = body.replace('{!CaseLink}', caseUrl);
                        }
                        contactName = 'Contact Name: '+ cs.First_Name__c+' '+cs.Contact_Last_Name__c;
                        if(accMap.containsKey(cs.AccountId))
                        {
                            accountName = 'Account Name: '+accMap.get(cs.AccountId).Name;
                        }                        
                        if(cs.Email__c != null )
                        {
                            contactEmail = 'Email: '+ cs.Email__c;  
                            body = body.replace('{!CaseInfo}', contactName +'<br/>' + accountName +'<br/>' +contactEmail);                                   
                        } 
                        else {
                            body = body.replace('{!CaseInfo}', contactName +'<br/>' + accountName);                                   
                        }
                        body = body.replace(']]>', '');
                        body = body.replace('<![CDATA[', '');
                        
                        email.setHtmlBody(body);
                        email.setSubject(subject);
                        messages.add(email);
                    }   
                }
            }
            if(messages != null){
                Messaging.sendEmail(messages);
            }
        } catch(Exception ex) {  
            System.debug(ex.getMessage() + ex.getStackTraceString());
        }
    }
}