@isTest
public class batchToSendUpdateEmailToFollowers_Test {

    @testSetUp
    public static void createData()
    {
        Account acc = TestDataFactory.createAccount();
        Account acc2 = New Account();
        acc2.Name = 'Test Acc 2';
        insert acc2;
        
		Id investmentRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();        
        Account acc4 = New Account();
        acc4.Name = 'Test Acc 2';
        acc4.RecordTypeId = investmentRecordTypeId;
        acc4.X100_Marketplace__c = true;
        insert acc4;
        
        Id invAlloRecordTypeId = Schema.getGlobalDescribe().get('Account').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Account').getRecordTypeId();        
        Account acc5 = New Account();
        acc5.Name = 'Test Acc 2';
        acc5.RecordTypeId = invAlloRecordTypeId;
        acc5.X100_Marketplace__c = true;
        insert acc5;

        UserRole portalRole = [Select Id From UserRole Where PortalType = 'None' Limit 1];
        User usrr = [Select Id,UserRoleId from User where UserRoleId=:portalRole.Id Limit 1];
        System.RunAs(usrr)
        {
            Account accTest = New Account(
            	Name = 'Test Portal Account'
            );
            insert accTest;
            Contact con = new Contact(
                FirstName = 'Test',
                Lastname = 'Community User',
                Title='Director',
                AccountId=accTest.Id,
                Marketplace_Verified_Contact__c = true,
                Email = 'abc@gmail.com',
                Contact_Type__c = 'Field Consultant'
            );
            insert con;

            con.Title='Test Title 2';
            con.Asset_Class_Coverage__c='Equities';
            con.AccountId=acc.Id;
            con.Email = 'test@gmail.com';
            update con;

            acc.X100_Marketplace__c = true;
            acc.AUM__c = 10000;
            update acc;
            Test.startTest();
            User usr = TestDataFactory.createCommunityUser(con.Id);

            Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Public_Investment' AND SObjectType = 'Investment__c' LIMIT 1].Id;
            Id recordType13FId = [SELECT Id FROM RecordType WHERE Name = '13F Filings' AND SObjectType = 'Investment__c' LIMIT 1].Id;

            Investment__c inv = new Investment__c (
                        Account__c = acc.Id,
                        Name = 'Test Investment',
                        RecordTypeId = recordTypeId,
                        Fund_Balance__c = 1000,
                        Funding_Year_Number__c = 2022
                    );
            insert inv;
            
            List<Investment__c> invList = new List<Investment__c> ();
            for (Integer i = 0; i <= 6; i++ ) {
    	        Investment__c investment = new Investment__c (
	                Account__c = acc.Id,
                    Name = 'Test Investment' + i,
                    RecordTypeId = recordTypeId,
                    Fund_Balance__c = 1000,
                    Funding_Year_Number__c = 2022
                );
                invList.add(investment);
            }
			insert invList;
            Update__c upd = new Update__c(
                Account__c=acc2.Id,
                Contact__c=con.Id,
                Firm_Left__c=acc2.Id,
                Firm_Joined__c=acc.Id,
                New_Title__c='test',
                Type__c='Marketplace Personnel changes',
                Is_Accessible__c = true
            );
            insert upd;
            Update__c upd2 = new Update__c(
                Account__c=acc2.Id,
                Contact__c=con.Id,
                Firm_Left__c=acc.Id,
                Firm_Joined__c=acc2.Id,
                New_Title__c='test',
                Type__c='Marketplace Personnel changes',
                Is_Accessible__c = true
            );
            insert upd2;
            Account acc3 = [SELECT Id from Account where Name = 'Test Portal Account'];
            Follow__c favRec = new Follow__c(Target_Id__c = con.Id,
            OwnerId = usr.Id,
            Subtitle__c = 'Contact',
            Object_Name__c = 'Contact',
            Target_Type__c = 'Record');
            insert favRec;                         

            Follow__c favRec2 = new Follow__c(Target_Id__c = acc.Id,
            OwnerId = usr.Id,
            Subtitle__c = 'Account',
            Object_Name__c = 'Account',
            Target_Type__c = 'Record');
            insert favRec2; 
            
            Follow__c favRec3 = new Follow__c(Target_Id__c = acc3.Id,
            OwnerId = usr.Id,
            Subtitle__c = 'Account',
            Object_Name__c = 'Account',
            Target_Type__c = 'Record');
            insert favRec3;
            
            Follow__c favRec4 = new Follow__c(Target_Id__c = acc4.Id,
            OwnerId = usr.Id,
            Subtitle__c = 'Account',
            Object_Name__c = 'Account',
            Target_Type__c = 'Record');
            insert favRec4; 
            
            Follow__c favRec5 = new Follow__c(Target_Id__c = acc5.Id,
            OwnerId = usr.Id,
            Subtitle__c = 'Account',
            Object_Name__c = 'Account',
            Target_Type__c = 'Record');
            insert favRec5; 

            Id parentContentRecordTypeId = Schema.getGlobalDescribe().get('Dakota_Content__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Content').getRecordTypeId();
            Dakota_Content__c dakotaContentParent = new Dakota_Content__c();
            dakotaContentParent.Name = 'Test Parent DC';
            dakotaContentParent.Type__c = 'Sales Training';
            dakotaContentParent.RecordTypeId = parentContentRecordTypeId;
            insert dakotaContentParent;
            
            Id childContentRecordTypeId = Schema.getGlobalDescribe().get('Dakota_Content__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Content_Lines').getRecordTypeId();
            Dakota_Content__c dakotaContentChild = new Dakota_Content__c();
            dakotaContentChild.Name = 'Test Parent DC';
            dakotaContentChild.Type__c = 'Sales Training';
            dakotaContentChild.Contact_Linked__c = con.Id;
            dakotaContentChild.Dakota_Live_Call__c = dakotaContentParent.Id;
            dakotaContentChild.RecordTypeId = childContentRecordTypeId;
            insert dakotaContentChild;

            Client_Base__c cb0 = new Client_Base__c ();
            cb0.AUM__c=67890;
            cb0.Type__c='High Net Worth Individuals';
            cb0.Number_of_Clients__c= 6;
            cb0.Name='Test Client Base';
            cb0.Account__c=acc.Id;        
            insert cb0; 
            
            Investment_Strategy__c invStr = new Investment_Strategy__c();
            invStr.Name = 'Test Inv Strategy 1';
            invStr.Investment_Strategy_Verified__c = true;
            invStr.Account__c = acc4.id;
            insert invStr;
            
            Performance__c perfRec = new Performance__c();
            perfRec.Name = 'Test Perf Strategy';
            perfRec.Account__c = acc4.id;
            perfRec.Investment_Strategy__c = invStr.Id;
            insert perfRec;
            
            Investment__c inv2 = new Investment__c (
                        Investment_Strategy__c = invStr.Id,
                        Name = 'Test Investment',
                        RecordTypeId = recordTypeId,
                        Fund_Balance__c = 1000,
                        Funding_Year_Number__c = 2022
                    );
            insert inv2;
            
            Investment_Strategy__c perf = new Investment_Strategy__c();
            perf.Name = 'Test Inv Strategy';
            perf.Account__c = acc4.id;
            insert perf;
            
           Id presentationDeckRecordTypeId = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Presentation_Deck').getRecordTypeId();
            Manager_Presentation__c mpRecord = new Manager_Presentation__c();
            mpRecord.Name = 'Test Files';
            mpRecord.Is_Active__c = true;
            mpRecord.RecordTypeId = presentationDeckRecordTypeId;
            mpRecord.Account__c = acc4.id;
            insert mpRecord;
            
            Id meetingMaterialsRecordTypeId = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Meeting_Materials').getRecordTypeId();
            Manager_Presentation__c mpRecord1 = new Manager_Presentation__c();
            mpRecord1.Name = 'Test Meeting Materials';
            mpRecord1.Is_Active__c = true;
            mpRecord1.RecordTypeId = meetingMaterialsRecordTypeId;
            mpRecord1.Account__c = acc4.id;
            insert mpRecord1;

            Public_Plan_Minute__c publicPlanMin = new Public_Plan_Minute__c();
            publicPlanMin.Name = 'Test Plan';
            publicPlanMin.Account__c = acc4.Id;
            insert publicPlanMin;
            
            Account childAcc = New Account();
            childAcc.Name = 'Test Acc 2';
            childAcc.RecordTypeId = investmentRecordTypeId;
            childAcc.X100_Marketplace__c = true;
            childAcc.Parent_Account__c = acc4.Id; 
            insert childAcc;
            
            Dakota_News__c news = new Dakota_News__c();
            news.Account__c = acc4.Id;
            insert news;
            Test.stopTest();
            Investment__c inv3 = new Investment__c (
                        Account__c = acc5.Id,
                        Name = 'Test 13F Investment',
                        RecordTypeId = recordType13FId,
                        Fund_Balance__c = 1000,
                        Funding_Year_Number__c = 2022
                    );
            insert inv3;
            AccountContactRelation fieldConsultant = new AccountContactRelation();
            fieldConsultant.Roles = 'General Consultant';
            fieldConsultant.ContactId = con.Id;
            fieldConsultant.AccountId = acc5.Id;
            insert fieldConsultant;

            Update__c u = new Update__c(
                Last_Updated_Date__c = System.now(),
                Account__c = acc5.Id,
                RecordChangedBy__c = UserInfo.getUserId(),
                Field_Name__c = 'Custodian_s__c',
                Old_Value__c = 'Wells Fargo',
                New_Value__c = 'Schwab',
                Is_Accessible__c = true
            );
            insert u;
        }                        
    }
    
    @isTest
    public static void testSendUpdateEmailToFollowers()
    {     
        Test.startTest();
        Id batchInstanceId = Database.executeBatch(new batchToSendUpdateEmailToFollowers(), 50);
        Id batchInstanceId2 = Database.executeBatch(new BatchToSendUpdateEmailWeekly(), 50);
        String value = batchToSendUpdateEmailToFollowers.formatCurrencyString('123');
        Test.stopTest();
    }
}