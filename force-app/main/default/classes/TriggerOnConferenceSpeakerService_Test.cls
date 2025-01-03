@isTest 
public class TriggerOnConferenceSpeakerService_Test {
    @testSetUp
    public static void createTestData()
    {       
        
        Account acc = TestDataFactory.createAccount();
        Contact cont1 = new Contact(
                Lastname = 'Community User1',
                AccountId = acc.Id
        );
        insert cont1;
      
        Conference__c conf1 = New Conference__c(
                Name = 'Test Conf1'
        );
        insert conf1;
      
        Conference__c conf2 = New Conference__c(
                Name = 'Test Conf2'
        );
        insert conf2;
        
        Conference_Speaker__c cs1 = new Conference_Speaker__c();
        cs1.Name='Conference Speaker Test1';
        cs1.Contact__c=cont1.Id;
        cs1.Conference__c=conf1.Id;  
        insert cs1; 

    }

    @isTest 
    public static void testSetconferenceSpeakerName()
    {
        Test.startTest();
        Conference_Speaker__c cs11 = [Select Id,Name from Conference_Speaker__c limit 1]; 
        Conference__c conf22=[Select Id,Name from Conference__c where Name = 'Test Conf2'];
        cs11.Conference__c=conf22.Id;
        update cs11;
        Conference_Speaker__c cs111 = [Select Id,Name from Conference_Speaker__c limit 1]; 
        System.assertEquals(cs111.Name,'Community User1 - Test Conf2');    
        Test.stopTest();      
        
    }
}