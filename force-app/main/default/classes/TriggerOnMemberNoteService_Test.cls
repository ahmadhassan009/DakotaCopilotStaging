@isTest
public class TriggerOnMemberNoteService_Test {
    
    @isTest
    public static void testSendCommentsNotificationEmail()
    {    
        List<Member_Comments__c> memberNotes = new List<Member_Comments__c>();
        Id accountRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        Id investmentContactRecordType = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
       
        Account acc = new Account();
        acc.Name = 'Test Account';
        acc.RecordTypeId = accountRecordTypeId;
        insert acc;
        
        Contact con = new Contact();
        con.LastName = 'Test Contact';
        con.AccountId = acc.Id;
        con.RecordTypeId = investmentContactRecordType;
        insert con;
           
        Member_Comments__c testNote1 =new Member_Comments__c(Account__c = acc.Id, Comment_Details__c = 'Test note text1');
        Member_Comments__c testNote2 =new Member_Comments__c(Contact__c = con.Id, Comment_Details__c = 'Test note text2');
        memberNotes.add(testNote1);
        memberNotes.add(testNote2);
        
        Test.startTest();
        insert memberNotes;
        
        delete testNote1;
        
        Integer invocations = Limits.getEmailInvocations();

		System.assertEquals(2, invocations,'sendCommentsNotificationEmail method is not working properly');
        Test.stopTest();
        
    }
}