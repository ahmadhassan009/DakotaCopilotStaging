@IsTest
public class DakotaContentMetroAreaRelatedList_Test {
    
    @TestSetup
    public static void createTestData()
    {
		Metro_Area__c ma1 = new Metro_Area__c();
        ma1.Name = 'Test MetroArea';
        ma1.Country__c = 'United States';
        ma1.State__c = 'New York';
        ma1.Sort_Order__c = 10;
        ma1.Number_of_Contacts__c = 5;
        insert ma1;
        
        Account acc = new Account ();
        acc.MetroArea__c = ma1.id;
        acc.Name = 'Test Account';
        acc.BillingState = 'Ontario';
        acc.Type = 'MS Team';
		acc.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        insert acc; 

        Dakota_Content__c dc = new Dakota_Content__c();
        dc.Name = 'Test Dakota Content';
        dc.Metro_Area_Linked__c = ma1.Id;
        dc.Type__c = 'Metro Area Roadmap';
        insert dc;
    }
    
    @IsTest
    public static void testGetMetroAreaName()
    {
        Metro_Area__c metro = [Select Id, Name from Metro_Area__c where Name = 'Test MetroArea' Limit 1];
        System.assertEquals(DakotaContentMetroAreaRelatedList.getMetroAreaName(metro.Id),'Test MetroArea');       
    }
    
    @IsTest
    public static void testGetMetroAreaStateRelatedDakotaContentRecords()
    {
        System.assertEquals(1,DakotaContentMetroAreaRelatedList.getMetroAreaStateRelatedDakotaContentRecords('New York','Name','ASC',10,0,'FIRST').size());       
    }
    
     @IsTest
    public static void testGetMetroAreaStateRelatedDakotaContentCount()
    {
        System.assertEquals(1,DakotaContentMetroAreaRelatedList.getMetroAreaStateRelatedDakotaContentCount('New York'));       
    }
    
    @IsTest 
    public static void testRelatedDakotaContentControllerTestMethods()
    {
        Metro_Area__c metro = [Select Id, Name from Metro_Area__c where Name = 'Test MetroArea' Limit 1];

        Dakota_Content__c[] DContent = new List<Dakota_Content__c>();
        for(Integer i=0; i<5 ;i++) {
            Dakota_Content__c a = new Dakota_Content__c();
            a.Name = 'Dakota Content for Test Class : '+i;
            a.Metro_Area_Linked__c = metro.Id;
            a.Type__c = 'Metro Area Roadmap';
            DContent.add(a);
        }

        List<Dakota_Content__c> DakotaContentToUpdate;
        List<Metro_Area__c> DakotaContentRecordsInsertList = new List<Metro_Area__c>();
        
        insert DContent;   
        
        DakotaContentToUpdate = 
            [SELECT Id, Name FROM Dakota_Content__c];
        system.debug(DakotaContentToUpdate.size());

        Integer counter = 0;
          for(Dakota_Content__c accObj : DakotaContentToUpdate) {
            accObj.Name = 'Updated Dakota Content for Test Class :' + counter;
            counter++;
        }
        update DakotaContentToUpdate;

        System.assertEquals(6,DakotaContentMetroAreaRelatedList.getMetroAreaRelatedDakotaContentCount(metro.Id));
        System.assert(DakotaContentMetroAreaRelatedList.getMetroAreaRelatedDakotaContentRecords(metro.Id, 10, 0) != null);

    }

}