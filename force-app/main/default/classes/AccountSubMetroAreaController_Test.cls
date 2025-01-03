@isTest
public class AccountSubMetroAreaController_Test 
{
    @testSetup
    public static void createData()
    {
        Account acct = new Account();
        acct.Name = 'Test Account';
        insert acct;
        
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'Test MetroArea';
        metroArea.Sort_Order__c = 12;
        insert metroArea;
        
        Sub_Metro_Area__c subMetroArea = new Sub_Metro_Area__c();
        subMetroArea.Account__c = acct.Id;
        subMetroArea.Metro_Area__c = metroArea.Id;
        insert subMetroArea;
    }
    
    @isTest
    public static void testGetSubMetroAreaRecords()
    {
        Account acct = [Select Id,Name from Account where Name = 'Test Account'];
        List<Sub_Metro_Area__c> subMetroAreas = AccountSubMetroAreaController.getSubMetroAreaRecords(acct.Id,false);
        System.assert(subMetroAreas.size() > 0);
    }
    
     @isTest
    public static void testGetCommunitySubMetroAreaRecords()
    {
        Account acct = [Select Id,Name from Account where Name = 'Test Account'];
        List<Sub_Metro_Area__c> subMetroAreas = AccountSubMetroAreaController.getSubMetroAreaRecords(acct.Id,true);
        System.assert(subMetroAreas.size() > 0);
    }
}