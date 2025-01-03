@IsTest
public class caseApprovalRequestController_Test {
    
    @IsTest
    public static void testGetUserEmail(){
        
        List<User> returnedUser = new List<User>();
        Profile p = [SELECT Id FROM Profile WHERE Name='System Administrator' AND Profile.Name = 'System Administrator']; 
        User u = new User(Alias = 'standt', Email='standarduser1@testorg.com', 
            EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', ProfileId = p.Id, 
            TimeZoneSidKey='America/Los_Angeles', UserName='standarduser1@example.com');
        insert u;
 
       	returnedUser.add(caseApprovalRequestController.getUserEmail(u.Id));
		System.assertEquals(1,returnedUser.size());
    }
    
    @IsTest
    public static void testUpdateCaseApproved(){
        
        List<Case> cs = new List<Case>();
        Id accountRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        Id caseRecordTypeId = Schema.getGlobalDescribe().get('Case').getDescribe().getRecordTypeInfosByDeveloperName().get('Create_Contacts').getRecordTypeId();
        Metro_Area__c metro = new Metro_Area__c(name='Test MetroArea');
        insert metro;
        
        Account acc = new Account();
        acc.Name = 'Test Account';
        acc.RecordTypeId = accountRecordTypeId;
        insert acc;
        
        Case testCase =new Case(Status= 'New', RecordTypeId = caseRecordTypeId, First_Name__c = 'test', Contact_Last_Name__c = 'A9102021', Biography__c = 'Test Description', Mailing_Street__c = 'Test Street', Mailing_City__c = 'Test City', Mailing_State__c = 'Test State', 
                   Mailing_Zip_Postal_Code__c = '450000',  Mailing_Country__c = 'Test Country', Asset_Class_Coverage__c = 'Real Estate', Contact_Type__c = 'CEO', Title__c = 'Test Title', AccountId = acc.Id, Metro_Area__c =metro.Id, Phone__c = '11111111', Email__c = 'example999@email.net');
        
        insert testCase;

        cs.add(caseApprovalRequestController.updateCaseApproved(testCase.Id));
        system.assertEquals(1, cs.size());
    } 
}