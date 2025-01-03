@isTest
public class RelatedContactofAccountController_Test {
    
    @isTest
	public static void testGetAccountName()
    {
        Account acc = new Account();
        acc.Name = 'Test Account';
        insert acc;
        System.assert(RelatedContactofAccountController.getAccountName(acc.Id).size() == 1);       
    }
    
    @isTest 
    public static void testRelatedContactsTestMethods()
    {
        Account acc = new Account();
        acc.Name = 'Test Account 1';
        insert acc;
        
        Account account = new Account();
        account.Name = 'Test Account';
        insert account;
        
        Contact con = new Contact();
        con.LastName = 'test LastName 1';
        con.AccountId = account.Id;
        insert con;
        
        AccountContactRelation accConRelation = new AccountContactRelation();
        accConRelation.ContactId = con.Id;
        accConRelation.AccountId = acc.Id;
        accConRelation.Roles = 'Business User';
        insert accConRelation;
      
        System.assert(RelatedContactofAccountController.getRelatedContactsToAccount(acc.Id, 'Contact.Name', 'asc',false) != null);
        System.assert(RelatedContactofAccountController.getRelatedContactCount(acc.Id,false) != null);
        System.assert(RelatedContactofAccountController.getAllRelatedSortedContactsofAccount(acc.Id,1,0,'Contact.Name','ASC',false) != null);
        System.assert(RelatedContactofAccountController.isForm5500Record(acc.Id) == false);
    }
}