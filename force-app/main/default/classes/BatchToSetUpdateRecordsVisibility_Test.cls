@isTest
public class BatchToSetUpdateRecordsVisibility_Test 
{
    @testSetup
    public static void createTestData()
    {
        List<Follow__c> favRecords = new List<Follow__c>();
        for(integer i=0;i<100;i++)
        {
            Follow__c fav = new Follow__c();
        	fav.Object_Name__c = 'Marketplace_Searches__c';
            favRecords.add(fav);
        }        
  
        for(integer i=0;i<50;i++)
        {
            Follow__c fav = new Follow__c();
        	fav.Object_Name__c = 'Account';
            favRecords.add(fav);
        }
        insert favRecords;
    }
    
    @isTest
    public static void BatchToSetUpdateRecordsVisibilityTest()
    {
        Test.startTest();
        BatchToSetUpdateRecordsVisibility btch = new BatchToSetUpdateRecordsVisibility();
        Database.executeBatch(btch);
        Test.stopTest();
        
        List<Follow__c> fav = [SELECT Id, Object_Name__c, Object_Name_In_Community_List_View_URL__c FROM Follow__c WHERE Object_Name_In_Community_List_View_URL__c='marketplace-searches'];
        System.assert(fav.size() == 100);
                
        List<Follow__c> fav2 = [SELECT Id, Object_Name__c, Object_Name_In_Community_List_View_URL__c FROM Follow__c WHERE Object_Name_In_Community_List_View_URL__c='account'];
        System.assert(fav2.size() == 50);
    }
}