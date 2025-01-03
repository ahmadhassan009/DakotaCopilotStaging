@isTest
public class BatchToCreatePlanAdminContacts_Test 
{
    @testSetUp
    public static void createTestData()
    {
        List<Account> accounts = new List<Account>();
        for(Integer i=0;i<50;i++)
        {
            Account acct = new Account();
            acct.Name = 'Test Account ';
            accounts.add(acct);
        }
        insert accounts;
        
        List<Form_5500_Additional_Information__c> form5500AdditionalRecs = new List<Form_5500_Additional_Information__c>();
        for(Integer i=0;i<50;i++)
        {
            Form_5500_Additional_Information__c form5500 = new Form_5500_Additional_Information__c();
            form5500.Account__c = accounts[i].Id;
            if(math.mod(i, 2) == 0)
            {
                if(math.mod(i, 3) == 0)
                {
                    form5500.Admin_Manual_Signed_Name__c = 'AdminSign Contact'+String.valueOf(i-1);
                    form5500.Admin_Name__c = 'Admin Contact'+String.valueOf(i-1);
                    form5500.DFE_Manual_Signed_Name__c = 'DFEManual Contact'+String.valueOf(i-1);
                }
                else
                {
                    form5500.Admin_Manual_Signed_Name__c = 'AdminSign Contact'+i;
                    form5500.Admin_Name__c = 'Admin Contact'+i;
                    form5500.DFE_Manual_Signed_Name__c = 'DFEManual Contact'+i;
                }
            }
            else
            {
                form5500.DFE_Signed_Name__c = 'DFESigned Contact'+i;
                form5500.Spons_Manual_Signed_Name__c = 'SponsManual Contact'+i;
                form5500.Spons_Signed_Name__c = 'SponsSigned Contact'+i;
            }
            form5500AdditionalRecs.add(form5500);
        }
        insert form5500AdditionalRecs;
        for(Form_5500_Additional_Information__c form5500 : form5500AdditionalRecs)
        {
            //System.debug(form5500.Admin_Manual_Signed_Name__c);
            //System.debug(form5500.Admin_Name__c);
            //System.debug(form5500.DFE_Manual_Signed_Name__c);
            //System.debug(form5500.DFE_Signed_Name__c);
            //System.debug(form5500.Spons_Manual_Signed_Name__c);
            //System.debug(form5500.Spons_Signed_Name__c);
        }
    }
    
    private static Contact createContact(String firstName,String lastName)
    {
        Account acct = [Select id from account limit 1];
        Contact cnct = new Contact();
        cnct.LastName = lastName;
        cnct.FirstName = firstName;
        cnct.AccountId = acct.Id;
        return cnct;
    }
    
    @isTest
    public static void BatchToCreatePlanAdminContacts_Job1()
    {
        Test.startTest();
        BatchToCreatePlanAdminContacts createPlanAdminCnct = new BatchToCreatePlanAdminContacts();
        Database.executeBatch(createPlanAdminCnct, 50);
        Test.stopTest();
    }
    
    @isTest
    public static void BatchToCreatePlanAdminContacts_Job2()
    {
        List<Contact> contactsToBeInserted = new List<Contact>();
        contactsToBeInserted.add(createContact('AdminSign','Contact8'));
        contactsToBeInserted.add(createContact('Admin','Contact10'));
        contactsToBeInserted.add(createContact('DFEManual','Contact20'));
        contactsToBeInserted.add(createContact('DFESigned','Contact23'));
        contactsToBeInserted.add(createContact('SponsManual','Contact37'));
        contactsToBeInserted.add(createContact('SponsSigned','Contact45'));
        insert contactsToBeInserted;
        Test.startTest();
        BatchToCreatePlanAdminContacts createPlanAdminCnct = new BatchToCreatePlanAdminContacts();
        Database.executeBatch(createPlanAdminCnct, 50);
        Test.stopTest();
    }
}