public with sharing class AlternativeHoldingsController {
    @AuraEnabled
    public static Investment_Holdings__c getAlternativeHoldingsInfoId(String recordId)
    {
        List<Investment_Holdings__c> alternativeHoldingsInfo = [Select Id, Name, Account__c, Account__r.Name, Fund_Name__c, Date_Acquired__c, Address__c, Initial_Investment__c, NAIC_Company_Number__c, Book_Adjusted_Carrying_Value__c,
                                                                            Investment_Firm__c, Current_Year_s_Depreciation__c, Fund_Balance__c, Commitment_For_Additional_Investment__c, Unrealized_Valuation_Inc_Dec__c, Fair_Val_Hierarchy_Method_For_Fair_Value__c,
                                                                            Investment_Income__c, Percentage_of_Ownership__c, Source_of_Method_to_obtain_Fair_Value__c, Issue_Description__c FROM Investment_Holdings__c
                                                                            WHERE Id = :recordId Limit 1];
        if(alternativeHoldingsInfo.size() > 0) {
            return alternativeHoldingsInfo[0];
        }
        else {
            return null;
        }
    }
}