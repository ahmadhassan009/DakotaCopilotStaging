@isTest 
public class TriggerOnSubMetroAreaService_Test {

    @isTest
    public static void testSetSubMetroAreaName() {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account';
        insert accountRecord;
        
        Account newAccount = new Account();
        newAccount.Name = 'Test Account 2';
        insert newAccount;
        
        Metro_Area__c metroArea = new Metro_Area__c(name='Test MetroArea');
        insert metroArea;
        
        Sub_Metro_Area__c subMetroArea = new Sub_Metro_Area__c(Name='Test Sub MetroArea',Account__c=accountRecord.Id, Metro_Area__c=metroArea.Id);
        insert subMetroArea;
        
        Sub_Metro_Area__c newSubMetroArea = [SELECT Id, Name FROM Sub_Metro_Area__c WHERE Id=:subMetroArea.Id];
        System.assertEquals('Test MetroArea - Test Account',newSubMetroArea.Name);
        
        subMetroArea.Account__c = newAccount.Id;
        update subMetroArea;
        
        newSubMetroArea = [SELECT Id, Name FROM Sub_Metro_Area__c WHERE Id=:subMetroArea.Id];
        System.assertEquals('Test MetroArea - Test Account 2',newSubMetroArea.Name);
    }
    
    @isTest
    public static void testSetSubMetroAreaNameExceedingCharacters() {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account B123456789123456789123456789123456789123456789123456789123456789';
        insert accountRecord;
        
        Metro_Area__c metro = new Metro_Area__c(name='Test MetroArea');
        insert metro;
        
        Sub_Metro_Area__c subMetroArea = new Sub_Metro_Area__c(Name='Test Sub MetroArea',Account__c=accountRecord.Id, Metro_Area__c=metro.Id);
        insert subMetroArea;
        
        Sub_Metro_Area__c newSubMetroArea = [SELECT Id, Name FROM Sub_Metro_Area__c WHERE Id=:subMetroArea.Id];
        System.assertEquals('Test MetroArea - Test Account B1234567891234567891234567891234567891234567891234',newSubMetroArea.Name);
    }

    @isTest
    public static void testPreventDuplicationOfSubMetroAreas() {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account';
        insert accountRecord;
        
        Metro_Area__c metroArea = new Metro_Area__c(name='Test MetroArea');
        insert metroArea;

        Sub_Metro_Area__c subMetroArea = new Sub_Metro_Area__c(Name='Test Sub MetroArea',Account__c=accountRecord.Id, Metro_Area__c=metroArea.Id);
        insert subMetroArea;

        Sub_Metro_Area__c subMetroArea2 = new Sub_Metro_Area__c(Name='Test Sub MetroArea 2',Account__c=accountRecord.Id, Metro_Area__c=metroArea.Id);
        Database.SaveResult result = Database.insert(subMetroArea2, false);
        System.assertEquals('You are creating a duplicate record.',result.getErrors()[0].getMessage());
    }

    public static void testUpdateNumberOfAccountsInMetroArea() {

        Metro_Area__c metroArea = new Metro_Area__c(name = 'Test MetroArea');
        insert metroArea;

        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account';
        accountRecord.MetroArea__c = metroArea.Id;
        accountRecord.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        accountRecord.X100_Marketplace__c = true;
        insert accountRecord;

        Account accountRecord2 = new Account();
        accountRecord2.Name = 'Test Account 2';
        accountRecord2.MetroArea__c = metroArea.Id;
        accountRecord2.RecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();
        accountRecord2.X100_Marketplace__c = true;
        insert accountRecord2;

        Sub_Metro_Area__c subMetroArea = new Sub_Metro_Area__c(
            Name = 'Test Sub MetroArea',
            Account__c = accountRecord2.Id, 
            Metro_Area__c = metroArea.Id);
        insert subMetroArea;

        System.assertEquals(2, metroArea.Sort_Order__c);

        delete subMetroArea;
        System.assertEquals(1, metroArea.Sort_Order__c);
        
    }
}