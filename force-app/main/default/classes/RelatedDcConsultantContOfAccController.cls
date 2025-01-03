public with sharing class RelatedDcConsultantContOfAccController {
    
    public static String Role = 'DC Consultant';
    
    @AuraEnabled
    public static List<DcConsultantContact> getCollegeField (List<Account_Contact_Relation__c> contactListToReturn) 
    {   
        List<DcConsultantContact> data = new List<DcConsultantContact>();
        
        Set<id> contactIdList = new Set<id>();
        Set<id> contactRelatedAccountIdList = new Set<id>();
        
        for(Account_Contact_Relation__c sObj: contactListToReturn)
        {
            contactIdList.add(sObj.Contact__c);
            contactRelatedAccountIdList.add(sObj.Contact__r?.AccountId);
        }
        
        Map<Id, Account> acc = new Map<Id, Account>([select Id, MetroArea__r.Name from Account where id in :contactRelatedAccountIdList]);
        
        List<Education__c> edList= [select id,name,Contact__c,Degree_Distinction__c,University_Alumni__c,University_Alumni__r.Name from Education__c where Degree_Distinction__c!='' and Contact__c in: contactIdList order by Year_Graduated__c ASC NULLS LAST];
        
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
            for(Account_Contact_Relation__c sObj: contactListToReturn)
            {
                Education__c edu=contactEducationMap.get(sObj.Contact__c);
                String CollegeId='';
                String CollegeName='';
                
                if(edu!=null && edu.University_Alumni__c!=null && edu.University_Alumni__r.Name!=null) 
                {
                    CollegeId = edu.University_Alumni__c;
                    CollegeName = edu.University_Alumni__r.Name;
                }
                if(acc.get(sObj.Contact__r?.AccountId)!=null)
                data.add(new DcConsultantContact(sObj.Id, sObj.Contact__c, sObj.Contact__r?.Name, sObj.Contact__r?.Email, sObj.Account__r?.Name,sObj.Account__r?.MetroArea__c, sObj.Contact__r?.AccountId, sObj.Contact__r?.Account.Name, sObj.Contact__r?.Title, sObj.Contact__r.Metro_Area__c, sObj.Contact__r.Metro_Area__r.Name, sObj.Contact__r?.Phone, CollegeId, CollegeName));
                
            }
        } 
        else {
            for(Account_Contact_Relation__c sObj: contactListToReturn)
            {
                data.add(new DcConsultantContact(sObj.Id, sObj.Contact__c, sObj.Contact__r?.Name, sObj.Contact__r?.Email, sObj.Account__r?.Name,sObj.Account__r?.MetroArea__c, sObj.Contact__r?.AccountId, sObj.Contact__r?.Account.Name, sObj.Contact__r?.Title, sObj.Contact__r.Metro_Area__c, sObj.Contact__r.Metro_Area__r.Name, sObj.Contact__r?.Phone, '', ''));
            }
        }
        
        return data;       
    }
    
    @AuraEnabled
    public static Integer getCountOfLevelOneAndTwoRecords(Id recordId, String accMetroArea,String accState,List<String> unAccessibleContactIds) 
    {
        String whereCondition = '';
        String query = '';
        if(accState!=null && accMetroArea!=null )
        {
            whereCondition = ' AND (Contact__r.Metro_Area__c= :accMetroArea OR Contact__r.MailingState = :accState)';
        }
        else if(accState!=null && accMetroArea==null )
        {
            whereCondition = ' AND Contact__r.MailingState = :accState';
        }
        else if(accState==null && accMetroArea!=null )
        {
            whereCondition = ' AND Contact__r.Metro_Area__c= :accMetroArea';
        }
        else
        {
            return 0;
        }
        query += 'SELECT Count() FROM Account_Contact_Relation__c WHERE Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds'+ whereCondition;
        return  Database.countQuery(query);
       
    }
    
    @AuraEnabled
    public static Integer getCountOfSuggestedConsultants(Id recordId, String accMetroArea,String accState,List<String> unAccessibleContactIds) 
    {
        String whereCondition = '';
        if(accState!=null && accMetroArea!=null )
        {
            whereCondition = 'AND (Contact__r.Metro_Area__c!= :accMetroArea AND Contact__r.MailingState != :accState) ';
        }
        else if(accState==null && accMetroArea!=null )
        {
            whereCondition = ' AND Contact__r.Metro_Area__c!= :accMetroArea ';
        }
        else if(accState!=null && accMetroArea==null )
        {
            whereCondition = ' AND Contact__r.MailingState != :accState ';
        }
      
        String query = 'SELECT Count() FROM Account_Contact_Relation__c WHERE Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds '+whereCondition;
        return  Database.countQuery(query);
    }
    
    @AuraEnabled
    public static List<DcConsultantContact> getSuggestedDcConsultants(Id recordId, String sortedBy, String sortOrder,List<Id> unAccessibleContactIds,String accMetroArea,String accState)
    {
        String whereCondition = '';
        if(accState!=null && accMetroArea!=null )
        {
            whereCondition = 'AND (Contact__r.Metro_Area__c!= :accMetroArea AND Contact__r.MailingState != :accState) ';
        }
        else if(accState==null && accMetroArea!=null )
        {
            whereCondition = ' AND Contact__r.Metro_Area__c!= :accMetroArea ';
        }
        else if(accState!=null && accMetroArea==null )
        {
            whereCondition = ' AND Contact__r.MailingState != :accState ';
        }
        String query = 'SELECT Id, Account__r.Name, Contact__c, Contact__r.Name,Account__r.MetroArea__c, Contact__r.AccountId,Contact__r.Email, Contact__r.Account.Name, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Phone';
        query += ' FROM Account_Contact_Relation__c WHERE Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds ' + whereCondition;
        query += ' ORDER BY '+sortedBy + ' ' + sortOrder + ' NULLS LAST ' + ' LIMIT 10';
        List<Account_Contact_Relation__c> recordsToReturn = Database.query(query);
        return getCollegeField(recordsToReturn);
    }

    @AuraEnabled
    public static List<DcConsultantContact> getAllSuggestedDcConsultants(Id recordId, String sortedBy, String sortOrder,Integer recordLimit, Integer offset, List<Id> unAccessibleContactIds,String accMetroArea,String accState)
    {
        String whereCondition = '';
        if(accState!=null && accMetroArea!=null )
        {
            whereCondition = 'AND (Contact__r.Metro_Area__c!= :accMetroArea AND Contact__r.MailingState != :accState) ';
        }
        else if(accState==null && accMetroArea!=null )
        {
            whereCondition = ' AND Contact__r.Metro_Area__c!= :accMetroArea ';
        }
        else if(accState!=null && accMetroArea==null )
        {
            whereCondition = ' AND Contact__r.MailingState != :accState ';
        }
        String query = 'SELECT Id, Account__r.Name, Contact__c, Contact__r.Name,Account__r.MetroArea__c, Contact__r.AccountId,Contact__r.Email, Contact__r.Account.Name, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Phone';
        query += ' FROM Account_Contact_Relation__c WHERE Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds ' + whereCondition;
        query += ' ORDER BY '+sortedBy + ' ' + sortOrder + ' NULLS LAST ' + ' LIMIT '+recordLimit + ' OFFSET ' + offset;
        List<Account_Contact_Relation__c> recordsToReturn = Database.query(query);
        return getCollegeField(recordsToReturn);
    }
    
    @AuraEnabled
    public static Account getAccountInfo(Id recordId)
    {
        return [SELECT Id,MetroArea__c,BillingState FROM Account where Id = :recordId LIMIT 1];
    }
    
    @AuraEnabled
    public static List<DcConsultantContact> getRelatedContactsToAccount (Id recordId, String sortedBy, String sortOrder,List<Id> unAccessibleContactIds,String accMetroArea,String accState) {   
        
        String query='';
        String whereCondition = '';
        List<Account_Contact_Relation__c> finalList = new List<Account_Contact_Relation__c>();
        List<Account_Contact_Relation__c> contactListToReturn;
        
        if(sortedBy == 'metro area')
        {
            if(accState!=null && accMetroArea!=null )
            {
                query ='SELECT Id,Account__c,Account__r.Name,Account__r.MetroArea__c, Contact__c,Contact__r.Account_MetroArea_Id__c, Contact__r.Name,Contact__r.Email, Contact__r.AccountId,Contact__r.Account.Name, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Phone FROM Account_Contact_Relation__c'+
                    ' WHERE  Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds AND Contact__r.Metro_Area__c=: accMetroArea ORDER BY Contact__r.Name ASC NULLS LAST ';
                query += 'LIMIT 10';
                contactListToReturn = Database.query(query);
                if(contactListToReturn.size()< 10)
                {
                    integer updateRecordLimit = 10 - contactListToReturn.size();
                    string query2 ='SELECT Id,Account__c,Account__r.Name, Contact__r.Account_MetroArea_Id__c, Account__r.MetroArea__c, Contact__c, Contact__r.Name,Contact__r.Email, Contact__r.AccountId,Contact__r.Account.Name, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Phone FROM Account_Contact_Relation__c'+
                        ' WHERE  Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds AND Contact__r.Metro_Area__c!=: accMetroArea AND Contact__r.MailingState = :accState ORDER BY Contact__r.Name ASC NULLS LAST ';
                    query2 += ' LIMIT ' + updateRecordLimit;
                    List<Account_Contact_Relation__c> contactListToReturn2 = Database.query(query2);
                    finalList.addAll(contactListToReturn);
                    finalList.addAll(contactListToReturn2);
                } 
                else
                {
                    finalList.addAll(contactListToReturn);
                }
            }
            else 
            {
                if(accState!=null && accMetroArea==null )
                {
                    whereCondition = ' AND Contact__r.MailingState = :accState ';
                }
                else if(accState==null && accMetroArea!=null )
                {
                    whereCondition = ' AND Contact__r.Metro_Area__c =: accMetroArea ';
                }
                else {
                    return null;
                }
                string query2 ='SELECT Id,Account__c,Account__r.Name, Contact__r.Account_MetroArea_Id__c, Account__r.MetroArea__c, Contact__c, Contact__r.Name,Contact__r.Email, Contact__r.AccountId,Contact__r.Account.Name, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Phone FROM Account_Contact_Relation__c'+
                ' WHERE  Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds '+ whereCondition +' ORDER BY Contact__r.Name ASC NULLS LAST ';
                query2 += ' LIMIT 10';
                contactListToReturn = Database.query(query2);
                finalList.addAll(contactListToReturn);
            }
        }
        else
        {
            if(accState!=null && accMetroArea!=null )
            {
                whereCondition = ' AND (Contact__r.Metro_Area__c= :accMetroArea OR Contact__r.MailingState = :accState)';
            }
            else if(accState!=null && accMetroArea==null )
            {
                whereCondition = ' AND Contact__r.MailingState = :accState ';
            }
            else if(accState==null && accMetroArea!=null )
            {
                whereCondition = ' AND Contact__r.Metro_Area__c= :accMetroArea ';
            }
            else {
                    return null;
            }
            query = 'SELECT Id, Account__r.Name, Contact__c, Contact__r.Name,Account__r.MetroArea__c, Contact__r.AccountId,Contact__r.Email, Contact__r.Account.Name, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Phone FROM Account_Contact_Relation__c';
            query +=  ' WHERE Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds '+whereCondition;
            query += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS LAST LIMIT 10'; 
            
            finalList = Database.query(query);
        }
        return getCollegeField(finalList);
    }
    
    @AuraEnabled
    public static List<DcConsultantContact> getAllRelatedSortedContactsOfAccount (Id recordId,String sortedBy, String sortOrder,Integer recordLimit, Integer offset, Boolean isDefaultState,List<String> unAccessibleContactIds, String accState) {
        String allContactQuery='';
        String allContactQuery2='';
        String accMetroArea = '';
        String whereCondition = '';
        List<Account_Contact_Relation__c> finalList = new List<Account_Contact_Relation__c>();
        List<Account_Contact_Relation__c> levelOneRecords = new List<Account_Contact_Relation__c> ();
        List<Account_Contact_Relation__c> levelTwoRecords = new List<Account_Contact_Relation__c> ();
        List<Id> contactRelatedAccIds = new List<Id>();

        Account acc = [SELECT Id,MetroArea__c FROM Account where id = :recordId LIMIT 1];
        if(acc.MetroArea__c != null)
        {
            accMetroArea = acc.MetroArea__c;
        }
        if(isDefaultState)
        {
            allContactQuery ='SELECT Id,Account__c,Account__r.Name,Account__r.MetroArea__c, Contact__c,Contact__r.Account_MetroArea_Id__c, Contact__r.Name,Contact__r.Email, Contact__r.AccountId,Contact__r.Account.Name, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Phone FROM Account_Contact_Relation__c'+
                ' WHERE Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds';
                allContactQuery2 ='SELECT Id,Account__c,Account__r.Name,Account__r.MetroArea__c, Contact__c,Contact__r.Account_MetroArea_Id__c, Contact__r.Name,Contact__r.Email, Contact__r.AccountId,Contact__r.Account.Name, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Phone FROM Account_Contact_Relation__c'+
                ' WHERE Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds';
            if(accMetroArea != '' && accState!=null)
            {
                allContactQuery +=' AND Contact__r.Metro_Area__c=: accMetroArea ORDER BY Contact__r.Name ASC NULLS LAST ';
                levelOneRecords = Database.query(allContactQuery);
                allContactQuery2 +=' AND Contact__r.Metro_Area__c!=: accMetroArea AND Contact__r.MailingState = :accState ORDER BY Contact__r.Name ASC NULLS LAST ';
                levelTwoRecords = Database.query(allContactQuery2);
            }
            else if(accMetroArea == '' && accState!=null)
            {
                allContactQuery2 +=' AND Contact__r.MailingState = :accState ORDER BY Contact__r.Name ASC NULLS LAST ';
                levelTwoRecords = Database.query(allContactQuery2);
            }
            else if(accMetroArea != '' && accState==null)
            {
                allContactQuery +=' AND Contact__r.Metro_Area__c=: accMetroArea ORDER BY Contact__r.Name ASC NULLS LAST ';
                levelOneRecords = Database.query(allContactQuery);
            }

            if(levelOneRecords.size() > 0)
            {
                finalList.addAll(levelOneRecords);
            }
            
           finalList.addAll(levelTwoRecords);
        }
        else {
            if(accMetroArea != '' && accState!=null)
            {
                whereCondition = ' AND (Contact__r.Metro_Area__c=: accMetroArea OR Contact__r.MailingState = :accState) ';
            }
            else if(accMetroArea == '' && accState!=null)
            {
                whereCondition = ' AND Contact__r.MailingState = :accState ';
            }
            else if(accMetroArea != '' && accState==null)
            {
                whereCondition = ' AND Contact__r.Metro_Area__c=: accMetroArea ';
            }
            allContactQuery ='SELECT Id,Account__c,Account__r.Name,Account__r.MetroArea__c, Contact__c,Contact__r.Account_MetroArea_Id__c, Contact__r.Name,Contact__r.Email, Contact__r.AccountId,Contact__r.Account.Name, Contact__r.Title, Contact__r.Metro_Area__c, Contact__r.Metro_Area__r.Name, Contact__r.Phone FROM Account_Contact_Relation__c'+
            ' WHERE Account__c = :recordId AND Roles__c = :Role AND Contact__c NOT IN :unAccessibleContactIds '+ whereCondition;
            allContactQuery += ' ORDER BY '+sortedBy+' '+sortOrder+ ' NULLS LAST LIMIT ' + recordLimit + ' OFFSET ' + offset;

            finalList = Database.query(allContactQuery);

        }
        return getCollegeField(finalList);
    } 
    
    @AuraEnabled
    public static List<String> getUnAccessibleContactIds(String recordId)
    {
        List<Id> unAccessibleContactIds = new List<Id>();
        Set<Id> contactIdsToBeChecked = new Set<Id>();
        List<Account_Contact_Relation__c> allAccountContactRelations = [SELECT Id,Contact__c FROM Account_Contact_Relation__c WHERE Account__c = :recordId AND Roles__c = :Role]; 
        List<Account_Contact_Relation__c> relationRecordsToBeReturned = new List<Account_Contact_Relation__c>();
        
        for(Account_Contact_Relation__c acctCnctRel : allAccountContactRelations)
        {
            contactIdsToBeChecked.add(acctCnctRel.Contact__c);
        }
        Map<Id,Contact> accessibleContacts = new Map<Id,Contact>([Select Id from Contact where Id In :contactIdsToBeChecked]);
        for(Account_Contact_Relation__c acctCnctRel : allAccountContactRelations)
        {
            if(accessibleContacts.containsKey(acctCnctRel.Contact__c))
                relationRecordsToBeReturned.add(acctCnctRel);
            else
                unAccessibleContactIds.add(acctCnctRel.Contact__c);
        }
        return unAccessibleContactIds;
    }
    
    public class DcConsultantContact {
        @AuraEnabled public String Id = '';
        
        @AuraEnabled  public String ContactId = '';
        @AuraEnabled  public String ContactName = '';
        @AuraEnabled  public String ContactEmail = '';
        @AuraEnabled  public String AccountName = '';
        @AuraEnabled public String AccountMetroAreaName = '';
        @AuraEnabled  public String ContactAccId = '';
        @AuraEnabled  public String ContactAccName = '';
        
        @AuraEnabled public String ContactTitle = '';
        
        @AuraEnabled public String ContactMetroArea = '';
        @AuraEnabled public String ContactMetroAreaName = '';
        
        @AuraEnabled public String ContactPhone = '';
        
        @AuraEnabled public String ContactEducationCollege = '';
        @AuraEnabled public String ContactEducationCollegeName = '';
        
        
        
        public DcConsultantContact(String Id, String ContactId,String ContactName,String ContactEmail,String AccountName,String AccountMetroAreaName,String ContactAccId,String ContactAccName, String ContactTitle,String ContactMetroArea,String ContactMetroAreaName, String ContactPhone,String ContactEducationCollege, String ContactEducationCollegeName) {
            this.Id = Id;
            this.ContactId = ContactId;
            this.ContactName = ContactName;
            this.ContactEmail = ContactEmail;
            this.AccountName = AccountName; 
            this.AccountMetroAreaName = AccountMetroAreaName;           
            this.ContactAccId = ContactAccId;
            this.ContactAccName = ContactAccName;
            this.ContactTitle = ContactTitle;
            this.ContactMetroArea = ContactMetroArea;
            this.ContactMetroAreaName = ContactMetroAreaName;
            this.ContactPhone = ContactPhone;
            this.ContactEducationCollege = ContactEducationCollege;
            this.ContactEducationCollegeName = ContactEducationCollegeName;
        }
    }
    
}