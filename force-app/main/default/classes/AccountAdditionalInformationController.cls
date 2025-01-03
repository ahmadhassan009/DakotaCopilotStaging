public without sharing class AccountAdditionalInformationController {
    
    /**
* Get record Id of Account Additional Information and checks Permission for currently logged In User
*/
    @AuraEnabled
    public static String getOrganizationId()
    {     
        List<User> users = [SELECT Id, ContactId,Contact.AccountId
                            FROM User 
                            WHERE Id=:UserInfo.getUserId()  
                            AND IsPortalEnabled=true
                            AND ContactId!=null
                            AND Contact.AccountId!=null];
        if(users!=null && users.size()>0)
        {
            return users[0].Contact.AccountId;
        }
        return null;
    }
    
    /**
* Return options of Sales Cycle field of Account Additional Information.
*/
    @AuraEnabled
    public static List<String> getPickListValues()
    {  
        String orgId = getOrganizationId();
        if(!String.isBlank(orgId))
        {
            List<Sales_Cycle_Options__c> salesCycleRecsList = [SELECT Id, Organization_ID__c, Sales_Cycle_Additional_Values__c 
                                                               FROM Sales_Cycle_Options__c 
                                                               WHERE Organization_ID__c=:orgId];  
            
            if(salesCycleRecsList!=null && salesCycleRecsList.size()>0)
            {
                return salesCycleRecsList[0].Sales_Cycle_Additional_Values__c.split('\n');
            }
            else 
            {
                List<String> pickListValuesList= new List<String>();
                Schema.DescribeFieldResult fieldResult = Sales_Cycle_Options__c.Product_Sales_cycle__c.getDescribe();
                if(fieldResult!=null)
                {
                    List<Schema.PicklistEntry> salesCycleOptions = fieldResult.getPicklistValues();
                    if(salesCycleOptions!=null && salesCycleOptions.size()>0)
                    {
                        for( Schema.PicklistEntry pickListVal : salesCycleOptions)
                        {
                            pickListValuesList.add(pickListVal.getLabel());
                        } 
                        return pickListValuesList;
                    }
                }
            }
        }  
        return null;  
    }
    
    /**
* Get record Id of Account Additional Information and returns details
*/
    @AuraEnabled
    public static Account_Additional_Information__c getAccAddInfo(Id recordId)
    {    
        String orgId = getOrganizationId();
        if(!String.isBlank(orgId))
        {
            List<Account_Additional_Information__c> additionalInfoList = [SELECT Selected_Sales_Cycle__c, Contact__c, Contact__r.Name,Organization_ID__c 
                                                                          FROM Account_Additional_Information__c 
                                                                          WHERE Account__c=:recordId AND Organization_ID__c=:orgId]; 
            if(additionalInfoList!=null && additionalInfoList.size()>0)
            {
                return additionalInfoList[0];  
            }  
        }
        return null;
    }
    
    /**
* Get record Id, Sales Cycle and Account Owner of Account Additional Information.
* Saves in existing record if exist other insert as new record.
*/
    @AuraEnabled
    public static String saveData(Id recordId, String salesCycleValue, String accOwner)
    {   
        try
        {
            List<User> users = [Select Id, isActive, ContactId FROM User 
                                WHERE ContactId=:accOwner AND isActive=true ];
            if(users!=null && users.size()>0)
            {
                String orgId = getOrganizationId();
                if(!String.isBlank(orgId))
                {
                    List<Account_Additional_Information__c> additionalInfoList = [SELECT Id,Account__c, Selected_Sales_Cycle__c, Contact__c, Organization_ID__c  
                                                                                  FROM Account_Additional_Information__c WHERE Account__c=:recordId AND Organization_ID__c=:orgId];  
                    List<Sales_Cycle_Options__c> salesCycleRecsList = [SELECT Id, Sales_Cycle_Additional_Values__c 
                                                                       FROM Sales_Cycle_Options__c WHERE Organization_ID__c=:orgId];  
                    if(additionalInfoList!=null && additionalInfoList.size()>0)
                    {
                        if(String.isBlank(salesCycleValue) || salesCycleRecsList==null || salesCycleRecsList.size()<=0 || (salesCycleRecsList!=null && salesCycleRecsList.size()>0 && salesCycleRecsList[0].Sales_Cycle_Additional_Values__c!=null && salesCycleRecsList[0].Sales_Cycle_Additional_Values__c.split('\n').contains(salesCycleValue)))
                        {
                            additionalInfoList[0].Selected_Sales_Cycle__c = salesCycleValue;
                            additionalInfoList[0].Contact__c = accOwner;
                            update additionalInfoList[0];
                            return 'true';
                        }
                        else
                            return salesCycleValue+' is already updated or removed from Product Sales Cycle. Please refresh the page.';
                    }
                    Account_Additional_Information__c additionalInfo = new Account_Additional_Information__c(
                        Selected_Sales_Cycle__c = salesCycleValue,
                        Account__c = recordId,
                        Contact__c = accOwner,
                        Organization_ID__c = orgId
                    );
                    insert additionalInfo;
                    return 'true';   
                }
            }
            else {
                return 'The selected user against Account Owner does not exist now. Please refresh page to fetch updated data.';
            }
        }
        catch(Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }    
        return null;            
    }
    
    /**
* Get Sales Cycle options of Account Additional Information.
* Saves in existing record if exist other insert as new record.
*/
    @AuraEnabled
    public static String addRemoveSalesCycles(String salesCycleOptions)
    {   
        try
        {
            String orgId = getOrganizationId();
            if(!String.isBlank(orgId))
            {
                //getting pick list values for respective org 
                List<Sales_Cycle_Options__c> salesCycleRecsList = [SELECT Id, Organization_ID__c, Sales_Cycle_Additional_Values__c
                                                                   FROM Sales_Cycle_Options__c WHERE Organization_ID__c=:orgId];  
                
                if(salesCycleRecsList!=null && salesCycleRecsList.size()>0)
                {
                    List<String> updatedOptions = salesCycleOptions.split('\n');
                    Set<String> updatedOptionsSet = new Set<String>(updatedOptions);
                    
                    List<String> prevOptions = salesCycleRecsList[0].Sales_Cycle_Additional_Values__c.split('\n');
                    
                    //Removing same values form prev options list
                    Integer i = 0;
                    while (i < prevOptions.size()){
                        if(updatedOptionsSet.contains(prevOptions[i].trim())){
                            prevOptions.remove(i);
                        } else {
                            i++;
                        }
                    }
                    
                    //checking to see if any of the remaining values in the prev op list is selected in any account
                    List<Account_Additional_Information__c> selectedSalesCycleOptions = [SELECT Selected_Sales_Cycle__c, Account__c
                                                                                         FROM Account_Additional_Information__c 
                                                                                         WHERE Organization_ID__c=:salesCycleRecsList[0].Organization_ID__c AND Selected_Sales_Cycle__c IN: prevOptions
                                                                                        ];
                    if(selectedSalesCycleOptions.size() > 0 ) {
                        return 'Value(s) you are trying to update, are already selected in Account(s).';
                    } else {
                        salesCycleRecsList[0].Sales_Cycle_Additional_Values__c = salesCycleOptions;
                        update salesCycleRecsList;
                        return 'true'; 
                    }
                }
                else 
                {
                    Sales_Cycle_Options__c additionalInfoOptions = new Sales_Cycle_Options__c(
                        Sales_Cycle_Additional_Values__c = salesCycleOptions,
                        Organization_ID__c = orgId
                    );
                    insert additionalInfoOptions;
                    return 'true';  
                }
            }
            else {
                return 'Error occured while fetching the organization of the user'; 
            }
        }
        catch(Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }                
    }
    
    /**
* Fetchs all active users of provided orgnatization(Account) Id
*/
    @AuraEnabled
    public static List<Contact> fetchAccountOwners()
    {
        String orgId = getOrganizationId();
        if(!String.isBlank(orgId))
        {
            List<User> users = [Select Id, isActive, ContactId FROM User 
                                WHERE ContactId!=null AND isActive=true ];
            if(users!=null && users.size()>0)
            {
                List<Id> contactIds = new List<Id>();
                for(User user: users)
                {
                    contactIds.add(user.ContactId);
                }
                if(contactIds!=null && contactIds.size()>0)
                {
                    List<Contact> contactList = [SELECT Id, Name FROM Contact 
                                                 WHERE Id IN: contactIds AND AccountId =:orgId];
                    if(contactList!=null && contactList.size()>0)
                        return contactList;
                }
            }
        }
        return null;
    }
    
}