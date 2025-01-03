@isTest
public class Form5500AdditionalSectionController_Test 
{
    @testSetup
    public static void createTestData()
    {
        Account acc=TestDataFactory.createAccount();
        Account otherAcc=TestDataFactory.createDynamicAccount('Test Acc 2');
        TestDataFactory.createForm5500AdditionalInformationRecord(acc.Id);
    }

    @isTest
    public static void testGetForm5500AdditionalInfoId()
    {
        Account acc=[select Id FROM Account WHERE Name = 'Test Acc'];
        Form_5500_Additional_Information__c returnedResult = Form5500AdditionalSectionController.getForm5500AdditionalInfoId(acc.Id);
        boolean flag;
        if(returnedResult!=null)
        {
            flag=true;
        }
        else {
            flag=false;
        }
        System.assertEquals(true,flag);
    }

    @isTest
    public static void testWithOtherAccGetForm5500AdditionalInfoId()
    {
        Account otherAcc=[select Id FROM Account WHERE Name = 'Test Acc 2'];
        Form_5500_Additional_Information__c returnedResult = Form5500AdditionalSectionController.getForm5500AdditionalInfoId(otherAcc.Id);
        boolean flag;
        if(returnedResult!=null)
        {
            flag=true;
        }
        else {
            flag=false;
        }
        System.assertEquals(false,flag);
    }
}