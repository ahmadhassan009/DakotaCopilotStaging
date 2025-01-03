@isTest
public class MemberNotesController_Test { 
    
    @testSetup
    public static void createTestDate()
    {
        Account acc = new Account();
        acc.Name = 'test acc';
        insert acc;
        
        Contact con = new Contact();
        con.LastName = 'test con';
        insert con;
    } 
    
    @isTest
    public static void testGetSFBaseUrl()
    {
        System.assertEquals(URL.getSalesforceBaseUrl().toExternalForm(), MemberNotesController.getSFBaseUrl());
    }
    
    @isTest
    public static void testGetMemberComments()
    {
        Account acc = [Select Id FROM Account Limit 1];
        Member_Comments__c comment = new Member_Comments__c();
        comment.Comment_Details__c = 'Test Comment';
        comment.Account__c = acc.Id;
        insert comment;
        
        List<MemberNotesController.MemberCommentsHelper> comments = MemberNotesController.getMemberComments ('Account', acc.Id,5);
        System.assertEquals(1, comments.size());
    }
    
    @isTest
    public static void testGetRecordName()
    {
        Account acc = [Select Id FROM Account Limit 1];
        Contact con = [Select Id FROM Contact Limit 1];
        List<MemberNotesController.MemberCommentsHelper> accComments = MemberNotesController.getRecordName ('Account', acc.Id);
        List<MemberNotesController.MemberCommentsHelper> conComments = MemberNotesController.getRecordName ('Contact', con.Id);
        System.assertEquals(1, accComments.size());
        System.assertEquals(1, conComments.size());
    }
    
    @isTest
    public static void testSaveMembercomment()
    {
        Account acc = [Select Id FROM Account Limit 1];
        List<MemberNotesController.MemberCommentsHelper> comments = MemberNotesController.saveMemberComment('Account', acc.Id, 'test comm2',5);
        System.assertEquals(1, comments.size());
    }
    
    @isTest
    public static void testUpdateMembercomment()
    {
        Account acc = [Select Id FROM Account Limit 1];
        Member_Comments__c comment = new Member_Comments__c();
        comment.Comment_Details__c = 'Test Comment';
        comment.Account__c = acc.Id;
        insert comment;
	        
        List<MemberNotesController.MemberCommentsHelper> comments = MemberNotesController.updateMemberComment ('Account', acc.Id, comment.Id, 'Test Comment updated',5);
        System.assertEquals('Test Comment updated', comments[0].Name);
    }
    
    @isTest
    public static void testDeleteMembercomment()
    {
        Account acc = [Select Id FROM Account Limit 1];
        Member_Comments__c comment = new Member_Comments__c();
        comment.Comment_Details__c = 'Test Comment';
        comment.Account__c = acc.Id;
        insert comment;
	        
        List<MemberNotesController.MemberCommentsHelper> comments = MemberNotesController.deleteMemberComment ('Account', acc.Id, comment.Id,5);
        System.assertEquals(0, comments.size());
    }
    
    @isTest
    public static void testGetMemberCommentsHomepage()
    {
        Account acc = [Select Id FROM Account Limit 1];
        Member_Comments__c comment = new Member_Comments__c();
        comment.Comment_Details__c = 'Test Comment';
        comment.Account__c = acc.Id;
        insert comment;
        
        List<MemberNotesController.MemberCommentsHelper> comments = MemberNotesController.getMemberCommentsHomepage(1);
        System.assertEquals(1, comments.size());
    }
    
    @isTest
    public static void testGetTotalMembercommentsCount()
    {
        Account acc = [Select Id FROM Account Limit 1];
        Member_Comments__c comment = new Member_Comments__c();
        comment.Comment_Details__c = 'Test Comment';
        comment.Account__c = acc.Id;
        insert comment;
        
        Integer commentsCount = MemberNotesController.getTotalMemberCommentsCount(1);
        System.assertEquals(1, commentsCount);
    }
    
    @isTest
    public static void testGetRelatedMembercommentsCount()
    {
        Account acc = [Select Id FROM Account Limit 1];
        Member_Comments__c comment = new Member_Comments__c();
        comment.Comment_Details__c = 'Test Comment';
        comment.Account__c = acc.Id;
        insert comment;
        
        Integer commentsCount = MemberNotesController.getRelatedMemberCommentsCount('Account', acc.Id);
        System.assertEquals(1, commentsCount);
    }
}