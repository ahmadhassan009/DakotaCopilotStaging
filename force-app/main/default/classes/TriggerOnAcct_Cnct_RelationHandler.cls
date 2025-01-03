public class TriggerOnAcct_Cnct_RelationHandler 
{
    List<Account_Contact_Relation__c> acctCnctRelationList;
    Map<Id, Account_Contact_Relation__c> acctCnctRelationMap;
    
    public TriggerOnAcct_Cnct_RelationHandler(List<Account_Contact_Relation__c> acctCnctRelationList, Map<Id, Account_Contact_Relation__c> acctCnctRelationMap)
    {
        this.acctCnctRelationList = acctCnctRelationList;
        this.acctCnctRelationMap = acctCnctRelationMap;
    }
    
    public void beforeInsert()
    {
        TriggerOnAcct_Cnct_RelationService.setAccountContactRelationName(acctCnctRelationList, acctCnctRelationMap);
        TriggerOnAcct_Cnct_RelationService.populateform5500Checkbox(acctCnctRelationList, acctCnctRelationMap);
    }
    
    public void beforeUpdate()
    {
        TriggerOnAcct_Cnct_RelationService.setAccountContactRelationName(acctCnctRelationList, acctCnctRelationMap);
        TriggerOnAcct_Cnct_RelationService.populateform5500Checkbox(acctCnctRelationList, acctCnctRelationMap);
    }
}