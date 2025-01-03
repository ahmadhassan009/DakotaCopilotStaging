@isTest
public class MetroAreaListViewController_Test {
    
    @testSetup
    public static void createTestData()
    {
        Metro_Area__c ma1 = new Metro_Area__c();
        ma1.Name = 'Test MA1';
        ma1.Country__c = 'United States';
        ma1.State__c = 'New York';
        ma1.Sort_Order__c = 10;
        ma1.Number_of_Contacts__c = 5;
        insert ma1;
        
        Metro_Area__c ma2 = new Metro_Area__c();
        ma2.Name = 'New MA2';
        ma2.Country__c = 'Canada';
        ma2.State__c = 'Ontario';
        ma2.Sort_Order__c = 50;
        ma2.Number_of_Contacts__c = 20;
        insert ma2;
        
        Metro_Area__c ma3 = new Metro_Area__c();
        ma3.Name = 'My MA3';
        ma3.Country__c = 'Italy';
        ma3.State__c = 'nevada';
        ma3.Sort_Order__c = 50;
        ma3.Number_of_Contacts__c = 20;
        insert ma3;
       
        List_view_Preference__c listViewPrefrence1 = new List_view_Preference__c();
        listViewPrefrence1.Name = 'Test List View1';
        listViewPrefrence1.Field_Name__c = 'Name';
        listViewPrefrence1.Operator__c = 'Starts With';
        listViewPrefrence1.Filter__c = 'Test,My';
        insert(listViewPrefrence1);
        
        List_view_Preference__c listViewPrefrence2 = new List_view_Preference__c();
        listViewPrefrence2.Name = 'Test List View2';
        listViewPrefrence2.Field_Name__c = 'Name';
        listViewPrefrence2.Operator__c = 'Not Equals';
        listViewPrefrence2.Filter__c = 'New MA2';
        insert(listViewPrefrence2);
        
        List_view_Preference__c listViewPrefrence3 = new List_view_Preference__c();
        listViewPrefrence3.Name = 'Test List View3';
        listViewPrefrence3.Field_Name__c = 'Name';
        listViewPrefrence3.Operator__c = 'Contains';
        listViewPrefrence3.Filter__c = 'Test';
        insert(listViewPrefrence3);
        
        List_view_Preference__c listViewPrefrence4 = new List_view_Preference__c();
        listViewPrefrence4.Name = 'Test List View4';
        listViewPrefrence4.Field_Name__c = 'Name';
        listViewPrefrence4.Operator__c = 'Does Not Contain';
        listViewPrefrence4.Filter__c = 'Test,My';
        insert(listViewPrefrence4);
        
        Account acc = new Account ();
        acc.MetroArea__c = ma1.id;
        acc.Name = 'Test Account';
        acc.BillingState = 'New York';
        acc.Type = 'MS Team';
        insert acc;
        
        Account acc2 = new Account ();
        acc2.MetroArea__c = ma2.id;
        acc2.Name = 'Test Account 2';
        acc2.BillingState = 'New York';
        acc2.Type = 'MS Team';
        insert acc2;
    }
    
    @isTest
    public static void testGetAllCountriesList()
    {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        List<MetroAreaListViewController.MetroAreaCountriesList> maList = MetroAreaListViewController.getAllCountriesList();
        System.assertEquals(6, maList.size(), 'Countries list not correct'); 
        Test.stopTest();
    }
    
    @isTest
    public static void testGetMetroAreaRecordsCount()
    {
        List<String> searchList = new List<String>();
        System.assertEquals(3, MetroAreaListViewController.getMetroAreaRecordsCount(searchList,false, 'All'), 'Metro Area All record count is not correct');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecordsCount(searchList,false, 'Canada'), 'Metro Area Canada record count is not correct');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecordsCount(searchList,false, 'Canada'), 'Metro Area Canada record count is not correct');
        searchList.add('Ontario');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecordsCount(searchList,false, ''), 'Metro Area record count is not correct');
        searchList.add('ON');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecordsCount(searchList,true, 'Test List View2'), 'Metro Area record count is not correct');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecordsCount(searchList,true, 'Test List View3'), 'Metro Area record count is not correct');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecordsCount(searchList,true, 'Test List View4'), 'Metro Area record count is not correct');
    }
    
    @isTest
    public static void testDeleteListView()
    {
 		List_view_Preference__c listViewPrefrence = new List_view_Preference__c();
        listViewPrefrence.Name = 'Test List View';
        listViewPrefrence.Field_Name__c = 'Name';
        listViewPrefrence.Operator__c = 'Equals';
        listViewPrefrence.Filter__c = 'Test MA1';
        insert(listViewPrefrence);  
        System.assertEquals(true,MetroAreaListViewController.deleteListView('Test List View'));
    }
    
    @isTest
    public static void testGetListViewDetails()
    { 
        List_view_Preference__c listViewPrefrence = MetroAreaListViewController.getListViewDetails('Test List View1');
        System.assertEquals('Test List View1',listViewPrefrence.Name);
    }

    @isTest
    public static void testGetMetroAreaRecords(){
        List<String> searchList = new List<String> ();
        List<Metro_Area__c> metroAreas = [SELECT Id FROM Metro_Area__c];
        List<Id> favList = new List<Id>();
        favList.add(metroAreas[0].Id);
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecords(searchList, 'Canada',false, 'Sort_Order__c', 'desc', 0, 20, favList).size(), 'Filtered metro areas are not correct');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecords(searchList, 'Canada',false, 'Sort_Order__c', 'desc', 0, 20, favList).size(), 'Filtered metro areas are not correct');
        searchList.add('Ontario');
        searchList.add('ON');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecords(searchList, '',false, 'Sort_Order__c', 'desc', 0, 20, favList).size(), 'Filtered metro areas with search string are not correct');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecords(searchList, 'Test List View2',true, 'Sort_Order__c', 'desc', 0, 20, favList).size(), 'Filtered metro areas with search string are not correct1');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecords(searchList, 'Test List View3',true, 'Sort_Order__c', 'desc', 0, 20, favList).size(), 'Filtered metro areas with search string are not correct2');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecords(searchList, 'Test List View1',true, 'Sort_Order__c', 'desc', 0, 20, favList).size(), 'Filtered metro areas with search string are not correct2');
        System.assertEquals(1, MetroAreaListViewController.getMetroAreaRecords(searchList, 'Test List View4',true, 'Sort_Order__c', 'desc', 0, 20, favList).size(), 'Filtered metro areas with search string are not correct3');
    }
    
    @isTest
    public static void testUpsertListView()
    {
        String listViewName = 'New List View';
        String field = 'Name';
        String operator = 'Equals';
        String filteredMetroAreaNames = 'Test MA1,New MA2';
        Test.startTest();
        MetroAreaListViewController.upsertListView('', 'Metro_Area__c', listViewName,field,operator,filteredMetroAreaNames);       
        List<List_view_Preference__c> listViewPrefrence = [SELECT Id, Name FROM List_view_Preference__c WHERE Name = 'New List View' ];
        System.assertEquals(1,listViewPrefrence.size());
        listViewName = 'Updated List View';       
        MetroAreaListViewController.upsertListView(listViewPrefrence[0].Id, 'Metro_Area__c', listViewName,field,operator,filteredMetroAreaNames);
        Test.stopTest();
        List<List_view_Preference__c> updatedViewPrefrence = [SELECT Id, Name FROM List_view_Preference__c WHERE Name = 'Updated List View' ];
        System.assertEquals(1,updatedViewPrefrence.size());
    }
    
    @isTest
    public static void testGetAllListViewNames()
    {
        Test.startTest();
        List<List_view_Preference__c> listViewNames = MetroAreaListViewController.getAllListViewNames();
        Test.stopTest();
        System.assertEquals(4,listViewNames.size());
    }
    
    @isTest
    public static void testIsDuplicateListViewName()
    {
        Test.startTest();
        System.assertEquals(true,MetroAreaListViewController.isDuplicateListViewName('Test List View2',''));
        Test.stopTest();
    }

    @isTest
    public static void testGetCountMetroAreasByState() {
        List<String> searchList = new List<String> ();
        searchList.add('Ontario');
        searchList.add('ne');
        Test.startTest();
        System.assertEquals(3, MetroAreaListViewController.getCountMetroAreasByState(searchList,'All'));
        Test.stopTest();
    }

    @isTest
    public static void testGetAllMetroAreasByState() {
        List<String> searchList = new List<String> ();
        searchList.add('Ontario');
        searchList.add('ne');
        Test.startTest();
        System.assertEquals(1, MetroAreaListViewController.getAllMetroAreasByState(searchList,'United States', 'asc', 0, 20, 'State__c').size());
        System.assertEquals(3, MetroAreaListViewController.getAllMetroAreasByState(searchList,'All', 'asc', 0, 20, 'State__c').size());
        Test.stopTest();
    }
    
    @isTest
    public static void testGetMetroAreasForSingleState() {
        Test.startTest();
        System.assertEquals(1, MetroAreaListViewController.getMetroAreasForSingleState('New York').size());
        Test.stopTest();
    }
    
    @isTest
    public static void testGetRelatedAccountRecords() {
        Test.startTest();
        System.assertEquals(1, MetroAreaListViewController.getRelatedAccountRecords('New York', 'BillingState','asc', 10, 0 ).size());
        Test.stopTest();
    }
    @isTest
    public static void testGetRelatedAccountCount() {
        Test.startTest();
        System.assertEquals(1, MetroAreaListViewController.getRelatedAccountCount('New York'));
        Test.stopTest();
    }
    
    @isTest
    public static void testGetRelatedContactCount() {
        Account acc = [SELECT Id,Name,MetroArea__c from Account where Name = 'Test Account 2' LIMIT 1];
        Contact con = new Contact();
        con.firstName = 'Test';
        con.LastName = 'Contact';
        con.MailingState = 'Ontario';
        con.Metro_Area__c = acc.MetroArea__c;
        con.AccountId= acc.Id;
        insert con;
        Test.startTest();
        System.assertEquals(1, MetroAreaListViewController.getRelatedContactCount('Ontario',true));
        Test.stopTest();
    }
    
    @isTest
    public static void testGetRelatedContactRecords() {
       Account acc = [SELECT Id,Name,MetroArea__c from Account where Name = 'Test Account 2' LIMIT 1];
        Contact con = new Contact();
        con.firstName = 'Test';
        con.LastName = 'Contact';
        con.MailingState = 'Ontario';
        con.Metro_Area__c = acc.MetroArea__c;
        con.AccountId= acc.Id;
        insert con;
        Test.startTest();
        System.assertEquals(1, MetroAreaListViewController.getRelatedContactRecords('Ontario', 'Name','ASC',10, 0,true ).size());
        Test.stopTest();
    }
    
    @isTest
    public static void testGetAccountTypeCount() {
        Test.startTest();
        System.assertEquals(1, MetroAreaListViewController.getAccountTypeCount('New York', 'MS Team','RIA'));
        Test.stopTest();
    }
    @isTest
    public static void testGetAllCountriesListForState() {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        System.assertEquals(6, MetroAreaListViewController.getAllCountriesListForState().size());
        Test.stopTest();
    }
    
    @isTest
    public static void testGetRelatedAccounts() {
        Test.startTest();
        System.assertEquals(1, MetroAreaListViewController.getRelatedAccounts('New York', 'MS Team', 'BillingState', 'asc', 10, 0,'RIA').size());
        Test.stopTest();
    }
    
   @isTest
    public static void testGetRelatedAccountsMetadata() {
        
        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaSectionOne = [SELECT MasterLabel, Account_Type_Values__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c
                                                                                FROM Metro_Area_Custom_Sub_Panel__mdt
                                                                                WHERE Is_Active__c = true AND Is_Enable_for_Everest__c = true AND Section_No__c = '1'
                                                                                ORDER BY MasterLabel ASC];
         List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaSectionTwo = [SELECT MasterLabel, Account_Type_Values__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c  
                                                                        FROM Metro_Area_Custom_Sub_Panel__mdt
                                                                        WHERE Is_Active__c = true AND Is_Enable_for_Everest__c = true AND Section_No__c = '2'
                                                                        ORDER BY MasterLabel ASC];
        Integer totalmetroAreaSubPanelSize = metroAreaSectionOne.size()+metroAreaSectionTwo.size();
        Test.startTest();
        System.assertEquals(totalmetroAreaSubPanelSize, MetroAreaListViewController.getRelatedAccountsMetadata('Ontario').size());
        Test.stopTest();
    }
}