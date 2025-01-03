@isTest
public class RelatedDcConsultantContOfAccControl_Test {
    
    @isTest 
    public static void testRelatedContactsTestMethods()
    {
        Metro_Area__c metroArea = new Metro_Area__c();
        metroArea.Name = 'Test Metro Area';
        insert metroArea;
        
        Account acc = new Account();
        acc.Name = 'Test Account 1';
        acc.MetroArea__c = metroArea.Id;
        insert acc;
        
        Account account = new Account();
        account.Name = 'Test Account';
        insert account;
        
        Contact con = new Contact();
        con.LastName = 'test LastName 1';
        con.AccountId = account.Id;
        con.Metro_Area__c = metroArea.Id;
        insert con;
        
        Account_Contact_Relation__c accConRelation = new Account_Contact_Relation__c();
        accConRelation.Contact__c = con.Id;
        accConRelation.Account__c = acc.Id;
        accConRelation.Roles__c = 'DC Consultant';
        insert accConRelation;

        University_Alumni__c uni = new University_Alumni__c();
        uni.Name = 'Test uni alumni';
        insert uni;

        Education__c education = new Education__c();
        education.University_Alumni__c = uni.Id;
        education.Contact__c = con.Id;
        education.Degree_Distinction__c='Undergraduate';
        insert education;
        
        List<String> conIds = new List<String>();
        
        System.assert(RelatedDcConsultantContOfAccController.getUnAccessibleContactIds(acc.Id).size() == 0);
        System.assert(RelatedDcConsultantContOfAccController.getAccountInfo(acc.Id)!= null);

        System.assert(RelatedDcConsultantContOfAccController.getRelatedContactsToAccount(acc.Id, 'metro area', 'asc',conIds,metroArea.Id,'') != null);
        System.assert(RelatedDcConsultantContOfAccController.getRelatedContactsToAccount(acc.Id, 'Contact__r.Name', 'asc',conIds,metroArea.Id,'') != null);
        System.assert(RelatedDcConsultantContOfAccController.getSuggestedDcConsultants(acc.Id, 'Contact__r.Name', 'asc',conIds,metroArea.Id,'') != null);
        System.assert(RelatedDcConsultantContOfAccController.getAllSuggestedDcConsultants(acc.Id, 'Contact__r.Name', 'asc',0,1,conIds,metroArea.Id,'') != null);
        System.assert(RelatedDcConsultantContOfAccController.getCountOfLevelOneAndTwoRecords(acc.Id,metroArea.Id,'',conIds) != null);        
        System.assert(RelatedDcConsultantContOfAccController.getCountOfSuggestedConsultants(acc.Id,metroArea.Id,'',conIds) != null);        
        System.assert(RelatedDcConsultantContOfAccController.getAllRelatedSortedContactsofAccount(acc.Id,'Contact__r.Name','ASC',1,0,false,conIds,'') != null);
        System.assert(RelatedDcConsultantContOfAccController.getAllRelatedSortedContactsofAccount(acc.Id,'Contact__r.Name','ASC',1,0,true,conIds,'') != null);

    }
}