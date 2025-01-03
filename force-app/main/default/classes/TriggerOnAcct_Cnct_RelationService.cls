public class TriggerOnAcct_Cnct_RelationService 
{
    public static void setAccountContactRelationName(List<Account_Contact_Relation__c> acctCnctRelationList, Map<Id, Account_Contact_Relation__c> acctCnctRelationMap)
    {
        Set<Id> accountIds = new Set<Id>();
        Set<Id> contactIds = new Set<Id>();
        List<Account_Contact_Relation__c> relationRecordsToBeProcessed = new List<Account_Contact_Relation__c>();
        for(Account_Contact_Relation__c acctCnctRelation : acctCnctRelationList)
        {
            if(Trigger.IsInsert || (acctCnctRelationMap != null 
                                    && (acctCnctRelation.Account__c != acctCnctRelationMap.get(acctCnctRelation.Id).Account__c || 
                                        acctCnctRelation.Contact__c != acctCnctRelationMap.get(acctCnctRelation.Id).Contact__c)))
            {
                relationRecordsToBeProcessed.add(acctCnctRelation);
                accountIds.add(acctCnctRelation.Account__c);
                contactIds.add(acctCnctRelation.Contact__c);
            }
        }
        
        Map<Id,Account> accountMap = new Map<Id,Account>([Select Id,Name from Account where Id In: accountIds]);
        Map<Id,Contact> contactMap = new Map<Id,Contact>([Select Id,Name from Contact where Id In: contactIds]);
        
        for(Account_Contact_Relation__c acctCnctRelation:relationRecordsToBeProcessed)
        {
            acctCnctRelation.Name = accountMap.get(acctCnctRelation.Account__c).Name + ' - '+ contactMap.get(acctCnctRelation.Contact__c).Name;
            if(acctCnctRelation.Name.length()>80) 
            {
                acctCnctRelation.Name = acctCnctRelation.Name.substring(0,80);
            }
        }
    }
    
    public static void populateform5500Checkbox(List<Account_Contact_Relation__c> acctCnctRelationList, Map<Id, Account_Contact_Relation__c> acctCnctRelationMap)
    {
        Set<Id> newsOrUpdatedAcc = new Set<Id>();
        List<Account_Contact_Relation__c> newsOrUpdatedRecords = new List<Account_Contact_Relation__c>();
        for(Account_Contact_Relation__c acctCnctRelation : acctCnctRelationList)
        {
            if((Trigger.isInsert ) || (Trigger.isUpdate && (acctCnctRelation.Account__c != acctCnctRelationMap.get(acctCnctRelation.Id).Account__c )))
            {
                newsOrUpdatedAcc.add(acctCnctRelation.Account__c);
                newsOrUpdatedRecords.add(acctCnctRelation);
            }
        }
        
        if(newsOrUpdatedAcc.size()>0)
        {
            Map<Id, Account> relatedAccList = new Map<Id, Account>([select Id,Name, ACK_ID__c from Account where Id in :newsOrUpdatedAcc]);
            
            for(Account_Contact_Relation__c acctCnctRelation : acctCnctRelationList)
            {
                Account acc = relatedAccList.get(acctCnctRelation.Account__c);
                if(acc.ACK_ID__c !=null && !String.isBlank(acc.ACK_ID__c))
                {
                    acctCnctRelation.Form_5500_Account__c=true;
                }  
                else 
                {
                    acctCnctRelation.Form_5500_Account__c=false;                    
                }       
            }        
        }
    }
}