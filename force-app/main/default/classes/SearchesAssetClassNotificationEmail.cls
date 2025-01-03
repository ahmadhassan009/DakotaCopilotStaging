public class SearchesAssetClassNotificationEmail {
    
    public static void sendSearchesAssetClassEmail(List<Contact> contacts,Marketplace_Searches__c searchRecord)
    {
        List<EmailTemplate> emailTemplate = [Select Id,Subject,Description,HtmlValue,Body from EmailTemplate where DeveloperName = 'Searches_Asset_Class_Email_Template'];
        OrgWideEmailAddress orgWideAddress = [Select Id, Address, DisplayName from OrgWideEmailAddress where Address = 'mloeslein@dakota.com' Limit 1];
        if (searchRecord.Search_Status__c == 'Pacing') {
            pacingTemplate(contacts, searchRecord, emailTemplate, orgWideAddress);
        } else {
            nonPacingTemplate(contacts, searchRecord, emailTemplate, orgWideAddress);
        }
        
    }
    /**
     * Function gets called when picklist option is selected is not pacing
     */
    public static void nonPacingTemplate(List<Contact> contacts, Marketplace_Searches__c searchRecord, List<EmailTemplate> emailTemplate, OrgWideEmailAddress orgWideAddress)
    {
        List<Messaging.SingleEmailMessage> emailsToBeSent = new List<Messaging.SingleEmailMessage>();
        List<Task> tasksToBeCreated = new List<Task>();
        
        String searchesName = searchRecord.Name != null ? searchRecord.Name : '';
        String accountName = searchRecord.Account__c != null ? searchRecord.Account__r.Name : '';
        String consultantInformation = '';

        //Account: {Search.AccountName}
        if(String.isNotBlank(accountName)) {
            consultantInformation += '<u>' +accountName+'</u>'+ '<br>';
        }
        //Asset Class / Sub-Asset Class: {Search.AssetClass} / {Search.SubAssetClass}
        if(searchRecord.Asset_Class__c != null && searchRecord.Sub_Asset_Class__c != null) {
            consultantInformation += searchRecord.Asset_Class__c +' / '+String.valueOf(searchRecord.Sub_Asset_Class__c).replace(';',', ') + '<br>';
        } else if(searchRecord.Asset_Class__c != null) {
            consultantInformation += searchRecord.Asset_Class__c + '<br>';
        } else if(searchRecord.Sub_Asset_Class__c != null) {
            consultantInformation += String.valueOf(searchRecord.Sub_Asset_Class__c).replace(';',', ') + '<br>';
        }
        //Amount: {Search.Amount}
        if(searchRecord.Amount__c != null) {
            consultantInformation += '<b>Amount:</b> ' + '$'+String.valueOf(searchRecord.Amount__c.format()) + '<br>';
        }
        // RFP Deadline: {Search.Deadline}
        if(searchRecord.End_Date__c != null) {
            consultantInformation += '<b>RFP Deadline:</b> ' + String.valueOf(searchRecord.End_Date__c.format()) + '<br>';
        }
        //Consultant: {Search.Consultant}
        if(searchRecord.Consultant__c != null) {
            consultantInformation += '<b>Consultant</b>: ' + searchRecord.Consultant__r.Name + '<br>';                
        }
        //Field Consultant: {Search.FieldConsultant}
        if(searchRecord.Contact__c != null) {
            consultantInformation += '<b>Field Consultant:</b> ' + searchRecord.Contact__r.Name + '<br>';
        }
        //Requirements: {Search.Requirements}
        if(searchRecord.Requirements__c != null) {
            consultantInformation += '<b>Requirements:</b> ' + formatRichText(searchRecord.Requirements__c) + '<br>';
        }
        //Additional Information: {Search.AdditionalInformation}
        if(searchRecord.Additional_Information__c != null) {
            consultantInformation += '<b>Additional Information:</b> ' + formatRichText(searchRecord.Additional_Information__c) + '<br>';
        }
        //Search URL: {Search.SearchURL}
        if(searchRecord.Search_URL__c != null) {
            consultantInformation += '<b>Search URL:</b> ' + searchRecord.Search_URL__c + '<br>';
        }
        // Dakota Marketplace Search URL: {Link to Search record page in Marketplace}
        consultantInformation += '<br>'+'View in Dakota Marketplace by clicking <a href="'+getSearchUrl(searchRecord.Id)+'">here</a><br>';
  
        if(EmailTemplate.size() > 0 && orgWideAddress != null){
            for(Contact cnct:contacts)
            {
                Task singleTask = createTasks(searchRecord, cnct);
                tasksToBeCreated.add(singleTask);
                
                Messaging.SingleEmailMessage email = getEmailObj(cnct, orgWideAddress);
                
                String body = emailTemplate.get(0).HtmlValue;
                String subject = emailTemplate.get(0).Subject;
                String SearchesClass = '';
                if(searchRecord.Sub_Asset_Class__c != null) {
                    SearchesClass += String.valueOf(searchRecord.Sub_Asset_Class__c).replace(';',', ');
                } else if(searchRecord.Asset_Class__c != null) {
                    SearchesClass += searchRecord.Asset_Class__c;
                }
                subject = subject.replace('{{SearchAccountName}}','New Search: '+SearchesClass);
                
                body = body.replace('{{FirstName}}',cnct.FirstName != null ? ' ' + cnct.FirstName : '');
                body = body.replace('{{SearchAccountName}}','an active search regarding '+accountName);
                body = body.replace('{{consultantInformation}}',consultantInformation);
                
                email.setSubject(Subject);
                email.setHTMLBody(Body);
                emailsToBeSent.add(email);
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
     * Function gets called when picklist option is selected is pacing
     */
    public static void pacingTemplate(List<Contact> contacts, Marketplace_Searches__c searchRecord,  List<EmailTemplate> emailTemplate, OrgWideEmailAddress orgWideAddress)
    {
        List<Messaging.SingleEmailMessage> emailsToBeSent = new List<Messaging.SingleEmailMessage>();
        List<Task> tasksToBeCreated = new List<Task>();
        
        String searchesName = searchRecord.Name != null ? searchRecord.Name : '';
        String accountName = searchRecord.Account__c != null ? searchRecord.Account__r.Name : '';
        String consultantInformation = '';


        //Account: {Search.AccountName}
        if(String.isNotBlank(accountName)) {
            consultantInformation += '<u>'+accountName+ '</u><br>';
        }
        //Asset Class / Sub-Asset Class: {Search.AssetClass} / {Search.SubAssetClass}
        if(searchRecord.Asset_Class__c != null && searchRecord.Sub_Asset_Class__c != null) {
            consultantInformation += searchRecord.Asset_Class__c +' / '+String.valueOf(searchRecord.Sub_Asset_Class__c).replace(';',', ') + '<br>';
        } else if(searchRecord.Asset_Class__c != null) {
            consultantInformation += searchRecord.Asset_Class__c + '<br>';
        } else if(searchRecord.Sub_Asset_Class__c != null) {
            consultantInformation += String.valueOf(searchRecord.Sub_Asset_Class__c).replace(';',', ') + '<br>';
        }
        //Pacing Information: {Search.PacingInformation}
        if(searchRecord.Pacing_Information__c != null) {
            consultantInformation += '<b>Pacing Information:</b> ' + formatRichText(searchRecord.Pacing_Information__c) + '<br>';
        }
        //Consultant: {Search.Consultant}
        if(searchRecord.Consultant__c != null) {
            consultantInformation += '<b>Consultant:</b> ' + searchRecord.Consultant__r.Name + '<br>';                
        }
        //Field Consultant: {Search.FieldConsultant}
        if(searchRecord.Contact__c != null) {
            consultantInformation += '<b>Field Consultant:</b> ' + searchRecord.Contact__r.Name + '<br>';
        }
        //Additional Information: {Search.AdditionalInformation}
        if(searchRecord.Additional_Information__c != null) {
            consultantInformation += '<b>Additional Information:</b> ' + formatRichText(searchRecord.Additional_Information__c) + '<br>';
        }
        //Search URL: {Search.SearchURL}
        if(searchRecord.Search_URL__c != null) {
            consultantInformation += '<b>Search URL:</b> ' + searchRecord.Search_URL__c + '<br>';
        }
        // Dakota Marketplace Search URL: {Link to Search record page in Marketplace
        consultantInformation += '<br>'+'View in Dakota Marketplace by clicking <a href="'+getSearchUrl(searchRecord.Id)+'">here</a><br>';
        

        
        if(EmailTemplate.size() > 0 && orgWideAddress != null){
            for(Contact cnct:contacts)
            {
                Task singleTask = createTasks(searchRecord, cnct);
                tasksToBeCreated.add(singleTask);

                //getting email object
                Messaging.SingleEmailMessage email = getEmailObj(cnct, orgWideAddress);
                
                
                String body = emailTemplate.get(0).HtmlValue;
                String subject = emailTemplate.get(0).Subject;
                
                subject = subject.replace('{{SearchAccountName}}',accountName+' Pacing Update');
            
                body = body.replace('{{FirstName}}',cnct.FirstName != null ? ' ' + cnct.FirstName : '');
                body = body.replace('{{SearchAccountName}}','a pacing update regarding '+accountName);
                body = body.replace('{{consultantInformation}}',consultantInformation);
                
                email.setSubject(Subject);
                email.setHTMLBody(Body);
                emailsToBeSent.add(email);
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
     * function return comunity url appended with detail view record id
     */
    public static String getSearchUrl (Id searchID) {
        return System.Label.Marketplace_Community_Base_URL+'marketplace-searches/'+searchID;
    }

    /**
     * function initializes and returns email object
     */
    public static Messaging.SingleEmailMessage getEmailObj(Contact cnct, OrgWideEmailAddress orgWideAddress)
    {
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        List<String> sendTo = new List<String>{cnct.Email};
        email.setToAddresses(sendTo);
        email.setReplyTo('no-reply@dakota.co');
        email.setUseSignature(false); 
        email.setBccSender(false); 
        email.setSaveAsActivity(false);
        email.setOrgWideEmailAddressId(orgWideAddress.Id);
        return email;
    }

    /**
     * function takes contact object and creates a tasks, returns the new task object
     */
    public static Task createTasks(Marketplace_Searches__c searchRecord, Contact cnct)
    {
        Task singleTask = new Task();
        singleTask.OwnerId = UserInfo.getUserId();
        singleTask.Description = searchRecord.Description__c;
        singleTask.ActivityDate = System.now().Date();
        singleTask.WhoId = cnct.Id;
        singleTask.Priority = 'Normal';
        singleTask.Status = 'Completed';
        singleTask.WhatId = searchRecord.Id;
        singleTask.Subject = 'New Search Alert for '+searchRecord.Account__r.Name;
        return singleTask;
    }

    /**
     * function removes the startig and ending p tag from rich HTML field to for single line field and label
     * function to remove font-size from rich text area value
     */
    public static string formatRichText(String fieldValue)
    {
        if(fieldValue.substring(0,3) == '<p>') {
            fieldValue = fieldValue.replaceFirst('<p>','');
            fieldValue = fieldValue.replaceFirst('</p>','');
        }
        //removing BOM characters from string
        fieldValue = fieldValue.replaceall('[^\\x00-\\x7F]', '');
        //remove font-size from rich text area value
        fieldValue = fieldValue.replaceAll('font-size:[^;\']*(;)?','');
        return fieldValue;
    }
}