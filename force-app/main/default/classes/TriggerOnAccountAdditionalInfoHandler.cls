public with sharing class TriggerOnAccountAdditionalInfoHandler 
{
    List<Account_Additional_Information__c> accountAdditionalInformationList;

    public TriggerOnAccountAdditionalInfoHandler(List<Account_Additional_Information__c> accountAdditionalInformationList)
    {
        this.accountAdditionalInformationList = accountAdditionalInformationList;
    }

    public void afterInsert()        
    {
        TriggerOnAccountAdditionalInfoService.shareAccountAdditionalInfoRecordWithOrgUsers(this.accountAdditionalInformationList);
    }
}