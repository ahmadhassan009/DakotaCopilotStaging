@isTest
public class ExportRecordsMainController_Test 
{
    @testSetup
    public static void createTestData() 
    {
        TestDataFactory.createMetroArea();
        System.runAs(new User(Id = UserInfo.getUserId())) {
            Contact contact = TestDataFactory.createCommunityUserContact();
            User testUser = TestDataFactory.createCommunityUser(contact.Id);
        }

        List<Account> accounts = new List<Account>();
        for(integer i=0;i<100;i++)
        {
            Account acct = new Account();
            if(math.mod(i, 2) == 0) 
            {
                acct.Name = 'Test Account '+i;
                acct.AUM__c = 5000;
                acct.Website = 'www.google.com';
                acct.Type = 'Bank';
                acct.Asset_Classes__c ='Equities';
                if(i == 20) {
                    acct.Active_Draft_Trial__c = true;
                }
            }
            else
            {
                acct.Name = 'Account '+i;
                acct.AUM__c = 7000;
                acct.Website = 'www.test.com';
                acct.Type = 'RIA';
            }
            accounts.add(acct);
        }
        insert accounts;
    }
    
    @isTest
    public static void testIsTrialUser()
    {
        System.assertEquals(true,ExportRecordsMainController.isTrialUser());
    }
    
    @isTest
    public static void testGetInitialExportCount() {
        System.assertEquals(0,ExportRecordsMainController.getInitialExportCount());
    }

    @isTest
    public static void testUpdateExportCount() {
        System.assertEquals(0,ExportRecordsMainController.updateExportCount(40));
    }

    @isTest
    public static void testFetchSObjectFields()
    {
        System.assert(ExportRecordsMainController.fetchSObjectFields('Account').size()>0);
    }
    
    @isTest
    public static void testGetOperators()
    {
        System.assert(ExportRecordsMainController.getOperators('String').size()>0);
    }
    
    @isTest
    public static void testFetchPaginatedRecords()
    {
        List<String> fieldsToBeDisplayed = new List<String>{'Name','AUM__c,Website,Type'};
        ExportRecordsMainController.SObjectData returnedData = ExportRecordsMainController.fetchPaginatedRecords('Account',fieldsToBeDisplayed,false,false,null,null,null,'[]','');
        System.assert(returnedData.count>0);
        System.assert(returnedData.records.size()>0);

        String filter = '[{"field":"Name","label":"Account Name","operator":"contains","value":"Test","type":"string"}]';
        ExportRecordsMainController.SObjectData returnedData2 = ExportRecordsMainController.fetchPaginatedRecords('Account',fieldsToBeDisplayed,false,false,null,null,null,filter,'');
        System.assert(returnedData2.count > 50);
        System.assert(returnedData2.records.size() > 50);

        filter = '[{"field":"AUM__c","label":"AUM","operator":"greater than","value":"6000","type":"number"}]';
        returnedData = ExportRecordsMainController.fetchPaginatedRecords('Account', fieldsToBeDisplayed,false,false,null,null,null,filter,'');
        
        System.assert(returnedData.count == 50);
        System.assert(returnedData.records.size() == 50);

        filter = '[{"field":"Type","label":"Account Type","operator":"equals","value":"Bank","type":"picklist"}]';
        returnedData = ExportRecordsMainController.fetchPaginatedRecords('Account',fieldsToBeDisplayed,false,false,null,null,null,filter,'');
        
        System.assert(returnedData.count > 0 );
        System.assert(returnedData.records.size() > 0);

        filter = '[{"field":"Type","label":"Account Type","operator":"contains","value":"RIA","type":"picklist"}]';
        returnedData = ExportRecordsMainController.fetchPaginatedRecords('Account',fieldsToBeDisplayed,false,false,null,null,null,filter,'');
        
        System.assert(returnedData.count == 50);
        System.assert(returnedData.records.size() == 50);

        filter = '[{"field":"AUM__c","label":"AUM","operator":"less than","value":"5000","type":"number"}]';
        returnedData = ExportRecordsMainController.fetchPaginatedRecords('Account', fieldsToBeDisplayed,false,false,null,null,null,filter,'');
        
        System.assert(returnedData.count == 0);
        System.assert(returnedData.records.size() == 0);

        filter = '[{"field":"AUM__c","label":"AUM","operator":"greater or equal","value":"5000","type":"number"}]';
        returnedData =  ExportRecordsMainController.fetchPaginatedRecords('Account',fieldsToBeDisplayed,false,false,null,null,null,filter,'');
        
        System.assert(returnedData.count > 0);
        System.assert(returnedData.records.size() > 0);

        filter = '[{"field":"AUM__c","label":"AUM","operator":"greater than","value":"7000","type":"number"},{"field":"AUM__c","label":"AUM","operator":"less than","value":"9000","type":"number"}]';
        returnedData = ExportRecordsMainController.fetchPaginatedRecords('Account', fieldsToBeDisplayed,false,false,null,null,null,filter,'1 OR 2');
        
        System.assert(returnedData.count >0 );
        System.assert(returnedData.records.size() > 0);
        filter = '[{"field":"Asset_Classes__c","label":"Asset Classes","operator":"includes","value":"Equities;Real Assets","type":"multipicklist","index":1700820170026,"objectName":"Account","filterNumber":1,"multiPicklistList":"Equities;Real Assets","multiPicklistobj":[{"label":"Equities","value":"Equities","fieldType":"String","selected":true},{"label":"Real Assets","value":"Real Assets","fieldType":"String","selected":true}]}]';
        returnedData = ExportRecordsMainController.fetchPaginatedRecords('Account', fieldsToBeDisplayed,false,false,null,null,null,filter,'');
        
        System.assert(returnedData.count >0 );
        System.assert(returnedData.records.size() > 0);

    }

    @isTest
    public static void testGetPicklistValues()
    {
        List<string> fieldApiNames=new List<string>{'Asset_Classes__c'};
        System.assert(ExportRecordsMainController.getPicklistValues('account',fieldApiNames)!=null);
    }

    @isTest
    public static void testGetMetroAreaNames()
    {
        System.assert(ExportRecordsMainController.getMetroAreaNames()!=null);
    }
    
}