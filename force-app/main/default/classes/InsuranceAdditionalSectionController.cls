public with sharing class InsuranceAdditionalSectionController {
    @AuraEnabled
    public static Insurance_Additional_Information__c getInsuranceAdditionalInfoId(String accountId)
    {
        List<Insurance_Additional_Information__c> insuranceAdditionalInfo = [Select Id, AMB_Financial_Group_Name__c, AMB_Number__c, Account__c ,
                                                                             Country_of_Domicile__c, Data_Quarter__c, Data_Year__c,Employers_ID_Number__c,
                                                                             NAIC_Company_Code__c,NAIC_Group_Code_Current_Period__c, NAIC_Group_Code_Prior_Period__c,
                                                                             State_of_Domicile_Or_Port_of_Entry__c, Total_Net_Admitted_Assets__c
                                                                             FROM Insurance_Additional_Information__c
                                                                             WHERE Account__c = :accountId Limit 1];
        if(insuranceAdditionalInfo.size() > 0) {
            return insuranceAdditionalInfo[0];
        }
        else {
            return null;
        }
    }
}