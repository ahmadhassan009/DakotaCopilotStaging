public with sharing class CrmIntegrationController {
    /**
     * For getting the Organization Id of the current User
     */
    @AuraEnabled
    public static String getOrganizationId()
    {     
        List<User> users = [SELECT Id, ContactId,Contact.AccountId
                            FROM User 
                            WHERE Id=:UserInfo.getUserId()  
                            AND IsPortalEnabled = true
                            AND ContactId != null
                            AND Contact.AccountId != null];
        if(users != null && users.size() > 0)
        {
            return users[0].Contact.AccountId;
        }
        return null;
    }

    /**
     * function takes Account Id and return account name
     */
    @AuraEnabled
    public static String getAccountName(String recordId)
    {     
        List<Account> acc = [SELECT Id, Name
                            FROM Account 
                            WHERE Id=:recordId  
                            ];
        if(acc != null && acc.size() > 0)
        {
            return acc[0].Name;
        }
        return null;
    }

    /**
     * function takes contact Id and return its name
     */
    @AuraEnabled
    public static String getContactName(String recordId)
    {     
        List<Contact> contact = [SELECT Id, LastName, FirstName, MiddleName
                            FROM Contact 
                            WHERE Id=:recordId  
                            ];
        
        if(contact != null && contact.size() > 0)
        {
            String contactName = '';
            if (!String.isBlank(contact[0].FirstName)) {
                contactName = contact[0].FirstName;
                if (!String.isBlank(contact[0].MiddleName)) {
                    contactName += ' '+contact[0].middleName + ' ' + contact[0].LastName;
                } else {
                    contactName +=  ' '+contact[0].lastName;
                }
            } else {
                if (!String.isBlank(contact[0].MiddleName)) {
                    contactName = contact[0].middleName+ ' ' + contact[0].LastName;
                    
                } else {
                    contactName = contact[0].lastName;
                }
                
            }
            return contactName;
        }
        return null;
    }

    /**
     * function takes Account Id and returns Data Integerations checkbox value
     */
    @AuraEnabled
    public static String checkDataIntegerationsAccess(String orgId)
    {     
        List<Account> acc = [SELECT Id, Name, Data_Integerations__c
                            FROM Account 
                            WHERE Id=:orgId  
                            ];
        if(acc != null && acc.size() > 0)
        {
            return acc[0].Data_Integerations__c;
        }
        return null;
    }

    /*
     * For getting the TimeZone of the current User
     */
    @AuraEnabled
    public static String getCurrentUserTimeZone()
    {     
        TimeZone tz = UserInfo.getTimeZone();
        return tz.getID();
    }
}