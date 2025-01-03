@isTest
public class TestDataFactory 
{
    public static Account createAccount() 
    {
        Account acc = New Account(
            Name = 'Test Acc'
        );
        insert acc;
        return acc;
    }
    
    public static University_Alumni__c createUniversity() 
    {
        University_Alumni__c acc = new University_Alumni__c(
            Name = 'Test Acc'
        );
        insert acc;
        return acc;
    }
    
    public static Account createDynamicAccount(String accName) 
    {
        Account acc = New Account(
            Name = accName
        );
        insert acc;
        return acc;
    }
    
    public static Contact createContact() 
    {
        Contact contact = new Contact(
            FirstName = 'Test',
            Lastname = 'Community User'
        );
        insert contact;
        return contact;
    }
    public static Conference__c createConference() 
    {
        Conference__c acc = New Conference__c(
            Name = 'Test Conf'
        );
        insert acc;
        return acc;
    }
    
    public static Dakota_News__c createDakotaNews() 
    {
        Dakota_News__c dakNews = New Dakota_News__c(
            Name = 'Test News',
            Tags__c = 'Private Real Estate',
            Title__c = 'The Top Dakota Cocktails Investor Networking Conferences'
        );
        insert dakNews;
        return dakNews;
    }
    
    public static List<Dakota_News__c> createDakotaNewsRecords() 
    {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        List<Dakota_News__c> dakotaNewsRecords = new List<Dakota_News__c>();
        Integer counter = 5;
        for(Integer i = 0; i < counter; i++) {
            Dakota_News__c dakNews = New Dakota_News__c();
            dakNews.Name = 'Test Dakota News ' + i;
            dakNews.Tags__c = 'Private Real Estate';
            dakNews.Account__c = acc.Id;
            dakNews.Title__c = 'Test Title ' + i;
            dakotaNewsRecords.add(dakNews);
        }
        
        insert dakotaNewsRecords;
        return dakotaNewsRecords;
    }
    
    public static Contact createDynamicContact(String lastName) 
    {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        Contact contact = new Contact(
            FirstName = 'Test',
            Lastname = lastName,
            AccountId = acc.Id
        );
        insert contact;
        return contact;
    }

    public static Contact createCommunityUserContact() 
    {
        Account acc = New Account(
            Name = 'Test Portal Account'
        );
        insert acc;
        Contact contact = new Contact(
            FirstName = 'Test',
            Lastname = 'Community User',
            AccountId = acc.Id
        );
        insert contact;
        return contact;
    }
    
    public static User createCommunityUser(Id connId) 
    {
        Profile p = [SELECT Id from Profile WHERE Name= 'Dakota Customer Community']; 
        User communityUser =new User(Alias = 'dcom', 
                                     email='communityuser@testorg.com', 
                                     EmailEncodingKey='UTF-8',
                                     LastName='Testing',
                                     LanguageLocaleKey='en_US', 
                                     LocaleSidKey='en_US',
                                     ProfileId = p.Id, 
                                     TimeZoneSidKey='America/Los_Angeles',
                                     username='communityuser@testorg.com',
                                     ContactId = connId,
                                     Portal_State__c = 'MP 2.0',
                                     IsActive = true);
        
        insert communityUser; 
        return communityUser;
    }
    
    public static User createSecondCommunityUser(Id connId) 
    {
        Profile p = [SELECT Id from Profile WHERE Name= 'Dakota Customer Community']; 
        User communityUser =new User(Alias = 'dcom2', 
                                     email='communityuser2@testorg.com', 
                                     EmailEncodingKey='UTF-8',
                                     LastName='Testing 2',
                                     LanguageLocaleKey='en_US', 
                                     LocaleSidKey='en_US',
                                     ProfileId = p.Id, 
                                     TimeZoneSidKey='America/Los_Angeles',
                                     username='communityuser2@testorg.com',
                                     ContactId = connId,
                                     Portal_State__c = 'MP 2.0',
                                     IsActive = true);
        
        insert communityUser; 
        return communityUser;
    }
    
    public static String getOrganizationId(Id userId) 
    { 
        return [SELECT Contact.AccountId FROM User where id=:userId Limit 1]?.Contact.AccountId;
    }
    
    public static Task createTask(Id userId, Id accId, Id recTypeId) 
    {
        Task newTask = new Task();
        newTask.subject = 'Email';
        newTask.ActivityDate = System.today();
        newtask.priority = 'High';
        newtask.status = 'Open';
        newtask.OwnerId = userId;
        //newtask.whatId = accId;
        newTask.RecordTypeId = recTypeId;
        
        insert newTask;
        return newTask;
    }
    
    public static List<Task> createMassTasks(Id userId, List<Contact> contactList, Id recTypeId) 
    {
        List<Task> taskList = new List<Task>();
        for (Contact con : contactList) {
            Task newTask = new Task();
            newTask.subject = 'Email';
            newTask.ActivityDate = System.today();
            newTask.priority = 'High';
            newTask.status = 'Open';
            newTask.OwnerId = userId;
            //newTask.whatId = con.AccountId;
            newTask.whoId = con.Id;
            newTask.RecordTypeId = recTypeId;
            taskList.add(newTask);
        }
        insert taskList;
        return taskList;
    }
    
    public static TaskRelation createTaskRelation(Id taskId, Id connId) 
    {
        TaskRelation tskr = new TaskRelation();
        tskr.TaskId = taskId;
        tskr.IsWhat = false;
        tskr.RelationId = connId;
        insert tskr;
        return tskr;
    }
    
    public static Event createEvent(Id userId, Id accId, Id recTypeId) 
    {
        Event newEvent = new Event();
        newEvent.subject = 'Lunch';
        newEvent.StartDateTime = System.now().addDays(1);
        newEvent.EndDateTime = System.now().addDays(2);
        newEvent.IsAllDayEvent = false;
        newEvent.OwnerId = userId;
        //newEvent.whatId = accId;
        newEvent.RecordTypeId = recTypeId;
        insert newEvent;
        return newEvent;
    }
    
    public static List<Event> createMassEvents(Id userId, List<Account> accountList, Id recTypeId) 
    {
        List<Event> eventList = new List<Event>();
        for (Account acc : accountList) {
            Event newEvent = new Event();
            newEvent.subject = 'Lunch';
            newEvent.StartDateTime = System.now();
            newEvent.EndDateTime = System.now().addDays(1);
            newEvent.IsAllDayEvent = false;
            newEvent.OwnerId = userId;
            //newEvent.whatId = acc.Id;
            newEvent.RecordTypeId = recTypeId;
            eventList.add(newEvent);
        }
        insert eventList;
        return eventList;
    }
    
    public static EventRelation createEventRelation(Id eventId, Id connId) 
    {
        EventRelation evtr = new EventRelation();
        evtr.eventId = eventId;
        evtr.IsWhat = false;
        evtr.RelationId = connId;
        insert evtr;
        return evtr;
    }
    
    public static Dakota_Notes__c createNote(Id userId, Id accId) 
    {
        Dakota_Notes__c dnotes = new Dakota_Notes__c();
        dnotes.Name='tesing notes';
        dnotes.Text_Preview__c='<b>tesing notes</b>';
        dnotes.Account__c = accId;
        dnotes.ownerId = userId;
        insert dnotes;
        return dnotes;
    }
    
    public static List<Dakota_Notes__c> createMassNotes(Id userId, List<Contact> contactList) 
    {
        List<Dakota_Notes__c> dnotesList = new List<Dakota_Notes__c>();
        for (Contact con : contactList) {
            Dakota_Notes__c dnotes = new Dakota_Notes__c();
            dnotes.Name='tesing notes';
            dnotes.Text_Preview__c='<b>tesing notes</b>';
            dnotes.Account__c = con.AccountId;
            dnotes.Contact__c = con.Id;
            dnotes.ownerId = userId;
            dnotesList.add(dnotes);
        }
        insert dnotesList;
        return dnotesList;
    }
    
    public static Annual_Reports_and_Holdings_Data__c createAnnualReportAndHolding(Id accId) 
    {
        Annual_Reports_and_Holdings_Data__c annualReportHolding = new Annual_Reports_and_Holdings_Data__c();
        annualReportHolding.Name = 'Test ARH';
        annualReportHolding.Account__c = accId;
        insert annualReportHolding;
        return annualReportHolding;
    }
    
    public static void createContentVersion() 
    {
        ContentVersion contentVersion = new ContentVersion();
        contentVersion.Title = 'Test File';
        contentVersion.PathOnClient = 'testFile.pdf';
        contentVersion.VersionData = Blob.valueOf('Test Content');
        contentVersion.IsMajorVersion = true;
        insert contentVersion; 
    }
    
    public static Metro_Area__c createMetroArea() {
        Metro_Area__c ma = new Metro_Area__c();
        ma.Name = 'Test Metro Area';
        insert ma;
        return ma;
    }
    
    public static Conference__c createConferenceRecord(Id maId, Id accId, Id conId) {
        Conference__c conf = new Conference__c();
        conf.Name = 'Test Conference';
        conf.Metro_Area__c = maId;
        conf.Conference_Organizer__c = accId;
        conf.Key_Contact__c = conId;
        conf.Start_Date__c = Date.Today().addDays(10);
        conf.Format__c = 'Hybrid';
        conf.Investment_Focus__c = 'General';
        conf.Cost__c = '12000';
        insert conf;
        return conf;
    }
    
    public static void createConferenceSpeakerRecord(Id contId,Id confId) {
        List<Conference_Speaker__c> recList = new List<Conference_Speaker__c>();
        for (Integer i = 0; i < 5; i++) {
            Conference_Speaker__c conferenceSpeaker=new Conference_Speaker__c(Name='Test'+i,Contact__c=contId,Conference__c=confId);
            recList.add(conferenceSpeaker);
        }
        insert recList;
    }
    
    public static void createForm5500AdditionalInformationRecord(Id accId) {
        List<Form_5500_Additional_Information__c> recList = new List<Form_5500_Additional_Information__c>();
        for (Integer i = 0; i < 5; i++) {
            Form_5500_Additional_Information__c form=new Form_5500_Additional_Information__c(Ack_Id__c='1234'+i,Account__c=accId);
            recList.add(form);
        }
        insert recList;
    }
    
    public static Marketplace_Searches__c createSearchRecord() {
        Marketplace_Searches__c search = new Marketplace_Searches__c(
            Name = 'Test Search',
            Asset_Class__c = 'Global Equities',
            Sub_Asset_Class__c = 'Global Equity',
            Amount__c = 5000,
            End_Date__c = Date.newInstance(2020, 12, 11),
            Search_Status__c = 'Upcoming',
            Contact__c = createContact().Id
        );
        insert search;
        return search;
    }
    
    public static void createServiceProviderRecord(Id accId) {
        List<Fund_Service_Provider__c> recList = new List<Fund_Service_Provider__c>();
        for (Integer i = 0; i < 5; i++) {
            Fund_Service_Provider__c serviceProvider=new Fund_Service_Provider__c(Name='Test'+i,Account__c=accId);
            recList.add(serviceProvider);
        }
        insert recList;
    }
    
    public static Investment_Funds__c createFundInvestmentRecord(Id accId) {
        Investment_Funds__c fi = new Investment_Funds__c();
        fi.Account__c = accId;
        fi.Name_of_sponsor_of_entity_listed__c = 'Test';
        fi.Dollar_value_of_interest__c = 250.25;
        fi.EIN_and_PN_Part_1__c = 'Test P1';
        fi.EIN_and_PN_Part_2__c = 'Test P2';
        fi.Row_Order_P1__c = 12;
        insert fi;
        return fi;
    }
    
    public static void createEducationRecord(Id contId,Id accId) {
        List<Education__c> recList = new List<Education__c>();
        for (Integer i = 0; i < 5; i++) {
            Education__c education=new Education__c(Contact__c=contId,College__c=accId);
            recList.add(education);
        }
        insert recList;
    }
    
    public static Investment__c createInvestmentRecord(Id accId) {
        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Public_Investment' AND SObjectType = 'Investment__c' LIMIT 1].Id;
        Investment_Strategy__c investmentStategy = new Investment_Strategy__c (
            Name = 'Test Strategy'
        );
        insert investmentStategy;
        Investment__c inv = new Investment__c (
            Account__c = accId,
            Name = 'Test Investment',
            RecordTypeId = recordTypeId,
            Investment_Strategy__c = investmentStategy.Id,
            Fund_Balance__c = 1000,
            Funding_Year_Number__c = 2022,
            Heroku_Synced__c = false
        );
        insert inv;
        return inv;
    }
    
    public static List<Asset_Class_Exposure__c> createAssetClassExposureRecord(Id accId) {
        List<Asset_Class_Exposure__c> assetClassList = new List<Asset_Class_Exposure__c>();
        Integer counter = 5;
        for(Integer i=0; i< counter ; i++) {
            Asset_Class_Exposure__c assetRecord = new Asset_Class_Exposure__c(
                Name = 'Test Asset Class Exposure ' + i,
                Fund_Balance__c = 15000,
                Funding_Year_Number__c = 2020,
                Account__c = accId
            );
            assetClassList.add(assetRecord);
        }
        insert assetClassList;
        return assetClassList;
    }
    
    public static void createEducationRecord(Id contId) {
        List<Education__c> recList = new List<Education__c>();
        for (Integer i = 0; i < 5; i++) {
            Education__c education=new Education__c(Contact__c=contId);
            recList.add(education);
        }
        insert recList;
    }

    public static void createEducationRecordForAccount(Id accId, Id contId) {
        List<Education__c> recList = new List<Education__c>();
        for (Integer i = 0; i < 5; i++) {
            Education__c education = new Education__c(
                College__c = accId, 
                Contact__c = contId);
            recList.add(education);
        }
        insert recList;
    }

    public static void createEducationRecordForUniversity(Id accId, Id contId) {
        List<Education__c> recList = new List<Education__c>();
        for (Integer i = 0; i < 5; i++) {
            Education__c education = new Education__c(
                University_Alumni__c = accId, 
                Contact__c = contId);
            recList.add(education);
        }
        insert recList;
    }
    
    public static void createCase(Id conId) {
        
        Case cs = new Case(
            ContactId = conId,
            Origin = 'Web',
            Subject = 'Asset Class Preference',
            Status = 'Closed',
            SuppliedEmail = 'test@test.com'
        );
        insert cs;
    }

    public static void createCaseAcct(Id conId, Id acctId) {
        Case cs = new Case(
                ContactId = conId,
                AccountId = acctId,
                Origin = 'Web',
                Subject = 'Asset Class Preference',
                Status = 'Closed',
                SuppliedEmail = 'test@test.com'
            );
        insert cs;
    }
public static void createUpdateRecords(Id accId,Id joined,Id contId)
    {
        List<Update__c> recList = new List<Update__c>();
        for (Integer i = 0; i < 5; i++) {
            Update__c upd=new Update__c(
                Account__c=accId,
                Contact__c=contId,
                Firm_Left__c=accId,
                Firm_Joined__c=joined,
                New_Title__c='test'+i,
                Type__c='Marketplace Personnel changes'
                );
            recList.add(upd);
        }
        insert recList;
    }
    
    public static List<MP_New_Features__c> createMpNewFeaturesRecords() 
    {
        List<MP_New_Features__c> mpNewFeaturesRecords = new List<MP_New_Features__c>();
        Integer counter = 5;
        for(Integer i = 0; i < counter; i++) {
            MP_New_Features__c record = New MP_New_Features__c();
            record.Title__c = 'Test MP New Feature ' + i;
            record.Demo__c = 'www.google.com';
            mpNewFeaturesRecords.add(record);
        }

        insert mpNewFeaturesRecords;
        return mpNewFeaturesRecords;
    }

    public static void createHerokuAuthMetadata() {
        Heroku_Credentials__c cs = New Heroku_Credentials__c();
        cs.Name = 'Authentication_Credentials';
        cs.Access_Token__c = 'abcdefghijklmnopqrstuv=';
        cs.Authentication_Key__c= 'lrGY/02l8WrqQftXLdFV3Q==';
        cs.Heroku_URL__c= 'https://marketplace-dakota-dev.herokuapp.com';
        cs.Expiry_Date__c= Datetime.now();
        cs.Password__c= 'zgDN+dXLx5wpSA9aJDFZOX1K6QEzkrU9c3RvNfxwAo0=';
        cs.Username__c= 'testuser';
        insert cs;
    }
    
    public static void createInsuranceAdditionalInformationRecord(Id accId) {
        Insurance_Additional_Information__c insuranceRecord=new Insurance_Additional_Information__c(Account__c=accId);
        insert insuranceRecord;
    }
    
    public static List<Investment_Holdings__c> createInvestmentHoldingsRecords(Id accId) 
    {
        List<Investment_Holdings__c> investmentHoldingsRecords = new List<Investment_Holdings__c>();
        Integer counter = 5;
        for(Integer i = 0; i < counter; i++) {
            Investment_Holdings__c record = New Investment_Holdings__c();
            record.Name = 'Test investment holdings ' + i;
            record.Liquidity_Indicator__c  = 'Test investment ' + i;            
            record.Account__c  = accId;
            investmentHoldingsRecords.add(record);
        }
        
        insert investmentHoldingsRecords;
        return investmentHoldingsRecords;
    }

}