@isTest
public class RelatedContactsController_Test {
    
	@isTest
    public static void testGetMetroAreaName()
    {
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'Test Metro Area';
        insert metroArea;
        system.assert(RelatedContactsController.getMetroAreaName(metroArea.Id).size() == 1);       
    }
    @isTest 
    public static void testRelatedContactsTestMethods()
    {
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'Test Metro Area';
        insert metroArea;
        
        Account acc = new Account();
        acc.Name = 'test Account';
        acc.MetroArea__c = metroArea.Id;
        insert acc;
        
        Contact conHomeOfficeTestRec = new Contact();
        conHomeOfficeTestRec.LastName = 'test LastName';
        conHomeOfficeTestRec.AccountId = acc.Id;
        insert conHomeOfficeTestRec;
        system.assert(RelatedContactsController.getRelatedContactsToMetroArea(metroArea.Id,true) != null);
        system.assert(RelatedContactsController.getRelatedContactsToMetroArea(metroArea.Id,false) != null);  
        system.assert(RelatedContactsController.getRelatedContactCount(metroArea.Id,true) != null);
        system.assert(RelatedContactsController.getRelatedContactCount(metroArea.Id,false) != null);  
        system.assert(RelatedContactsController.getAllRelatedContactsToMetroArea(metroArea.Id,true,1,0) != null);
        system.assert(RelatedContactsController.getAllRelatedContactsToMetroArea(metroArea.Id,false,1,0) != null);
        system.assertEquals(0, RelatedContactsController.fetchFilterRecordCount(metroArea.Id, true, new List<String> (), new List<String> (), new List<String> ()));
        system.assertEquals(0, RelatedContactsController.getAllRelatedSortedContactsToMetroArea(metroArea.Id,true,1,0,'Name','ASC', new List<String>(), new List<String>(), new List<String>())?.size());
        system.assertEquals(0, RelatedContactsController.getAllRelatedSortedContactsToMetroArea(metroArea.Id,false,1,0,'Name','ASC', new List<String>(), new List<String>(), new List<String>())?.size());     
    }    
}