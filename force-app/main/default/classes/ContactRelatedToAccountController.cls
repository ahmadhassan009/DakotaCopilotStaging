public with sharing class ContactRelatedToAccountController { 


    @AuraEnabled
    public static Boolean isInvestmentAllocatorAccount(Id recordId)
    {
        Id invAllocAccRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        List<Account> acc = [SELECT Id from Account where id =:recordId AND RecordTypeId = :invAllocAccRecordTypeId LIMIT 1];
        if(acc!=null && acc.size()>0 )
        {
            return true;
        }
        return false;
    }

    /**
     * gets Account Id and returns related Contacts. 
     */
    @AuraEnabled
    public static List<ContactWithEducation> getAccountRelatedContactRecords(Id recordId, String sortedBy, String sortOrder, String nullOrder, String relatedListName)
    {
        try {
        String contactQuery = 'SELECT Id, Name, AccountId, Title, Asset_Class_Coverage__c,Metro_Area__r.Name, Contact_Type__c, Email, Channel_Focus__c';
        contactQuery += ' FROM Contact WHERE AccountId = :recordId';
        contactQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        if(relatedListName == 'Research Contacts'){
            contactQuery = 'SELECT Id, Name, AccountId, Title, Asset_Class_Coverage__c,Metro_Area__r.Name, Contact_Type__c, Email, Channel_Focus__c';
            contactQuery += ' FROM Contact WHERE AccountId = :recordId AND Contact_Type__c <> \'Financial Advisor\' ';
            contactQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
        }
        List<Contact> returnedRecords = Database.query(contactQuery); 
        return getCollegeField(returnedRecords);
    }
    catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
    }

    /**
     * gets Account Id and returns count of related Contacts. 
     */
    @AuraEnabled
    public static Integer getAccountRelatedContactCount(Id recordId,String relatedListName) {
        if(relatedListName == 'Research Contacts'){
            return [
            SELECT COUNT()
            FROM Contact
            WHERE AccountId = :recordId AND Contact_Type__c <> 'Financial Advisor'
        ];
        }
        return [
            SELECT COUNT()
            FROM Contact
            WHERE AccountId = :recordId
        ];
    }
    
    /**
     * gets Account Id and returns Account Name. 
     */
    @AuraEnabled
    public static Account getAccountName(Id recordId) {
        return [
            SELECT Name,Type
            FROM Account
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ];
    }
    
    /**
     * gets User Id and returns User Details. 
     */
    @AuraEnabled(cacheable=true)
    public static User getUserDetails(String recId) {
        return  [Select Id , Name, firstName from User where Id =:recId];
    }

    /**
     * gets Account Id and all returns related Contacts. 
     */
    @AuraEnabled
    public static List<ContactWithEducation> getAllAccountRelatedContactRecords(Id recordId, Integer recordLimit, Integer offset, String relatedListName )
    {
        try{
        List<Contact> returnedRecords = [SELECT Id, Name, AccountId, Title, Metro_Area__r.Name, Contact_Type__c, Email,Asset_Class_Coverage__c,Channel_Focus__c
            FROM Contact
            WHERE AccountId = :recordId
            ORDER BY Name LIMIT :recordLimit OFFSET :offset];
            if(relatedListName == 'Research Contacts'){
                returnedRecords = [SELECT Id, Name, AccountId, Title, Metro_Area__r.Name, Contact_Type__c, Email,Asset_Class_Coverage__c,Channel_Focus__c
                FROM Contact
                WHERE AccountId = :recordId AND Contact_Type__c <> 'Financial Advisor'
                ORDER BY Name LIMIT :recordLimit OFFSET :offset];
            }
        return getCollegeField(returnedRecords);
        }catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<ContactWithEducation> getCollegeField (List<Contact> contactListToReturn) 
    {   
        List<ContactWithEducation> data = new List<ContactWithEducation>();
        
        Set<id> contactIdList = new Set<id>();
        for(Contact sObj: contactListToReturn)
        {
            contactIdList.add(sObj.Id);
        }
        
        List<Education__c> edList= [SELECT id, name, Contact__c, Degree_Distinction__c, University_Alumni__c, University_Alumni__r.Name FROM Education__c WHERE University_Alumni__c != null AND Degree_Distinction__c != '' AND Contact__c in: contactIdList ORDER BY Year_Graduated__c ASC NULLS LAST];
        
        if(edList.size() > 0)
        {
            Map<Id,Education__c> contactEducationMap = new Map<Id,Education__c>();
            for (Integer i = 0; i <edList.size(); i++)
            {

                if(!contactEducationMap.containsKey(edList[i].Contact__c))
                {
                    contactEducationMap.put(edList[i].Contact__c, edList[i]);
                }
                else
                {
                    Education__c getMapValue = contactEducationMap.get(edList[i].Contact__c);
                    if(getMapValue.Degree_Distinction__c != edList[i].Degree_Distinction__c && edList[i].Degree_Distinction__c == 'Undergraduate')
                    {
                        contactEducationMap.put(edList[i].Contact__c, edList[i]);          
                    }
                }
            }
            for(Contact sObj: contactListToReturn)
            {
                Education__c edu=contactEducationMap.get(sObj.Id);
                String CollegeId='';
                String CollegeName='';

                if(edu!=null && edu.University_Alumni__c!=null && edu.University_Alumni__r.Name!=null) 
                {
                    CollegeId = edu.University_Alumni__c;
                    CollegeName = edu.University_Alumni__r.Name;
                }
                data.add(new ContactWithEducation(sObj.Id, sObj.Name, sObj.AccountId, sObj.Title, sObj.Asset_Class_Coverage__c, sObj.Metro_Area__r.Name,sObj.Metro_Area__c, sObj.Contact_Type__c, sObj.Email, sObj.Channel_Focus__c, CollegeId, CollegeName));  //public DcConsultantContact(String Id, String ContactId,String ContactName,String ContactCompany, String ContactTitle,String ContactMetroArea,String ContactMetroAreaName, String ContactPhone,String ContactEducationCollege, String ContactEducationCollegeName)
            }
        } 
        else {
            for(Contact sObj: contactListToReturn)
            {
                data.add(new ContactWithEducation(sObj.Id, sObj.Name, sObj.AccountId, sObj.Title, sObj.Asset_Class_Coverage__c, sObj.Metro_Area__r.Name,sObj.Metro_Area__c, sObj.Contact_Type__c, sObj.Email, sObj.Channel_Focus__c, '', ''));  //public DcConsultantContact(String Id, String ContactId,String ContactName,String ContactCompany, String ContactTitle,String ContactMetroArea,String ContactMetroAreaName, String ContactPhone,String ContactEducationCollege, String ContactEducationCollegeName)
            }
        }
        return data;       
    }

    @AuraEnabled
    public static Account getAccountDetails(Id recordId) {
        List<Account> acc = [SELECT Id,Type,Copyright__c, RecordType.DeveloperName,ParentId from Account where id =:recordId LIMIT 1];
        if(acc!=null && acc.size()>0 )
        {
            return acc[0];
        }
        return null;
    }


    public class ContactWithEducation {
        @AuraEnabled public String Id = '';

        @AuraEnabled  public String Name = '';
        @AuraEnabled  public String AccountId = '';

        @AuraEnabled  public String Title = '';
         
        @AuraEnabled public String Asset_Class_Coverage = '';

        @AuraEnabled public String metroAreaName = '';
        @AuraEnabled public String metroAreaId ='';
        @AuraEnabled public String Contact_Type = '';
        @AuraEnabled public String Email = '';

        @AuraEnabled public String Channel_Focus = '';

        @AuraEnabled public String ContactEducationCollege = '';
        @AuraEnabled public String ContactEducationCollegeName = '';



         public ContactWithEducation(String Id, String Name,String AccountId,String Title,String Asset_Class_Coverage, String metroAreaName,String metroAreaId,String Contact_Type,String Email, String Channel_Focus,String ContactEducationCollege, String ContactEducationCollegeName) {
            this.Id = Id;
            this.Name = Name;
            this.AccountId = AccountId;
            this.Title = Title;
            this.Asset_Class_Coverage = Asset_Class_Coverage;
            this.metroAreaName = metroAreaName;
            this.metroAreaId =metroAreaId;
            this.Contact_Type = Contact_Type;
            this.Email = Email;
            this.Channel_Focus = Channel_Focus;
            this.ContactEducationCollege = ContactEducationCollege;
            this.ContactEducationCollegeName = ContactEducationCollegeName;
         }
     }
     
}