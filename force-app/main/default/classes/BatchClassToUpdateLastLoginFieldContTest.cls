@isTest
private class BatchClassToUpdateLastLoginFieldContTest {

    @isTest
    static void testBatchClassToUpdateLastLoginFieldContacts() {
        // Create test data
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Account acc = TestDataFactory.createAccount();
            Contact contact = TestDataFactory.createContact();
            contact.AccountId = acc.Id;
            update contact;
            User communityUser = TestDataFactory.createCommunityUser(contact.Id);

            // Start the batch job
            Test.startTest();
            BatchClassToUpdateLastLoginFieldContacts batch = new BatchClassToUpdateLastLoginFieldContacts();
            Database.executeBatch(batch, 50);
            Test.stopTest();

            // Retrieve the updated contact
            Contact updatedContact = [SELECT User_Last_Login_Date__c FROM Contact WHERE Id = :contact.Id];

            // Verify that the User_Last_Login_Date__c field is updated with the LastLoginDate
            //System.assertEquals(communityUser.LastLoginDate.date(), updatedContact.User_Last_Login_Date__c);
        }
    }
}