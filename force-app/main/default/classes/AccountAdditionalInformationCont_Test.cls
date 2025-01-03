@IsTest
public class AccountAdditionalInformationCont_Test {
    @TestSetup
    public static void createTestData()
    {
        Account acc = New Account(
            Name = 'Test Acc'
        );
        insert acc;
        Account_Additional_Information__c additionalInfo = new Account_Additional_Information__c(
            Account__c = acc.Id
        );
        insert additionalInfo;
        
        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usr) 
        {
            //Create contact
            Contact contact = new Contact(
                FirstName = 'Test',
                Lastname = 'Community User',
                AccountId = acc.Id
            );
            
            insert contact;
            Profile p = [SELECT Id from Profile WHERE Name= 'Dakota Customer Community']; 
            Test.startTest();
            User communityUser =new User(Alias = 'dcom', 
                                         Email='communityuser@testorg.com', 
                                         EmailEncodingKey='UTF-8',
                                         LastName='Testing',
                                         LanguageLocaleKey='en_US', 
                                         LocaleSidKey='en_US',
                                         ProfileId = p.Id, 
                                         TimeZoneSidKey='America/Los_Angeles',
                                         UserName='communityuser@testorg.com',
                                         ContactId = contact.Id,
                                         Portal_State__c = 'MP 2.0',
                                         IsActive = true);
            
            insert communityUser; 
            communityUser.IsPortalEnabled = true;
            update communityUser;
            Test.stopTest();
        }
    }
    
    @IsTest
    public static void testGetOrganizationId()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(AccountAdditionalInformationController.getOrganizationId()!=null);
        }
    }
    
    @IsTest
    public static void testGetPickListValues()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            Sales_Cycle_Options__c addOptions = new Sales_Cycle_Options__c(
                Organization_ID__c = acc.Id
            );
            insert addOptions;
            System.assert(AccountAdditionalInformationController.getPickListValues().size()!=null);
        	delete addOptions;
            System.assert(AccountAdditionalInformationController.getPickListValues().size()>0);
        }
    }
    
    @IsTest
    public static void testGetAccAddInfo()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        Account_Additional_Information__c addInfo = [SELECT Id,Organization_ID__c FROM Account_Additional_Information__c Limit 1];
        addInfo.Organization_ID__c = acc.Id;
        update addInfo;
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(AccountAdditionalInformationController.getAccAddInfo(acc.Id)!=null);
        }
    }
    
    @IsTest
    public static void testSaveData()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        Contact conn = [SELECT Id FROM Contact Limit 1];
        Account_Additional_Information__c addInfo = [SELECT Id,Organization_ID__c FROM Account_Additional_Information__c Limit 1];
        addInfo.Organization_ID__c = acc.Id;
        update addInfo;
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assertEquals('true',AccountAdditionalInformationController.saveData(acc.Id, 'Client',conn.id));
        }
    }
    
    @IsTest
    public static void testAddRemoveSalesCycles()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        Account_Additional_Information__c addInfo = [SELECT Id,Organization_ID__c FROM Account_Additional_Information__c Limit 1];
        addInfo.Organization_ID__c = acc.Id;
        update addInfo;
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assertEquals('true', AccountAdditionalInformationController.addRemoveSalesCycles('Prospecting'));
            Sales_Cycle_Options__c addOptions = new Sales_Cycle_Options__c(
                Organization_ID__c = acc.Id
            );
            insert addOptions;
            System.assertEquals('true', AccountAdditionalInformationController.addRemoveSalesCycles('Prospecting'));
        }
    }
    
    @IsTest
    public static void testFetchAccountOwners()
    {
        Account acc = [SELECT Id FROM Account Limit 1];
        User communityUser = [Select Id From User Where ContactId != null and IsActive = true AND UserName='communityuser@testorg.com' Limit 1];
        System.RunAs(communityUser) 
        {
            System.assert(AccountAdditionalInformationController.fetchAccountOwners().size()>0);
        }
    }
}