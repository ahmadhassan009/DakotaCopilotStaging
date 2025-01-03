@IsTest
public class CreateContactNotificationEmail_Test {
    
    @IsTest
    public static void testSendContactCreateNotificationEmail(){
        
        Id accountRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        Id caseRecordTypeId = Schema.getGlobalDescribe().get('Case').getDescribe().getRecordTypeInfosByDeveloperName().get('Create_Contacts').getRecordTypeId();
        Id contactRecordTypeId = Schema.getGlobalDescribe().get('Contact').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
        
        //Create Account
        Account portalAccount1 = new Account(
            Name = 'TestAccount',
            recordtypeId = accountRecordTypeId
        );
        
        //Create Case
        List<Case> caseList =new List<Case>();
        Case case1 = new Case(
            recordtypeId = caseRecordTypeId,
            Contact_Last_Name__c = 'test Contact',
            AccountId = portalAccount1.Id,
            phone__c = '21321321',
            Mailing_Street__c = 'test st',
            Mailing_Zip_Postal_Code__c = 'test ps',
            Mailing_City__c = 'test city',
            Mailing_State__c = 'test state',
            Mailing_Country__c = 'test country'
        );
        
        caseList.Add(case1); 
        insert(caseList);
        
        //Create contact
        List<Contact> contactList =new List<Contact>();
        Contact contact1 = new Contact(
            FirstName = 'Test',
            Lastname = 'McTesty',
            AccountId = portalAccount1.Id,
            recordtypeId = contactRecordTypeId,
            Ref_Case_ID__c = case1.Id
        );
        
        contactList.add(contact1);
        insert(contactList);
        
        Test.startTest();
        CreateContactNotificationEmail.sendContactCreateNotificationEmail(contactList);
        Integer invocations = Limits.getEmailInvocations();
        Test.stopTest();
            
        System.assertEquals(1,invocations,'sendContactCreateNotificationEmail method is not working properly');
    }
}