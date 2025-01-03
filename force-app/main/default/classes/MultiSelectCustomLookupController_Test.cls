@IsTest
public class MultiSelectCustomLookupController_Test {
    
    @TestSetup
    public static void createTestData()
    {
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            Account acc = TestDataFactory.createAccount();
            Contact contact = TestDataFactory.createContact();
            
            Test.startTest();
            User communityUser = TestDataFactory.createCommunityUser(contact.Id);
            communityUser.IsPortalEnabled = true;
            update communityUser;
            
            System.RunAs(communityUser) 
            {
                Id taskRecordTypeId = Schema.getGlobalDescribe().get('Task').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
                Id eventRecordTypeId = Schema.getGlobalDescribe().get('Event').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Event').getRecordTypeId();

                Task newTask = TestDataFactory.createTask(communityUser.Id, acc.Id, taskRecordTypeId);
                
                TaskRelation tskr = TestDataFactory.createTaskRelation(newTask.Id, contact.Id);
                
                Event newEvent = TestDataFactory.createEvent(communityUser.Id, acc.Id,eventRecordTypeId);
                
                EventRelation evtr = TestDataFactory.createEventRelation(newEvent.Id, contact.Id);
            }
            Test.stopTest();
        }
        
    }
    
    @IsTest
    public static void testFetchContacts()
    {
        List<String> selectedRecId = new List<String>();
        selectedRecId.add([SELECT Id FROM Contact LIMIT 1].Id);
        System.assert(MultiSelectCustomLookupController.fetchContacts('Test',selectedRecId)!=null);
    }

}