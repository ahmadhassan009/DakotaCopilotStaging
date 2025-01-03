public with sharing class caseApprovalRequestController {
 
    @AuraEnabled
    public static User getUserEmail(Id userId) {
        return [
            SELECT Id, email
            FROM User
            WHERE Id =: userId];
    }
    
    @AuraEnabled
    public static Case updateCaseApproved(Id recordId)
    {	
       Id contactRecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByName().get('Investment Allocator Contact').getRecordTypeId();
        Contact contact =new Contact();
        Case cs = [SELECT Id, First_Name__c, Contact_Last_Name__c, Biography__c, Mailing_Street__c, Mailing_City__c, Mailing_State__c, 
                   Mailing_Zip_Postal_Code__c,  Mailing_Country__c, Asset_Class_Coverage__c, Contact_Type__c, Title__c, AccountId, Metro_Area__c, Phone__c, Email__c, Case_Approved__c, LinkedIn_URL__c
                   FROM Case WHERE Id =: recordId];
        try{
            
            contact.FirstName = cs.First_Name__c;
            contact.LastName =cs.Contact_Last_Name__c;
            contact.Biography__c =cs.Biography__c;
            contact.MailingStreet = cs.Mailing_Street__c;
            contact.MailingCity =cs.Mailing_City__c;
            contact.MailingState = cs.Mailing_State__c;
            contact.MailingPostalCode = cs.Mailing_Zip_Postal_Code__c;
            contact.MailingCountry = cs.Mailing_Country__c;
            contact.Asset_Class_Coverage__c =cs.Asset_Class_Coverage__c;
            contact.Contact_Type__c = cs.Contact_Type__c;
            contact.Title = cs.Title__c;
            contact.AccountId = cs.AccountId;
            contact.Metro_Area__c = cs.Metro_Area__c;
            contact.Phone =cs.Phone__c;
            contact.Email =cs.Email__c;
            contact.RecordTypeId = contactRecordTypeId;
            contact.Marketplace_Verified_Contact__c = true;
            contact.Marketplace_Verified_Date__c = date.today();
            contact.Ref_Case_ID__c = cs.Id;
            contact.LinkedIn_URL__c = cs.LinkedIn_URL__c;
            contact.Admin_Validation_Bypass__c =true;
            insert contact;
            
            cs.Case_Approved__c = true;
            cs.Status = 'Closed';
            update cs;
        	
         } catch(DmlException e) {
            System.debug('The following exception has occurred: ' + e.getMessage());
            String errorMsg = e.getMessage();
            throw new AuraHandledException(errorMsg);
		}
     	return cs;	
    }
}