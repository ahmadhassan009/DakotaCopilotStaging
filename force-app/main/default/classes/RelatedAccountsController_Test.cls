@isTest
public class RelatedAccountsController_Test {
    @TestSetup
    public static void createTestData()
    {
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'Test Metro Area';
        insert metroArea;
        
        Account acc = new Account();
        acc.Name = 'test Account';
        acc.Type = 'Bank';
        acc.MetroArea__c = metroArea.Id;
        insert acc;

        Account acctest = new Account();
        acctest.Name = 'test Account2';
        acctest.Type = 'DC Plan';
        acctest.MetroArea__c = metroArea.Id;
        insert acctest;

        Form_5500_Additional_Information__c form1=new Form_5500_Additional_Information__c(Ack_Id__c='77',Account__c=acctest.Id,Spons_Signed_Name__c='test77',Spons_DFE_Phone_Num__c='123');
        insert form1;
        
        Account acctestt = new Account();
        acctestt.Name = 'test Account3';
        acctestt.Type = 'DC Plan';
        acctestt.MetroArea__c = metroArea.Id;
        insert acctestt;

        Form_5500_Additional_Information__c form2=new Form_5500_Additional_Information__c(Ack_Id__c='76',Account__c=acctestt.Id,Spons_Signed_Name__c='test76',Spons_DFE_Phone_Num__c='1234');
        insert form2;

        TestDataFactory.createForm5500AdditionalInformationRecord(acctest.id);

        
        Sub_Metro_Area__c sma = new Sub_Metro_Area__c(Account__c=acc.Id,Metro_Area__c=metroArea.Id);
        insert sma;    
    }

    @isTest
    public static void testRelatedAccountsTestMethods()
    {
        Metro_Area__c metroArea=[select id,name from Metro_Area__c where name='Test Metro Area'];        
        Form_5500_Additional_Information__c form1=[select id,Ack_Id__c,Account__c,Spons_Signed_Name__c,Spons_DFE_Phone_Num__c from Form_5500_Additional_Information__c where Ack_Id__c='76'];
        Form_5500_Additional_Information__c form2=[select id,Ack_Id__c,Account__c,Spons_Signed_Name__c,Spons_DFE_Phone_Num__c from Form_5500_Additional_Information__c where Ack_Id__c='77'];
              
        system.assert(RelatedAccountsController.getMetroAreaName(metroArea.Id) != null);
        system.assert(RelatedAccountsController.getSFBaseUrl() != null);
        system.assert(RelatedAccountsController.getAccountTypeCount(metroArea.Id,'Bank','RIA') != null);
        system.assert(RelatedAccountsController.getRelatedAccounts(metroArea.Id,'Bank','RIA') != null);
        system.assert(RelatedAccountsController.getAllRelatedAccounts(metroArea.Id,'Bank',1,0,'RIA') != null);
        system.assert(RelatedAccountsController.getAllRelatedSortedAccounts(metroArea.Id,'Bank',1,0,'Name','ASC','RIA') != null);

        Metro_Area__c metro2 = RelatedAccountsController.getMetroAreaNameObj(metroArea.Id);
        system.assertEquals('Test Metro Area',metro2.Name);
    }

    @isTest
    public static void testMethodSort0()
    {
        Metro_Area__c metroArea=[select id,name from Metro_Area__c where name='Test Metro Area'];   
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','DESC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','DESC','RIA').size()>0);     
        
    }

    @isTest
    public static void testMethodSort1()
    {
        Metro_Area__c metroArea=[select id,name from Metro_Area__c where name='Test Metro Area'];        
        Form_5500_Additional_Information__c form1=[select id,Ack_Id__c,Account__c,Spons_Signed_Name__c,Spons_DFE_Phone_Num__c from Form_5500_Additional_Information__c where Ack_Id__c='76'];
        form1.Spons_DFE_Phone_Num__c='';
        update form1;
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','DESC','RIA').size()>0);

        form1.Spons_Signed_Name__c='';
        update form1;
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','DESC','RIA').size()>0);
    }

    @isTest
    public static void testMethodSort2()
    {
        Metro_Area__c metroArea=[select id,name from Metro_Area__c where name='Test Metro Area'];        
        Form_5500_Additional_Information__c form1=[select id,Ack_Id__c,Account__c,Spons_Signed_Name__c,Spons_DFE_Phone_Num__c from Form_5500_Additional_Information__c where Ack_Id__c='76'];
        Form_5500_Additional_Information__c form2=[select id,Ack_Id__c,Account__c,Spons_Signed_Name__c,Spons_DFE_Phone_Num__c from Form_5500_Additional_Information__c where Ack_Id__c='77'];
        
        form1.Spons_DFE_Phone_Num__c='123';
        update form1;
        form2.Spons_DFE_Phone_Num__c='';
        update form2;
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','DESC','RIA').size()>0);

        form1.Spons_Signed_Name__c='123';
        update form1;
        form2.Spons_Signed_Name__c='';
        update form2;
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','DESC','RIA').size()>0);
    }

    @isTest
    public static void testMethodSort3()
    {
        Metro_Area__c metroArea=[select id,name from Metro_Area__c where name='Test Metro Area'];        
        Form_5500_Additional_Information__c form2=[select id,Ack_Id__c,Account__c,Spons_Signed_Name__c,Spons_DFE_Phone_Num__c from Form_5500_Additional_Information__c where Ack_Id__c='77'];
        form2.Spons_DFE_Phone_Num__c='12';
        update form2;
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','DESC','RIA').size()>0);

        form2.Spons_Signed_Name__c='12';
        update form2;
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','DESC','RIA').size()>0);
    }

    @isTest
    public static void testMethodSort4()
    {
        Metro_Area__c metroArea=[select id,name from Metro_Area__c where name='Test Metro Area'];        
        Form_5500_Additional_Information__c form1=[select id,Ack_Id__c,Account__c,Spons_Signed_Name__c,Spons_DFE_Phone_Num__c from Form_5500_Additional_Information__c where Ack_Id__c='76'];
        Form_5500_Additional_Information__c form2=[select id,Ack_Id__c,Account__c,Spons_Signed_Name__c,Spons_DFE_Phone_Num__c from Form_5500_Additional_Information__c where Ack_Id__c='77'];
        
        form1.Spons_DFE_Phone_Num__c='';
        update form1;
        form2.Spons_DFE_Phone_Num__c='';
        update form2;
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactPhone','DESC','RIA').size()>0);

        form1.Spons_Signed_Name__c='';
        update form1;
        form2.Spons_Signed_Name__c='';
        update form2;
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','ASC','RIA').size()>0);
        system.assert(RelatedAccountsController.getSortedAccByNameOrPhone(metroArea.Id,'DC Plan',2,0,'ContactName','DESC','RIA').size()>0);

    }
}