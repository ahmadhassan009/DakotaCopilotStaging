public class TriggerOnAccountAdditionalInfoService 
{
    /**
    * DSC-694: Function to handle after Account Additional Information record insert logic to manually share the inserted record with community user of same role(account)
    */
    public static void shareAccountAdditionalInfoRecordWithOrgUsers(List<Account_Additional_Information__c> accountAdditionalInformationList)
    {
        //getting the user public group based on user role
        List<Group> groupList = [SELECT Id,Name,DeveloperName,RelatedId,Type FROM Group 
                                 WHERE RelatedId IN  
                                 (SELECT UserRoleId FROM User WHERE Id = :UserInfo.getUserId())  
                                 AND Type = 'Role'];
        if(groupList.size() > 0)
        {
            List<Account_Additional_Information__Share> accountAdditionalInfoShareRecords = new List<Account_Additional_Information__Share>();
            for (Account_Additional_Information__c accAdditionalInfo : accountAdditionalInformationList) 
            {
                Account_Additional_Information__Share accAdditionalInfoShr  = new Account_Additional_Information__Share();
                accAdditionalInfoShr.ParentId = accAdditionalInfo.Id;
                accAdditionalInfoShr.UserOrGroupId = groupList[0].Id;
                accAdditionalInfoShr.AccessLevel = 'Read';
                accAdditionalInfoShr.RowCause = Schema.Account_Additional_Information__Share.RowCause.Manual;
                accountAdditionalInfoShareRecords.add(accAdditionalInfoShr);
            }
            if(accountAdditionalInfoShareRecords.size() > 0)
            {
                Database.insert(accountAdditionalInfoShareRecords,false);
            }
        }
    }
}