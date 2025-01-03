@isTest
public with sharing class BatchToUpdateUsersExportRecordCount_Test {

    @testSetup
    public static void setupTestData() 
    {
        System.runAs(new User(Id = UserInfo.getUserId())) {
            Contact contact = TestDataFactory.createCommunityUserContact();
            User testUser = TestDataFactory.createCommunityUser(contact.Id);
            
            testUser.Allow_Account_and_Contacts_Export__c = true;
            testUser.Last_Export_Reset_Date__c = Date.today().addDays(30);
            update testUser;
        }
    }

    @isTest
    static void testBatchToUpdateUsersExportRecordCount() 
    {     
        // Start the batch job
        Test.startTest();
        BatchToUpdateUsersExportRecordsCount batchInstance = new BatchToUpdateUsersExportRecordsCount();
        Database.executeBatch(batchInstance);
        Test.stopTest();
        
        // Verify that the Export Batch Limit field is updated to 10 for all Users
        List<User> updatedUsers = [SELECT Id, Export_Batch_Limit__c FROM User WHERE Allow_Account_and_Contacts_Export__c = true And UserName='communityuser@testorg.com'];
        for (User usr : updatedUsers) 
        {
            System.assertEquals(10, usr.Export_Batch_Limit__c, 'Export Batch Limit is not be updated');
        }
    }
}