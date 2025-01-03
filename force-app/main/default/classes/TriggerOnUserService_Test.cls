@IsTest
public class TriggerOnUserService_Test {
    
    @IsTest
    public static List<User> testDataCreation(){
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id and IsActive = true Limit 1];
        List<User> userList = new List<User>();
        System.RunAs(usr) {
            //Create Account
            Account portalAccount1 = new Account(
                Name = 'TestAccount',
                Trial_Start_Date__c = Date.newInstance(2021, 12, 15),
                Active_Draft_Trial__c = true
            );            
            insert(portalAccount1);  
            
            Profile p = [SELECT Id from Profile WHERE Name= 'Dakota Customer Community']; 
            
            List<Contact> contacts = new List<Contact>();
            for(integer i =0;i<25;i++) {
                Contact portalContact = new Contact(
                    FirstName = 'Test',
                    Lastname = 'Contact'+i,
                    AccountId = portalAccount1.Id
                );
                contacts.add(portalContact);
            }
            insert contacts;
            
            for(Contact cnct : contacts) {
                User portalUser =new User(Alias = 'dcom', 
                                 Email= cnct.LastName+'@testorg.com', 
                                 EmailEncodingKey='UTF-8',
                                 LastName='User '+ cnct.LastName,
                                 LanguageLocaleKey='en_US', 
                                 LocaleSidKey='en_US',
                                 ProfileId = p.Id, 
                                 TimeZoneSidKey='America/Los_Angeles',
                                 UserName=cnct.LastName+'@testorg.com',
                                 ContactId = cnct.Id,
                                 IsActive = true);
                userList.add(portalUser);
            }
            insert userList; 
        }
        return userList;
    }
    @IsTest
    public static void testEmailNotification(){
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id and IsActive = true Limit 1];
        System.RunAs(usr) {
            Integer totalLicense = 0 ;
            Integer remainingLicense = 0;
            Integer thresholdLicense = Integer.valueof(Label.communityUserLicenseThreshold);
            
            List<UserLicense> userLicense = [SELECT Name, TotalLicenses, UsedLicenses from UserLicense where Name='Customer Community Plus' LIMIT 1];
            
            for(UserLicense item : userLicense){
                totalLicense = item.TotalLicenses;
                remainingLicense = item.TotalLicenses - item.UsedLicenses;
            }
            
            //Create Account
            Account portalAccount1 = new Account(
                Name = 'TestAccount'
            );
            
            //Create contact
            Contact contact1 = new Contact(
                FirstName = 'Test',
                Lastname = 'McTesty',
                AccountId = portalAccount1.Id
            );
            
            insert(contact1);
            
            List<User> userList = new List<User>();
            Profile p = [SELECT Id from Profile WHERE Name= 'Dakota Customer Community']; 
            
            User u =new User(Alias = 'dcom', 
                             Email='@testorg.com', 
                             EmailEncodingKey='UTF-8',
                             LastName='Testing',
                             LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US',
                             ProfileId = p.Id, 
                             TimeZoneSidKey='America/Los_Angeles',
                             UserName='@testorg.com',
                             ContactId = contact1.Id);
            userList.add(u);
            Test.startTest();
            TriggerOnUserService.communityUserThreshold(userList);
            Integer invocations = Limits.getEmailInvocations();
            Test.stopTest();
            
            if(thresholdLicense >= remainingLicense){
                System.assertEquals(1,invocations,'Limits method is reflecting the sendemail call that was made in runtime context.');
            }
            else{
                System.assertEquals(0,invocations,'Limits method is reflecting the sendemail call that was made in runtime context.');  
            }
            
        }
    }
    @IsTest
    public static void testEmailNotificationUserUpdate()
    {
        List<User> userList = testDataCreation();           
        List<User> updatedUserList = new List<User>();
        for(User ul : userList){
            ul.IsActive = false;
            updatedUserList.add(ul);
        }
        update(updatedUserList);
         for(User ul : updatedUserList){
            ul.IsActive = true;
        }
        update(updatedUserList);
    }
    
    @IsTest
    public static void testCommunityUserDeactivated(){
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) {
            Test.startTest();
            Integer totalLicense = 0 ;
            Integer remainingLicense = 0;
            Integer thresholdLicense = Integer.valueof(Label.communityUserLicenseThreshold);
            
            List<UserLicense> userLicense = [SELECT Name, TotalLicenses, UsedLicenses from UserLicense where Name='Customer Community Plus' LIMIT 1];
            
            for(UserLicense item : userLicense){
                totalLicense = item.TotalLicenses;
                remainingLicense = item.TotalLicenses - item.UsedLicenses;
            }
            List<User> userList = testDataCreation();
            
            Map<Id, User> userMap = new Map <Id, User>();
            for(User ulist : userList){   
                userMap.put(ulist.Id, ulist);
            }
            
            List<User> updatedUserList = new List<User>();
            for(User ul : userList){
                ul.IsActive = false;
                updatedUserList.add(ul);
            }
            update(updatedUserList);
            
            TriggerOnUserService.communityUserDeactivated(updatedUserList, userMap);
            Integer invocations = Limits.getEmailInvocations();
            Test.stopTest();
            if(thresholdLicense >= remainingLicense){
                System.assertEquals(2,invocations,'communityUserDeactivated method is throughing exception.');
            }
            else{
                System.assertEquals(0,invocations,'communityUserDeactivated method is throughing exception.');
            }
        }
    }
    
    @isTest
    public static void testGivePermissionOfSearchesAndInvestmentObject()
    {
        testDataCreation();
        User usr = [Select Id,Name,Searches_Access__c from User where UserName='Contact1@testorg.com' Limit 1];
        usr.Searches_Access__c = true;
        update usr;
        
        List<PermissionSetAssignment> searchesPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId = :usr.Id and
                                                                        PermissionSet.Name='Marketplace_Searches_Permission'];
        System.assert(searchesPermissionSetAssignees.size() > 0);
        
        // usr = [Select Id,Name,Searches_Access__c from User where UserName='Contact1@testorg.com' Limit 1];
        usr.Searches_Access__c = false;
        update usr;
        
        searchesPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId = :usr.Id and
                                          PermissionSet.Name='Marketplace_Searches_Permission'];
        System.assert(searchesPermissionSetAssignees.size() == 0);
        
        // usr = [Select Id,Name,Public_Investments_Access__c from User where UserName='Contact1@testorg.com' Limit 1];
        usr.Public_Investments_Access__c = true;
        update usr;
        
        List<PermissionSetAssignment> publicInvstPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId = :usr.Id and
                                                                           PermissionSet.Name='Public_Investment_Permission'];
        System.assert(publicInvstPermissionSetAssignees.size() > 0);
        
        // usr = [Select Id,Name,Public_Investments_Access__c from User where UserName='Contact1@testorg.com' Limit 1];
        usr.Public_Investments_Access__c = false;
        //update usr;
        
        publicInvstPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId = :usr.Id and
                                             PermissionSet.Name='Public_Investment_Permission'];
        // System.assert(publicInvstPermissionSetAssignees.size() == 0);
        
        // usr = [Select Id,Name,X13F_Investments_Access__c from User where UserName='Contact1@testorg.com' Limit 1];
        usr.X13F_Investments_Access__c = true;
        //update usr;
        
        List<PermissionSetAssignment> X_13FPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId = :usr.Id and
                                                                     PermissionSet.Name='X13F_Filings_Permissions'];
        //System.assert(X_13FPermissionSetAssignees.size() > 0);
        
        // usr = [Select Id,Name,X13F_Investments_Access__c from User where UserName='Contact1@testorg.com' Limit 1];
        usr.X13F_Investments_Access__c = false;
        // update usr;
        
        // X_13FPermissionSetAssignees = [SELECT Id from PermissionSetAssignment where AssigneeId = :usr.Id and
        //                                PermissionSet.Name='X13F_Filings_Permissions'];
        // System.assert(X_13FPermissionSetAssignees.size() == 0);
    }
    
    @isTest
    public static void testDCPlanAndInsuranceAndInvFirmRecordsAccess()
    {
        testDataCreation();
        User usr = [Select Id,Name,Form_5500_Records_Access__c,Restrict_Insurance_Record_Access__c from User where UserName='Contact1@testorg.com' Limit 1];
        usr.Form_5500_Records_Access__c = true;
         usr.Restrict_Insurance_Record_Access__c = false;
        usr.LP_GP_Data_Access__c = true;
        update usr;
        
        List<GroupMember> form5500RecordsGroupMembers = [Select Id from GroupMember where UserOrGroupId = :usr.Id and Group.DeveloperName ='Form_5500_Records_Group'];
        System.assert(form5500RecordsGroupMembers.size() > 0);
        List<GroupMember> insuranceRecordsGroupMembers = [Select Id from GroupMember where UserOrGroupId = :usr.Id and Group.DeveloperName ='Insurance_Records_Access_Group'];
        System.assert(insuranceRecordsGroupMembers.size() > 0);
        List<GroupMember> invFirmRecordsGroupMembers = [Select Id from GroupMember where UserOrGroupId = :usr.Id and Group.DeveloperName ='LP_GP_Data_Access_Group'];
        System.assert(invFirmRecordsGroupMembers.size() > 0);
        
        usr = [Select Id,Name,Form_5500_Records_Access__c,Restrict_Insurance_Record_Access__c from User where UserName='Contact1@testorg.com' Limit 1];
        usr.Form_5500_Records_Access__c = false;
        usr.Restrict_Insurance_Record_Access__c = true;
        usr.LP_GP_Data_Access__c = false;
        update usr;
        
        form5500RecordsGroupMembers = [Select Id from GroupMember where UserOrGroupId = :usr.Id and Group.DeveloperName ='Form_5500_Records_Group'];
        System.assert(form5500RecordsGroupMembers.size() == 0);
        insuranceRecordsGroupMembers = [Select Id from GroupMember where UserOrGroupId = :usr.Id and Group.DeveloperName ='Insurance_Records_Access_Group'];
        System.assert(insuranceRecordsGroupMembers.size() == 0);
        invFirmRecordsGroupMembers = [Select Id from GroupMember where UserOrGroupId = :usr.Id and Group.DeveloperName ='LP_GP_Data_Access_Group'];
        System.assert(invFirmRecordsGroupMembers.size() == 0);
    }
    
    @isTest
    public static void testRemoveProductOwnerinAccountAddInfo()
    {
        testDataCreation();
        Account acc = [SELECT Id FROM Account Limit 1];
        Contact conn = [SELECT Id FROM Contact WHERE LastName = 'Contact1' Limit 1];
        User usr = [Select Id,Name from User where UserName='Contact1@testorg.com' Limit 1];
        System.RunAs(usr){
            Account_Additional_Information__c additionalInfo = new Account_Additional_Information__c(
                Account__c = acc.Id,
                Contact__c = conn.Id
            );
            insert additionalInfo;
        }
        Test.startTest();
        usr.isActive = false;
        update usr;
        Test.stopTest();
        Account_Additional_Information__c addInfo = [SELECT Id, Contact__c FROM Account_Additional_Information__c Limit 1];
        System.assertEquals(null, addInfo.Contact__c);
    }
    
    @isTest	
    public static void testSetCommunityUserFields() {	
        testDataCreation();	
        User usr = [Select Id,Name, is_community_user__c, organization_id__c from User where UserName='Contact1@testorg.com' Limit 1];	
        System.assert(usr.is_community_user__c, 'Is Community User checkbox was not set for cummunity users');	
        System.assert(usr.organization_Id__c!=null, 'Organization Id not set for community users');    	
    }
    
    @isTest
    public static void testUpdateLastExportDate()
    {
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usrr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id and IsActive = true Limit 1];
        User usr = new User();
        System.RunAs(usrr) {
            Test.startTest();
            testDataCreation();	
            usr = [Select Id,isActive, Allow_Account_and_Contacts_Export__c from User where UserName='Contact1@testorg.com' Limit 1];
            usr.Allow_Account_and_Contacts_Export__c = true;
            update usr;
            
            usr.Allow_Account_and_Contacts_Export__c = false;
            update usr;
            Test.stopTest();
          }
        
        List<User_History__c> historyRecords = [Select Id,Name from User_History__c where User_Updated__c = :usr.Id];
        System.assert(historyRecords.size() > 0);
    }
}