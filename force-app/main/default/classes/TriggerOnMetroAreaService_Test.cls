@isTest
public class TriggerOnMetroAreaService_Test {
    @isTest
    public static void testUpdateRelatedContactAndAccounts()
    {
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'test mt';
        insert metroArea;

        Account acc = new Account();
        acc.Name = 'Test Account';
        acc.MetroArea__c = metroArea.Id;
        insert acc; 

        Contact conn = new Contact();
        conn.LastName = 'Test Contact';
        conn.Metro_Area__c = metroArea.Id;
        insert conn;

        Test.startTest();
        metroArea.Name = 'updated name';
        update metroArea;
        Test.stopTest();
        
        conn = [SELECT Id, Updated__c FROM Contact WHERE LastName = 'Test Contact' Limit 1];
        System.assertEquals(true, conn.Updated__c);
        
        acc = [Select Id,Updated__c from Account where Name = 'Test Account' Limit 1];        
        System.assertEquals(true, acc.Updated__c);   
    }
}