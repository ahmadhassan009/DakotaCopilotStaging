public with sharing class Form5500AdditionalSectionController 
{
    @AuraEnabled
    public static Form_5500_Additional_Information__c getForm5500AdditionalInfoId(String accountId)
    {
        List<Form_5500_Additional_Information__c> form5500Info = [Select Id,Admin_Name__c,Spons_Signed_Name__c,DFE_Signed_Name__c,Admin_Manual_Signed_Name__c,Spons_Manual_Signed_Name__c,DFE_Manual_Signed_Name__c
                                                                 from Form_5500_Additional_Information__c
                                                                  where Account__c = :accountId Limit 1];
        if(form5500Info.size() > 0) {
            return form5500Info[0];
        }
        else {
            return null;
        }
    }
}