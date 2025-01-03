public with sharing class RelatedAccountsController {
    public static String sortField;
    public static String sortFieldOrder;

    public class AccountWrapper implements Comparable {
        
        @AuraEnabled public ID Id { get; set; }
        @AuraEnabled public String Name { get; set; }
        @AuraEnabled public Decimal AUM { get; set; }
        @AuraEnabled public String BillingCity { get; set; }
        @AuraEnabled public String Form5500 { get; set; }
        @AuraEnabled public String contactName { get; set; }
        @AuraEnabled public String contactPhone { get; set; }
        
        public Integer compareTo(Object compareTo) {
            AccountWrapper compareToAcc = (AccountWrapper)compareTo;
            Integer returnValue = 0;          

            if(sortField=='ContactName')
            {
                if(sortFieldOrder=='desc')
                {
                    if ((contactName == null) && (compareToAcc.contactName == null)) {
                        returnValue = 0;
                    } else if ((contactName == null) && (compareToAcc.contactName != null)){
                        returnValue = 1;
                    } else if ((contactName != null) && (compareToAcc.contactName == null)){
                        returnValue = -1;
                    }else if (contactName > compareToAcc.contactName) {
                        returnValue = -1;
                    } else if (contactName < compareToAcc.contactName) {
                        returnValue = 1;
                    }                     
                }
                else 
                {
                    if ((contactName == null) && (compareToAcc.contactName == null)) {
                        returnValue = 0;
                    } else if ((contactName == null) && (compareToAcc.contactName != null)){
                        returnValue = 1;
                    } else if ((contactName != null) && (compareToAcc.contactName == null)){
                        returnValue = -1;
                    }else if (contactName > compareToAcc.contactName) {
                        returnValue = 1;
                    } else if (contactName < compareToAcc.contactName) {
                        returnValue = -1;
                    }
                }
                
            }
            else if(sortField=='ContactPhone')
            {
                if(sortFieldOrder=='desc')
                {
                    if ((contactPhone == null) && (compareToAcc.contactPhone == null)) {
                        returnValue = 0;
                    } else if ((contactPhone == null) && (compareToAcc.contactPhone != null)){
                        returnValue = 1;
                    } else if ((contactPhone != null) && (compareToAcc.contactPhone == null)){
                        returnValue = -1;
                    }else if (contactPhone > compareToAcc.contactPhone) {
                        returnValue = -1;
                    } else if (contactPhone < compareToAcc.contactPhone) {
                        returnValue = 1;
                    }                     
                }
                else 
                {
                    if ((contactPhone == null) && (compareToAcc.contactPhone == null)) {
                        returnValue = 0;
                    } else if ((contactPhone == null) && (compareToAcc.contactPhone != null)){
                        returnValue = 1;
                    } else if ((contactPhone != null) && (compareToAcc.contactPhone == null)){
                        returnValue = -1;
                    }else if (contactPhone > compareToAcc.contactPhone) {
                        returnValue = 1;
                    } else if (contactPhone < compareToAcc.contactPhone) {
                        returnValue = -1;
                    }                     
                }
                
            }
            return returnValue;
        }
    }
    
    public static Set<Id> getAccIDsRelatedToSubMetroAreas (Id recordId)
    {
        Set<Id> accIDsRelatedToSubMetroAreas = new Set<Id>();
        for(Sub_Metro_Area__c sub : [Select id,Account__c from Sub_Metro_Area__c where Metro_Area__c =: recordId])
        {
            accIDsRelatedToSubMetroAreas.add(sub.Account__c);
        }
        return accIDsRelatedToSubMetroAreas;
    }
    
    @AuraEnabled
    public static string getSFBaseUrl(){
        String sfdcBaseURL = URL.getSalesforceBaseUrl().toExternalForm();
        return sfdcBaseURL;
    }
    @AuraEnabled
    public static List<Account> getRelatedAccounts(Id recordId, String accountType, String subAccountType) {
        String primaryWhereCondition;
        String investmentFocus;
        List<String> accountTypes;
        String query;
        if(accountType.startsWith('InvestmentFocus-'))
        {
            investmentFocus = accountType.substringAfter('InvestmentFocus-');                      
            accountTypes = investmentFocus.split(',');
            primaryWhereCondition = ' Investment_Focus_single__c =: accountTypes ';    
            query = 'SELECT Id, Name,parent.name,Investment_Focus_single__c, AUM__c, Website, BillingCity, Description, toLabel(Draft_Sales_Cycle__c) FROM Account WHERE'+primaryWhereCondition+'AND MetroArea__c =: recordId ORDER BY AUM__c DESC NULLS LAST LIMIT 10 OFFSET 0';         
        }
        else
        {
            accountTypes = accountType.split(',');
            List<String> subAccountTypes = (String.isBlank(subAccountType))? new List<String>() :subAccountType.split(',');
            primaryWhereCondition = createPrimaryWhereCondition(accountTypes, subAccountTypes);
            Set<Id> accIDsRelatedToSubMetroAreas =  getAccIDsRelatedToSubMetroAreas (recordId);
            if(accountType == 'DC Plan' || accountType == 'Corporate Pension Plan' || accountType == 'Taft-Hartley Plan (ERISA)' ) {
                query = 'SELECT Id, Name, AUM__c, BillingCity, Form_5500__c, (SELECT Plan_Administrator_Contact_Name__c, Spons_DFE_Phone_Num__c FROM Form_5500_Additional_Information__r LIMIT 1) FROM Account WHERE( '+primaryWhereCondition+') AND (MetroArea__c =: recordId OR Id IN : accIDsRelatedToSubMetroAreas) ORDER BY AUM__c DESC NULLS LAST LIMIT 10 OFFSET 0'; 
            } else {
                query = 'SELECT Id, Name, parent.name,Investment_Focus_single__c, AUM__c, Website, BillingCity, Description, toLabel(Draft_Sales_Cycle__c) FROM Account WHERE ('+primaryWhereCondition+') AND (MetroArea__c =: recordId OR Id IN : accIDsRelatedToSubMetroAreas) ORDER BY AUM__c DESC NULLS LAST LIMIT 10 OFFSET 0'; 
            }
        }
        List<Account> listToReturn = Database.query(query);
        return listToReturn;
    }
    @AuraEnabled(cacheable=true)
    public static List<Account>  getAllRelatedSortedAccounts(Id recordId, String accountType, Integer recordLimit, Integer offset, String sortBy, String sortOrder,String subAccountType) {
        String primaryWhereCondition;
        String investmentFocus;
        List<String> accountTypes;
        String query;
        if(accountType.startsWith('InvestmentFocus-'))
        {
            investmentFocus = accountType.substringAfter('InvestmentFocus-');                      
            accountTypes = investmentFocus.split(',');
            primaryWhereCondition = ' Investment_Focus_single__c =: accountTypes '; 
            query='SELECT Id, Name,parent.name,Investment_Focus_single__c, AUM__c, Website,BillingLatitude, BillingLongitude, BillingCity, Description, toLabel(Draft_Sales_Cycle__c)  FROM Account WHERE'+primaryWhereCondition+'AND MetroArea__c = :recordId Order BY '+sortBy+' '+sortOrder+' NULLS LAST LIMIT :recordLimit offset '+offset;      
        }
        else
        {
            accountTypes = accountType.split(',');
            List<String> subAccountTypes = (String.isBlank(subAccountType))? new List<String>() :subAccountType.split(',');
            primaryWhereCondition = createPrimaryWhereCondition(accountTypes, subAccountTypes);
            Set<Id> accIDsRelatedToSubMetroAreas =  getAccIDsRelatedToSubMetroAreas (recordId);
            if(accountType == 'DC Plan' || accountType == 'Corporate Pension Plan' || accountType == 'Taft-Hartley Plan (ERISA)') 
            {
                query='SELECT Id, Name, AUM__c, BillingCity, Form_5500__c, (SELECT Plan_Administrator_Contact_Name__c, Spons_DFE_Phone_Num__c FROM Form_5500_Additional_Information__r LIMIT 1) FROM Account WHERE ('+primaryWhereCondition+') AND (MetroArea__c =: recordId OR Id IN : accIDsRelatedToSubMetroAreas)  Order BY '+sortBy+' '+sortOrder+' NULLS LAST LIMIT :recordLimit offset '+offset;                     
            } 
            else
            {
                query='SELECT Id, Name, parent.name,Investment_Focus_single__c, AUM__c, Website,BillingLatitude, BillingLongitude, BillingCity, Description, toLabel(Draft_Sales_Cycle__c)  FROM Account WHERE ('+primaryWhereCondition+') AND (MetroArea__c =: recordId OR Id IN : accIDsRelatedToSubMetroAreas)  Order BY '+sortBy+' '+sortOrder+' NULLS LAST LIMIT :recordLimit offset '+offset; 
            }
        }

        List<Account> listToReturn = Database.query(query);
        return listToReturn;
    }

    @AuraEnabled(cacheable=true)
    public static List<AccountWrapper>  getSortedAccByNameOrPhone(Id recordId, String accountType, Integer recordLimit, Integer offset, String sortBy, String sortOrder, String subAccountType) 
    {
        offset=0;
        String primaryWhereCondition;
        String investmentFocus;
        String query;
        List<String> accountTypes = accountType.split(',');
        List<String> subAccountTypes = (String.isBlank(subAccountType))? new List<String>() :subAccountType.split(',');
        primaryWhereCondition = createPrimaryWhereCondition(accountTypes, subAccountTypes);
        Set<Id> accIDsRelatedToSubMetroAreas =  getAccIDsRelatedToSubMetroAreas (recordId);
        query='SELECT Id, Name, AUM__c, BillingCity, Form_5500__c, (SELECT Plan_Administrator_Contact_Name__c, Spons_DFE_Phone_Num__c FROM Form_5500_Additional_Information__r LIMIT 1) FROM Account WHERE ('+primaryWhereCondition+') AND (MetroArea__c =: recordId OR Id IN : accIDsRelatedToSubMetroAreas)';        
        List<Account> listOfAcc = Database.query(query);

        List<AccountWrapper> listToReturn = new List<AccountWrapper>();
        List<AccountWrapper> listToReturnChunk = new List<AccountWrapper>();
        for(Account acc : listOfAcc) 
        {
            AccountWrapper accWrap=new AccountWrapper();
            accWrap.Id = acc.Id;
            accWrap.Name = acc.Name;
            accWrap.AUM = acc.AUM__c;
            accWrap.BillingCity = acc.BillingCity;
            accWrap.Form5500 = acc.Form_5500__c;
            if(acc.Form_5500_Additional_Information__r.size()>0)
            {
                accWrap.contactName = acc.Form_5500_Additional_Information__r[0].Plan_Administrator_Contact_Name__c;
                accWrap.contactPhone = acc.Form_5500_Additional_Information__r[0].Spons_DFE_Phone_Num__c;
            }            
            listToReturn.add(accWrap);
        }

        sortField=sortBy;
        sortFieldOrder=sortOrder;
        listToReturn.sort();
        for (Integer i = 0; i < recordLimit; i++) 
        {
            if(i<listToReturn.size())
            {
                listToReturnChunk.add(listToReturn[i]);
            }
        }
        return listToReturnChunk;
    }
    
    @AuraEnabled
    public static List<Account> getAllRelatedAccounts(Id recordId, String accountType, Integer recordLimit, Integer offset,String subAccountType) {
        String primaryWhereCondition;
        String investmentFocus;
        List<String> accountTypes; 
        String query;
        if(accountType.startsWith('InvestmentFocus-'))
        {
            investmentFocus = accountType.substringAfter('InvestmentFocus-');                      
            accountTypes = investmentFocus.split(',');
            primaryWhereCondition = ' Investment_Focus_single__c =: accountTypes ';   
            query = ' SELECT Id, Name, Investment_Focus_single__c, Parent.name, AUM__c, Website, BillingCity, Description, BillingLatitude, BillingLongitude, toLabel(Draft_Sales_Cycle__c) FROM Account WHERE'+primaryWhereCondition+'AND MetroArea__c =: recordId Order By AUM__c DESC NULLS LAST Limit :recordLimit offset :offset';        
        }
        else
        {
            accountTypes = accountType.split(',');
            List<String> subAccountTypes = (String.isBlank(subAccountType))? new List<String>() :subAccountType.split(',');
            primaryWhereCondition = createPrimaryWhereCondition(accountTypes, subAccountTypes);
            Set<Id> accIDsRelatedToSubMetroAreas =  getAccIDsRelatedToSubMetroAreas (recordId);
            if(accountType == 'DC Plan' || accountType == 'Corporate Pension Plan' || accountType == 'Taft-Hartley Plan (ERISA)') {
                query = 'SELECT Id, Name, AUM__c, BillingCity, Form_5500__c, (SELECT Plan_Administrator_Contact_Name__c, Spons_DFE_Phone_Num__c FROM Form_5500_Additional_Information__r LIMIT 1) FROM Account WHERE ('+ primaryWhereCondition+') AND (MetroArea__c =: recordId OR Id IN : accIDsRelatedToSubMetroAreas) Order By AUM__c DESC NULLS LAST Limit :recordLimit offset :offset';
            } else {
                query = 'SELECT Id, Name, Investment_Focus_single__c, Parent.name, AUM__c, Website, BillingCity, Description, BillingLatitude, BillingLongitude, toLabel(Draft_Sales_Cycle__c) FROM Account WHERE ('+ primaryWhereCondition+') AND (MetroArea__c =: recordId OR Id IN : accIDsRelatedToSubMetroAreas) Order By AUM__c DESC NULLS LAST Limit :recordLimit offset :offset';
            }
        }

        List<Account> listToReturn = Database.query(query);
        return listToReturn;
    }
    @AuraEnabled
    public static Integer getAccountTypeCount(Id recordId, String accountType,String subAccountType) {
        String primaryWhereCondition;
        String investmentFocus;
        List<String> accountTypes;
        String query ='';
        if(accountType.startsWith('InvestmentFocus-'))
        {
            investmentFocus = accountType.substringAfter('InvestmentFocus-');                      
            accountTypes = investmentFocus.split(',');
            primaryWhereCondition = ' Investment_Focus_single__c =: accountTypes ';  
            query = 'SELECT COUNT() FROM Account WHERE'+primaryWhereCondition+'AND MetroArea__c = :recordId';     
        }
        else
        {
            accountTypes = accountType.split(',');
            List<String> subAccountTypes = (String.isBlank(subAccountType))? new List<String>() :subAccountType.split(',');
            primaryWhereCondition = createPrimaryWhereCondition(accountTypes, subAccountTypes);
            Set<Id> accIDsRelatedToSubMetroAreas =  getAccIDsRelatedToSubMetroAreas (recordId);
            query = 'SELECT COUNT() FROM Account WHERE ('+primaryWhereCondition+') AND (MetroArea__c = :recordId OR Id IN : accIDsRelatedToSubMetroAreas)'; 
        }

        Integer count = Database.countQuery(query);
        return count;       
    }
    @AuraEnabled(cacheable=true)
     public static List<Metro_Area__c> getMetroAreaName(Id recordId) {
        List<Metro_Area__c> MAlist = [SELECT Name FROM Metro_Area__c WHERE Id =: recordId ORDER BY Name];
        if(MAlist.size() != 0)
            return MAlist;
        else {
            return null;
        }
    }
    @AuraEnabled
    public static Metro_Area__c getMetroAreaNameObj(Id recordId) {
        return [
            SELECT Name
            FROM Metro_Area__c
            WHERE Id =: recordId
            ORDER BY Name
        ];
    }

    private static String createPrimaryWhereCondition(List<String> accountTypes, List<String> subAccountTypes) {
        String primaryWhereCondition = ' Type =: accountTypes ';
        if(subAccountTypes.size()>0 && accountTypes.size()>0) {
            primaryWhereCondition = ' Type =: accountTypes OR Sub_Type__c=:subAccountTypes ';
        }
        else if(subAccountTypes.size()>0 && accountTypes.size()==0) {
            primaryWhereCondition = ' Sub_Type__c=:subAccountTypes ';
        }
        else if(subAccountTypes.size()==0 && accountTypes.size()>0) {
            primaryWhereCondition = ' Type =: accountTypes ';
        }
        return primaryWhereCondition;
    }
}