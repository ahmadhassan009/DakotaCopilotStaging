public with sharing class RelatedContactofAccountController {
    /**
     * gets Account Id and returns Account Name
     */
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountName(Id recordId) {
        return [
            SELECT Name FROM Account WHERE Id =: recordId ORDER BY Name
        ];
    }
    
    /**
     * gets Account Id and Roles not Null and returns related AccountContactRelation records
     */
    @AuraEnabled
    public static List<SObject> getRelatedContactsToAccount (Id recordId, String sortedBy, String sortOrder, Boolean isForm5500) {  
        String Role = System.Label.AccountContactRelation_Role;  
        String query = '';
        if(isForm5500 == true)
        {
            query = 'SELECT Id, AccountId, Account.Name, ContactId, Contact.Name, Contact.Title, Contact.Email,Contact.Phone,Contact.Metro_Area__r.Name FROM AccountContactRelation WHERE AccountId = :recordId AND Contact.Form_5500_Contact__c = true AND Roles = :Role';
        }
        else {
            String DcConsultant_Role = System.Label.HiddenAccountContactRelation_Role;
            List<String> restrictedRoles = new List<String>{Role,DcConsultant_Role};
            query = 'SELECT Id, AccountId, Account.Name, ContactId, Contact.Name, Contact.Title, Contact.Email, Contact.Phone, Contact.Account.Name, Roles  FROM AccountContactRelation WHERE AccountId = :recordId AND Contact.Form_5500_Contact__c = false AND Roles != null AND Roles NOT IN :restrictedRoles';
        }
        query += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS LAST LIMIT 10'; 
        List<SObject> contactListToReturn = Database.query(query);
        return contactListToReturn;
    }

    /**
     * gets Account Id and returns count of related AccountContactRelation. 
     */
    @AuraEnabled
    public static Integer getRelatedContactCount(Id recordId, Boolean isForm5500) {
        String Role = System.Label.AccountContactRelation_Role;
        if(isForm5500 == true)
        {
            return [
                SELECT COUNT() FROM AccountContactRelation WHERE AccountId = :recordId AND Contact.Form_5500_Contact__c = true AND Roles = :Role
            ];
        }
        String DcConsultant_Role = System.Label.HiddenAccountContactRelation_Role;
        List<String> restrictedRoles = new List<String>{Role,DcConsultant_Role};
        return [
            SELECT COUNT() FROM AccountContactRelation WHERE AccountId = :recordId AND Contact.Form_5500_Contact__c = false AND Roles != null AND Roles Not IN :restrictedRoles 
        ];
        
    }
    
     /**
     * gets Account Id and relationship type and returns all related AccountContactRelation. 
     */
    @AuraEnabled
    public static List<AccountContactRelation> getAllRelatedSortedContactsofAccount (Id recordId, Integer recordLimit, Integer offset,String sortBy, String sortOrder,Boolean isForm5500 ) {
        String Role = System.Label.AccountContactRelation_Role;
        String allContactQuery = '';
        if(isForm5500 == true)
        {
            allContactQuery = 'SELECT Id, AccountId, Account.Name, ContactId, Contact.Name, Contact.Title, Contact.Email,Contact.Phone,Contact.Metro_Area__r.Name FROM AccountContactRelation WHERE AccountId = :recordId AND Contact.Form_5500_Contact__c = true AND Roles = :Role';
        }
        else {
            String DcConsultant_Role = System.Label.HiddenAccountContactRelation_Role;
            List<String> restrictedRoles = new List<String>{Role,DcConsultant_Role};
            allContactQuery = 'SELECT Id, AccountId, Account.Name, ContactId, Contact.Name, Contact.Title, Contact.Email, Contact.Phone, Contact.Account.Name, Roles  FROM AccountContactRelation WHERE AccountId = :recordId AND Contact.Form_5500_Contact__c = false AND Roles != null AND Roles NOT IN :restrictedRoles';
        }
        allContactQuery += ' ORDER BY '+sortBy+' '+sortOrder+ ' NULLS LAST LIMIT :recordLimit offset '+offset;
        List<AccountContactRelation> contactListToReturn = Database.query(allContactQuery);
        return contactListToReturn;
    }  


    @AuraEnabled
    public static Boolean isForm5500Record(Id recordId) {
      
        List<Account> acc = [Select id from Account where id =: recordId AND Form_5500_Account__c = True];
        if(acc !=null && acc.size() > 0 )
            return true;
        return false;
    }
}