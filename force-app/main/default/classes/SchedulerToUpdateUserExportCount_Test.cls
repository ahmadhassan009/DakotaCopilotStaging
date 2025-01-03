@isTest
public with sharing class SchedulerToUpdateUserExportCount_Test {

    @testSetup
    public static void setupTestData() 
    {
        // Create test data (User records)
        List<User> testUsers = new List<User>();
        for (Integer i = 0; i < 10; i++) 
        {
            testUsers.add(new User(
                LastName = 'LIVESTON'+i,
                FirstName='JASON',
                Alias = 'jliv'+i,
                Email = 'jason.liveston@asdf.com',
                Username = 'jason@asdf.com'+i,
                ProfileId = '00e1N000001sZXL',
                TimeZoneSidKey = 'GMT',
                LanguageLocaleKey = 'en_US',
                EmailEncodingKey = 'UTF-8',
                LocaleSidKey = 'en_US',
                Allow_Account_and_Contacts_Export__c = true
            ));
        }
        insert testUsers;
    }

    @isTest
    public static void testSchedulerToUpdateUserExportCount() 
    {
        // Start the batch job
        Test.startTest();
        SchedulerToUpdateUserExportRecordCount scheduler = new SchedulerToUpdateUserExportRecordCount();

        // Call the execute method (indirectly) to simulate the scheduled job
        scheduler.execute(null);
        Test.stopTest();

        // Verify that the Export Batch Limit field is updated to 10 for all Users
        List<User> updatedUsers = [SELECT Id, Export_Batch_Limit__c FROM User WHERE Allow_Account_and_Contacts_Export__c = true];
        for (User usr : updatedUsers) 
        {
            System.assertEquals(10, usr.Export_Batch_Limit__c, 'Export Batch Limit is not be updated');
        }
    }
}