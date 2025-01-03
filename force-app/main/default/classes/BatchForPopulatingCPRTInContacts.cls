public class BatchForPopulatingCPRTInContacts  implements Database.Batchable<sObject> 
{    
    public Database.QueryLocator start(Database.BatchableContext context) 
    {
        return Database.getQueryLocator([Select ID, California_Privacy_Regulation_Tracker__c from Contact WHERE (MailingState ='CA' OR MailingState ='California')]);
    }
    
    public void execute(Database.BatchableContext context, List<Contact> fetchedContacts) 
    {
        Map<Id,Contact> conWithCPRAList = new Map<ID,Contact> ([SELECT Id,California_Privacy_Regulation_Tracker__c,MailingStreet, 
                                                                MailingCity, MailingPostalCode, MailingCountry, MailingState, 
                                                                Phone, Biography__c, Email, Title,
                                                                (SELECT Id, Contact_Field__c,Contact__c FROM CPRA_Tracking__r) 
                                                                FROM Contact WHERE Id IN :fetchedContacts]);
        List<Contact> contactsToBeUpdated = new List<Contact>();
        for(Contact cnct : conWithCPRAList.values())
        {
            String CPRTValue = '';
            if(cnct.CPRA_Tracking__r != null && cnct.CPRA_Tracking__r ?.size() > 0)
            {
                CPRTValue = TriggerOnCPRATrackingService.getMissingContactFields(cnct.CPRA_Tracking__r,conWithCPRAList);

                if(CPRTValue != '')
                {
                    cnct.California_Privacy_Regulation_Tracker__c = CPRTValue;
                }
                else
                { 
                    cnct.California_Privacy_Regulation_Tracker__c = 'All Information Publicly Available'; 
                }
            }
            else
            {
                 Set<String> CPRA_Options = new Set<String>{'Address','Title','Bio','Email','Phone'};
                 if(cnct.Email == null) CPRA_Options.remove('Email');
                 if(cnct.Title == null) CPRA_Options.remove('Title');
                 if(!TriggerOnContactHelper.checkMailingAddressValues(cnct)) CPRA_Options.remove('Address');
                 if(cnct.Phone == null) CPRA_Options.remove('Phone');
                 if(cnct.Biography__c == null) CPRA_Options.remove('Bio');
                 cnct.California_Privacy_Regulation_Tracker__c = CPRA_Options.size() > 0 ? String.join(new List<String>(CPRA_Options),';') : null;
            }
            
            contactsToBeUpdated.add(cnct);
        }
        if(contactsToBeUpdated.size() > 0)
        {
            update contactsToBeUpdated;
        }
    }
    
    public void finish(Database.BatchableContext context) {
    }
}