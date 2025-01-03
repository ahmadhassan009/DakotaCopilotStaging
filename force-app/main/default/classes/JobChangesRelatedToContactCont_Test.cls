@isTest
public class JobChangesRelatedToContactCont_Test {
    
    @isTest
    public static void testUpdatesEvent()
    {
        Id investmentRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        Account acc1 = new Account();
        acc1.Name = 'Test Account 1';
        acc1.RecordTypeId = investmentRecordTypeId;
        acc1.X100_Marketplace__c = true;
        insert acc1;
       
        Account acc2 = new Account();
        acc2.Name = 'Test Account 2';
        acc2.RecordTypeId = investmentRecordTypeId;
        acc2.X100_Marketplace__c = true;
        insert acc2;
        
        Id contactInvestmentRecordTypeId = Schema.getGlobalDescribe().get('Contact').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
        Contact con = new Contact();
        con.LastName = 'Test Contact';
        con.AccountId = acc1.Id;
        con.RecordTypeId = contactInvestmentRecordTypeId;
        insert con;

        con.AccountId = acc2.Id;
        update con;
        System.assert(JobChangesRelatedToContactController.getContactRelatedJobChangesRecords(con.Id) != null);
		System.assertEquals(JobChangesRelatedToContactController.getContactRelatedJobChangesRecordsCount(con.Id), 1);
		System.assert(JobChangesRelatedToContactController.getAllContactRelatedJobChangesRecords(con.Id, 1, 0) != null);
        System.assert(JobChangesRelatedToContactController.getAllRelatedSortedJobChangesRecords(con.Id, 1, 0, 'Name' ,'asc' ) != null );
        
    }
    

}