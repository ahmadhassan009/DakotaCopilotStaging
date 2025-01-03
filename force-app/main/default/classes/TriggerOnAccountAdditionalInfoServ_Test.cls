@isTest
public class TriggerOnAccountAdditionalInfoServ_Test 
{
    @isTest
    public static void testManualShareRead()
    {
        Account acc = TestDataFactory.createAccount();
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Contact contact = TestDataFactory.createContact();
            
            Test.startTest();
            User communityUser = TestDataFactory.createCommunityUser(contact.Id);
            communityUser.IsPortalEnabled = true;
            update communityUser;
            
            System.RunAs(communityUser) 
            {
                Account_Additional_Information__c additionalInfo = new Account_Additional_Information__c();
                additionalInfo.Selected_Sales_Cycle__c = 'Test Client';
                additionalInfo.OwnerId = communityUser.Id;
                insert additionalInfo;
                
                List<Account_Additional_Information__Share> accountAdditionalInfoShareRecords = [Select Id,UserOrGroupId from Account_Additional_Information__Share
                                                                                         where ParentId = :additionalInfo.Id];
                System.debug(accountAdditionalInfoShareRecords);
                System.assert(accountAdditionalInfoShareRecords.size() > 1);
            }
            Test.stopTest();
        }
    }  
}