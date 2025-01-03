@IsTest
public class NewObjectHomePageController_Test {
    @testSetup
    public static void createTestData()
    {
        
        Id invRecId = Schema.SObjectType.Investment__c.getRecordTypeInfosByDeveloperName().get('Public_Investment').getRecordTypeId();
        Account a1 = new Account(); 
        a1.Name = 'Test 1';
        insert a1;

        Investment__c i1 = new Investment__c();
        i1.Name = 'Test 1';
        i1.recordTypeId =  invRecId;
        insert i1;

        Contact con = new Contact();
        con.firstName = 'Test';
        con.LastName = 'Contact';
        con.MailingState = 'Ontario';
        con.AccountId= a1.Id;
        insert con;

        Investment_Counts__c cs = New Investment_Counts__c();
        cs.Name = 'Investment Record Counts';
        cs.Public_Investment_Count__c = 1;
        cs.X13F_Fillings_Investment_Count__c = 1;
        insert cs;

        Form_D_Offering__c formD = new Form_D_Offering__c(
            Entity_Type__c = 'Limited Partnership',
            Act_of_1940__c = true,
            Name_Issuer__c ='test',
            Account__c = a1.Id,
            Filed_At__c = Datetime.valueOf('2024-01-01 12:00:00.0000+00:00'),
            Marketplace_verified__c=true
        );
        insert formD;
    }

    @isTest
    public static void testGetNewRecord() {
        Test.startTest();
        System.assertEquals(1, NewObjectHomePageController.getNewInvestmentsRecord(0,'asc','FIRST','CreatedDate',10,'Public_Investment').size());
        System.assertEquals(1, NewObjectHomePageController.getNewAccountRecord(0,'asc','FIRST','CreatedDate',10).size());
        System.assertEquals(1, NewObjectHomePageController.getNewContactRecord(0,'asc','FIRST','CreatedDate',10).size());
        // System.assertEquals(1, NewObjectHomePageController.getNewFormdRecord(0,'asc','FIRST','CreatedDate',10).size());
        Test.stopTest();
    }

    @isTest
    public static void testGeRecordCount() {
        Test.startTest();
        System.assertEquals(1, NewObjectHomePageController.getNewInvestmentsCount('Public_Investment'));
        System.assertEquals(1, NewObjectHomePageController.getNewInvestmentsCount('X13F_Filings'));
        System.assertEquals(1, NewObjectHomePageController.getNewAccountCount());
        System.assertEquals(1, NewObjectHomePageController.getNewContactCount());
        // System.assertEquals(1, NewObjectHomePageController.getNewFormdCount());
        Test.stopTest();
    }

}