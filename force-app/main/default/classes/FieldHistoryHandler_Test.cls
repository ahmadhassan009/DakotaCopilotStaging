@isTest
public class FieldHistoryHandler_Test 
{
    @isTest
    public static void testAccountHistoryMethod()
    {
        Account a=new Account(name='testAcc', RecordTypeId=Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId());
        insert a;
        AccountHistory ah=new AccountHistory(AccountId=a.id,Field = 'Website');
        insert ah;
        
        Test.startTest();
        fieldHistoryHandler fh=new fieldHistoryHandler();
        fh.execute(null);
        Test.stopTest();
        
        List<Update__c> updateList = [Select Id from Update__c where Account__c=:a.Id and Field_Name__c='Website'];
        System.assert(updateList.size()==1);
    }
    @isTest
    public static void testContactHistoryMethod()
    {
        Contact con=new Contact(firstname='firstCon',lastname='lastCon', 
                                RecordTypeId=Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId());
        insert con;
        
        ContactHistory ch_test =new ContactHistory(ContactId=con.id,Field = 'Phone');
        insert ch_test;

        Test.startTest();
        fieldHistoryHandler fh=new fieldHistoryHandler();
        fh.execute(null);
        Test.stopTest();
        
        List<Update__c> updateList = [Select Id, Field_Name__c from Update__c where Contact__c=:con.Id and Field_Name__c='Business Phone'];
        System.assert(updateList.size()==1);
    }
}