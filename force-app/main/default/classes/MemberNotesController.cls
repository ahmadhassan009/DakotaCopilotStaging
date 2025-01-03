public with sharing class MemberNotesController {

    @AuraEnabled
    public static string getSFBaseUrl(){
        String sfdcBaseURL = URL.getSalesforceBaseUrl().toExternalForm();
        return sfdcBaseURL;
    }
    
    @AuraEnabled (cacheable=false)
    public static List<MemberCommentsHelper> getMemberComments(String objectName, Id recordId, Integer recordLimit)
    {
        List<Member_Comments__c> memberCommentsList = new List<Member_Comments__c>();
        if(objectName == 'Account')
        {
            memberCommentsList = [SELECT Id, Approval_Notes__c, Approval_Notes_Date__c, Comment_Details__c, CreatedDate, Contact__c, Account__c, Account__r.Name, Contact__r.Name, CreatedById
            FROM Member_Comments__c 
            WHERE Account__c =: recordId 
            ORDER BY CreatedDate DESC LIMIT: recordLimit];
        }
        else {
            memberCommentsList = [SELECT Id, Approval_Notes__c, Approval_Notes_Date__c, Comment_Details__c, CreatedDate, Contact__c, Account__c, Account__r.Name, Contact__r.Name, CreatedById
            FROM Member_Comments__c 
            WHERE Contact__c =: recordId 
            ORDER BY CreatedDate DESC LIMIT: recordLimit];
        }

        List<MemberCommentsHelper> memberComments = new List<MemberCommentsHelper>();
        for(Member_Comments__c memComment: memberCommentsList)
        {
            MemberCommentsHelper comment = new MemberCommentsHelper();
            comment.Id= memComment.Id;
            comment.name = memComment.Comment_Details__c;
            comment.approvalNotes = memComment.Approval_Notes__c;
            comment.approvalNotesDate = memComment.Approval_Notes_Date__c?.format('yyyy/MM/dd hh:mm a');
            comment.contactName = memComment.Contact__r.Name;
			comment.accountName = memComment.Account__r.Name;
            comment.commentTime = memComment.CreatedDate.format('yyyy/MM/dd hh:mm a');
            if (memComment.CreatedById == UserInfo.getUserId())
            {
                comment.isEditDeleteAccessPresent = true;
            }
            else
            {
                comment.isEditDeleteAccessPresent = false;
            }
            memberComments.add(comment);
       }
       return memberComments;
    }
    
	@AuraEnabled (cacheable=false)
    public static List<MemberCommentsHelper> getRecordName(String objectName, Id recordId)
    {	
        List<MemberCommentsHelper> recordName = new List<MemberCommentsHelper>();
        MemberCommentsHelper recName = new MemberCommentsHelper();
        
        if(objectName == 'Account'){   
            Account acc= [Select Id, Name from Account where Id =:recordId];
            recName.recordName = acc.Name;
            recordName.add(recName);
        }
        
        else{        
            Contact con= [Select Id, Name from Contact where Id =:recordId];
            recName.recordName = con.Name;
            recordName.add(recName);
        }
        return recordName;
    }    
    
    @AuraEnabled (cacheable=false)
    public static List<MemberCommentsHelper> saveMemberComment(String objectName, Id recordId, String comment, Integer recordLimit)
    {
        Member_Comments__c comm = new Member_Comments__c();
        comm.Comment_Details__c = comment;
        if(objectName == 'Account')
        {
            comm.Account__c = recordId;
        }
        else 
        {
            comm.Contact__c = recordId;
        }
        insert comm;
        return getMemberComments(objectName, recordId, recordLimit);
    }

    @AuraEnabled (cacheable=false)
    public static List<MemberCommentsHelper> deleteMemberComment(String objectName,Id recordId, Id commId, Integer recordLimit)
    {
        try {
                delete [SELECT id 
                        FROM Member_Comments__c 
                        WHERE Id =: commId];
                        return getMemberComments(objectName, recordId, recordLimit);
        } catch (Exception ex) {
            return null;
        }
    }

    @AuraEnabled (cacheable=false)
    public static List<MemberCommentsHelper> updateMemberComment(String objectName, Id recordId, Id commId, String comment, Integer recordLimit)
    {
        List<Member_Comments__c> comments = [SELECT id,Comment_Details__c 
        FROM Member_Comments__c 
        WHERE Id =: commId];
        if(comments!=null && comments.size()>0)
        {
            comments[0].Comment_Details__c =comment;
            update comments[0];
        }
        return getMemberComments(objectName, recordId, recordLimit);
    }
    
    @AuraEnabled (cacheable=false)
    public static List<MemberCommentsHelper> getMemberCommentsHomepage(Integer recordLimit)
    {	
        List<Member_Comments__c> memberCommentsList = new List<Member_Comments__c>();
        
        memberCommentsList = [SELECT Id, Approval_Notes__c, Approval_Notes_Date__c, Comment_Details__c, CreatedDate, Contact__r.Name, Account__r.Name, contact__r.AccountId, account__c, contact__c 
                           FROM Member_Comments__c 
                           ORDER BY CreatedDate DESC LIMIT 45000];
        
        List<Id> accountAccIds = new List<Id>();
        List<Id> contactAccIds = new List<Id>();
        for(Member_Comments__c memComment: memberCommentsList)
        {	
            accountAccIds.Add(memComment.account__c); 
            contactAccIds.Add(memComment.contact__r.AccountId);
        }
      
        Map<Id,Account> accountAccountsInfo = new Map<Id, Account>([Select Id, Name, Type, AUM__c, MetroArea__r.Name from Account Where Id IN : accountAccIds]);   
        Map<Id,Account> contactAccountsInfo = new Map<Id, Account>([Select Id, Name, Type, AUM__c, MetroArea__r.Name from Account Where Id IN : contactAccIds]);
        
        List<Member_Comments__c> actualMemberCommentsList = new List<Member_Comments__c>();
        actualMemberCommentsList = [SELECT Id, Approval_Notes__c, Approval_Notes_Date__c, Comment_Details__c, CreatedDate, Contact__r.Name, Account__r.Name, contact__r.AccountId, account__c, contact__c 
            FROM Member_Comments__c WHERE contact__r.AccountId in: contactAccountsInfo.keyset() OR account__c in:accountAccountsInfo.keyset() ORDER BY CreatedDate DESC LIMIT: recordLimit];

        List<MemberCommentsHelper> memberComments = new List<MemberCommentsHelper>();
        for(Member_Comments__c memComment: actualMemberCommentsList)
        {	
            MemberCommentsHelper comment = new MemberCommentsHelper();
            comment.Id= memComment.Id;
            comment.approvalNotes = memComment.Approval_Notes__c;
            comment.approvalNotesDate = memComment.Approval_Notes_Date__c?.format('yyyy/MM/dd hh:mm a');
            comment.name = memComment.Comment_Details__c;
            comment.contactName = memComment.Contact__r.Name;
			comment.accountName = memComment.Account__r.Name;
            comment.commentTime = memComment.CreatedDate.format('yyyy/MM/dd hh:mm a');
            comment.accId = memComment.Account__c;
            comment.conId = memComment.Contact__c;
                        
            if(memComment.account__c != null && accountAccountsInfo.get(memComment.account__c) != null){
                comment.accountAccountType = accountAccountsInfo.get(memComment.account__c).Type;
                comment.accountAccountAum = accountAccountsInfo.get(memComment.account__c).AUM__c;
                if(accountAccountsInfo.get(memComment.account__c).MetroArea__r.Name != null){
                    comment.accountAccountMetroArea = accountAccountsInfo.get(memComment.account__c).MetroArea__r.Name; 
                }
            }
            
            if(memComment.contact__c != null && memComment.contact__r.AccountId != null && contactAccountsInfo.get(memComment.contact__r.AccountId) != null){
                comment.contactAccountName = contactAccountsInfo.get(memComment.contact__r.AccountId).Name;
                comment.contactAccountType = contactAccountsInfo.get(memComment.contact__r.AccountId).Type;
                comment.contactAccountAum = contactAccountsInfo.get(memComment.contact__r.AccountId).AUM__c;
                if(contactAccountsInfo.get(memComment.contact__r.AccountId).MetroArea__r.Name != null){
            		comment.contactAccountMetroArea = contactAccountsInfo.get(memComment.contact__r.AccountId).MetroArea__r.Name;
                }
            } 
            memberComments.add(comment);
       }
       return memberComments;
    }

    @AuraEnabled (cacheable=false)
    public static Integer getRelatedMemberCommentsCount(String objectName, Id recordId) {
        if(objectName == 'Account')
        {
            return [
            SELECT COUNT()
            FROM Member_Comments__c
            WHERE Account__r.Id = :recordId];
        } else {
            return [
            SELECT COUNT()
            FROM Member_Comments__c
            WHERE Contact__r.Id = :recordId];
        }        
    }

    @AuraEnabled (cacheable=false)
    public static Integer getTotalMemberCommentsCount(Integer recordLimit) {
        
        return getMemberCommentsHomepage(recordLimit).size();  
    }

    public class MemberCommentsHelper{
        @AuraEnabled public Id Id {get; set;}
        @AuraEnabled public String name {get; set;}
        @AuraEnabled public String approvalNotes {get; set;}
        @AuraEnabled public String approvalNotesDate {get; set;}
        @AuraEnabled public String commentOwner {get; set;}
        @AuraEnabled public String commentOwnerUrl {get; set;}
        @AuraEnabled public String commentOwnerImg {get; set;}
        @AuraEnabled public String commentTime {get; set;}
        @AuraEnabled public String accountName {get; set;}
        @AuraEnabled public String contactName {get; set;}
        @AuraEnabled public Boolean isEditDeleteAccessPresent {get; set;}     
        @AuraEnabled public String accountAccountType {get; set;}
        @AuraEnabled public Decimal accountAccountAum {get; set;}
        @AuraEnabled public String accountAccountMetroArea {get; set;}      
        @AuraEnabled public String contactAccountName {get; set;}
        @AuraEnabled public String contactAccountType {get; set;}
        @AuraEnabled public Decimal contactAccountAum {get; set;}
        @AuraEnabled public String contactAccountMetroArea {get; set;}     
       	@AuraEnabled public String recordName {get; set;}     
        @AuraEnabled public Id accId {get; set;}
        @AuraEnabled public Id conId {get; set;}
        
        public MemberCommentsHelper(){
            Id=null;
            name = null;
            approvalNotes = null;
            approvalNotesDate = null;
            commentOwner = null;
            commentOwnerUrl = null;
            commentOwnerImg = null;
            commentTime = null;
            accountName = null;
            contactName =null;
            isEditDeleteAccessPresent = false;            
            accountAccountType = null;
            accountAccountAum = null;
            accountAccountMetroArea = null;          
            contactAccountName = null;
            contactAccountType = null;
            contactAccountAum = null;
            contactAccountMetroArea = null;           
            accId = null;
            conId = null;
        }
    }
}