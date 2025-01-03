public class batchToSendUpdateEmailToFollowers implements Database.Batchable<sObject> {

    public Database.QueryLocator start(Database.BatchableContext bc) {
        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
        String query = 'SELECT ID, Name, Email FROM User WHERE Id IN (SELECT OwnerId FROM Follow__c WHERE (Subtitle__c=\'Account\' OR Subtitle__c= \'Contact\' OR Subtitle__c= \'Investment Strategy\') AND Target_Type__c = \'Record\' AND RecordTypeId = :recordTypeId) AND isActive=true';
        if (Test.isRunningTest()) {
            query = 'SELECT ID, Name, Email FROM User WHERE Id IN (SELECT OwnerId FROM Follow__c WHERE (Subtitle__c=\'Account\' OR Subtitle__c= \'Contact\') AND Target_Type__c = \'Record\' )';
        }
        return Database.getQueryLocator(query);
    }
   
    /**
    * Execute Method is getting users chunk and after checking updates of both followed
    * contact and followed account of these users sending an email to them.
    */
    public void execute(Database.BatchableContext bc, List<User> users) {
        Map<Id,List<String>> mapOfUserAndItsFollowedAcc = new Map<Id,List<String>>();
        Map<Id,List<String>> mapOfUserAndItsFollowedCon = new Map<Id,List<String>>();
        List<Id> followedAccounts = new List<Id> ();
        List<Id> followedContacts = new List<Id> ();
        List<Id> followedInvestmentStrategy = new List<Id> ();
        Set<Id> usersId = (new Map<Id,User>(users))?.keySet();
        List<Follow__c> followedRecords = new List<Follow__c>();
        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;

        if(!Test.isRunningTest()) {
            followedRecords = [
                                SELECT Id, OwnerId, owner.email, owner.name, owner.lastname, Subtitle__c, Target_Type__c, Target_Id__c FROM Follow__c
                                WHERE (Subtitle__c = 'Account'
                                OR Subtitle__c = 'Contact')
                                AND Target_Type__c = 'Record'
                                AND RecordTypeId = :recordTypeId
                                AND OwnerId IN :usersId
                            ];
        } else {
            followedRecords = [ 
                                SELECT Id, OwnerId, owner.email, owner.name, owner.lastname, Subtitle__c, Target_Type__c, Target_Id__c FROM Follow__c 
                                WHERE (Subtitle__c = 'Account' 
                                OR Subtitle__c = 'Contact')
                                AND Target_Type__c = 'Record'
                                AND RecordTypeId = :recordTypeId
                                AND OwnerId IN :usersId
                            ];
        }
        for (Follow__c follow : followedRecords ) {
            if (follow.Subtitle__c == 'Account') {
                followedAccounts.add(follow.Target_Id__c);
                if (mapOfUserAndItsFollowedAcc.containsKey(follow.OwnerId)) {
                        mapOfUserAndItsFollowedAcc.get(follow.OwnerId).add(follow.Target_Id__c);
                } else {
                    List<String> followedAccIds = new List<String>();
                    followedAccIds.add(follow.Target_Id__c);
                    mapOfUserAndItsFollowedAcc.put(follow.OwnerId, followedAccIds);
                }
            } else if (follow.Subtitle__c == 'Contact') {
                followedContacts.add(follow.Target_Id__c);
                if (mapOfUserAndItsFollowedCon.containsKey(follow.OwnerId)) {
                        mapOfUserAndItsFollowedCon.get(follow.OwnerId).add(follow.Target_Id__c);
                } else {
                    List<String> followedConIds = new List<String>();
                    followedConIds.add(follow.Target_Id__c);
                    mapOfUserAndItsFollowedCon.put(follow.OwnerId, followedConIds);
                }
            }
        }
        Map<Id, User> usersMap = new Map<Id,User>(users);
        Map<Id, List<Update__c>> accConFirmJoinedMap = new Map<Id,List<Update__c>> ();
        Map<Id, List<Update__c>> accConFirmLeftMap = new Map<Id,List<Update__c>> ();
        Map<Id, List<Update__c>> jobChangeMap = new Map<Id,List<Update__c>> ();
        Map<Id, List<Update__c>> roleChagneMap = new Map<Id,List<Update__c>> ();
        Map<Id, List<Client_Base__c>> clientBaseUpdateMap = new Map<Id,List<Client_Base__c>> ();
        Map<Id, List<Investment__c>> investmentsInAccountMap = new Map<Id,List<Investment__c>> ();
        Map<Id, List<AccountHistory>> consultantAccountsMap = new Map<Id,List<AccountHistory>> ();
        Map<Id, List<Performance__c>> performanceRelatedToAccount = new Map<Id,List<Performance__c>> ();
        Map<Id, List<Investment_Strategy__c>> investmentStrategyRelatedToAccount = new Map<Id,List<Investment_Strategy__c>> ();
        Map<Id, List<Manager_Presentation__c>> managerPresentationRelatedToAccount = new Map<Id,List<Manager_Presentation__c>> ();
        Map<Id, List<Manager_Presentation__c>> managerPresentationPPFRelatedToAccount = new Map<Id,List<Manager_Presentation__c>> ();
        Map<Id, List<Manager_Presentation__c>> managerPresentationConsultantRelatedToAccount = new Map<Id,List<Manager_Presentation__c>> ();
        Map<Id, List<ContactHistory>> assetClassChangesInContactMap = new Map<Id,List<ContactHistory>> ();
        Map<Id, List<AccountContactRelation>> fieldConsultantContactMap = new Map<Id,List<AccountContactRelation>> ();
        Map<Id, List<Dakota_News__c>> fundraisingNewsRelatedToAccountMap = new Map<Id,List<Dakota_News__c>> ();
        Map<Id, List<Public_Plan_Minute__c>> publicPlanMinuteRelatedToAccountMap = new Map<Id,List<Public_Plan_Minute__c>> ();
        Map<Id, List<Dakota_Content__c>> dakotaContentRelatedToContact = new Map<Id,List<Dakota_Content__c>> ();
        Map<Id, List<Investment__c>> publicInvInInvestmentFirmAccountMap = new Map<Id,List<Investment__c>> ();
        Map<Id, List<AccountContactRelation>> fieldConsultantAccountMap = new Map<Id,List<AccountContactRelation>> ();
        Map<Id, List<Account>> childAccountsMap = new Map<Id,List<Account>> ();
        Map<Id, List<AccountHistory>> accountAUMUpdatesMap = new Map<Id,List<AccountHistory>> ();
        Map<Id, List<Update__c>> accountCustodianUpdatesMap = new Map<Id,List<Update__c>> ();
        Map<Id, List<ContactHistory>> emailChangesInContactMap = new Map<Id,List<ContactHistory>> ();
   
        Map<String, Schema.RecordTypeInfo> managerPresentationRecTypes = Schema.getGlobalDescribe().get('Manager_Presentation__c').getDescribe().getRecordTypeInfosByDeveloperName();
        Id presentationDeckRecordtypeId = managerPresentationRecTypes.get('Presentation_Deck').getRecordTypeId();
        Id meetingMaterialsRecordtypeId = managerPresentationRecTypes.get('Meeting_Materials').getRecordTypeId();
        Map<String,String> mapOfUserEmailToEmailBody = new Map<String,String> ();
        DateTime timeLimitBound = System.now()?.addDays(-1);
        try {
            List<AccountHistory> accountsHistory = [SELECT id, AccountId, Account.Name, field, OldValue, NewValue FROM AccountHistory
                                                    WHERE (field = 'DC_Consultant__c'
                                                    OR field = 'General_Consultant__c'
                                                    OR field = 'General_Consultant_2__c'
                                                    OR field = 'Hedge_Fund_Consultant__c'
                                                    OR field = 'Private_Credit_Consultant__c'
                                                    OR field = 'Private_Equity_Consultant__c'
                                                    OR field = 'Real_Estate_Consultant__c')
                                                    AND createddate >= :timeLimitBound
                                                    AND (Account.X100_Marketplace__c = true OR Account.X100_Everest__c = true)
                                                    AND AccountId IN :followedAccounts];
   
            List<AccountHistory> consultantAccounts = new List<AccountHistory>();
            for (AccountHistory history : accountsHistory ) {
                if(!(history.OldValue instanceof Id) && !(history.NewValue instanceof Id)) {
                    consultantAccounts.add(history);
                }
            }
            consultantAccountsMap = populateMaps(consultantAccounts, '');
   
            List<AccountHistory> accountsAUMHistory = [SELECT id, AccountId, Account.Name, field, OldValue, NewValue FROM AccountHistory
                                                WHERE field = 'AUM__c'
                                                AND createddate >= :timeLimitBound
                                                AND (Account.X100_Marketplace__c = true OR Account.X100_Everest__c = true)
                                                AND AccountId IN :followedAccounts];

            List<AccountHistory> accountAUMUpdates = new List<AccountHistory>();
            for (AccountHistory history : accountsAUMHistory ) {
                if(!(history.OldValue instanceof Id) && !(history.NewValue instanceof Id)) {
                    accountAUMUpdates.add(history);
                }
            }
            accountAUMUpdatesMap = populateMaps(accountAUMUpdates, '');

            investmentsInAccountMap = populateMaps([SELECT Id, Name, Account__c, Account__r.Name,Account__r.RecordType.DeveloperName, Fund_Balance__c, Investment_Strategy__c, Investment_Strategy__r.Name
                                                    FROM Investment__c
                                                    WHERE createddate >= :timeLimitBound
                                                    AND RecordType.Name = 'Public Investment'
                                                    AND Account__r.RecordType.DeveloperName = 'Dakota_Investments_Account'
                                                    AND (Account__r.X100_Marketplace__c = true OR Account__r.X100_Everest__c = true)
                                                    AND Account__c in :followedAccounts], 'Public Investment');
                                                    
            List<Investment_Strategy__c> invStrRelatedToInvFirmFollowedAcc = [SELECT Id,Name, Account__c,Account__r.Name from Investment_Strategy__c
                                                    WHERE Account__c IN :followedAccounts
                                                    AND Investment_Strategy_Verified__c = true
                                                    AND Account__r.RecordType.DeveloperName = 'Dakota_360_Account'
                                                    AND (Account__r.X100_Marketplace__c = true OR Account__r.X100_Everest__c = true)];
                                        
            publicInvInInvestmentFirmAccountMap = populateMaps([SELECT Id, Name, Createddate, Account__c, Account__r.Name,Account__r.RecordType.DeveloperName, Investment_Strategy__c,Investment_Strategy__r.Name,investment_strategy__r.Account__c, Investment_strategy__r.Account__r.Name
                                                    FROM Investment__c
                                                    WHERE createddate >= :timeLimitBound
                                                    AND RecordType.Name = 'Public Investment'
                                                    AND Investment_Strategy__c in :invStrRelatedToInvFirmFollowedAcc], 'Inv_Firm_Public_Investment');
            
            clientBaseUpdateMap = populateMaps([SELECT Id, Name, Account__c, Account__r.Name FROM Client_Base__c
                                                WHERE createddate >= :timeLimitBound
                                                AND (Account__r.X100_Marketplace__c = true OR Account__r.X100_Everest__c = true)
                                                AND Account__c in :followedAccounts], '');
            jobChangeMap = populateMaps([SELECT Id, Contact__c, Contact__r.id, Contact__r.Name, Firm_Joined__c, Firm_Joined__r.Name, Firm_Left__c, Firm_Left__r.Name FROM Update__c
                                        WHERE Job_Change__c = true
                                        AND createddate >= :timeLimitBound
                                        AND Contact__r.Marketplace_Verified_Contact__c = true
                                        AND Is_Accessible__c = true
                                        AND Contact__c in :followedContacts], 'Job Change');
            roleChagneMap = populateMaps([SELECT Id, Contact__c, Contact__r.id, Contact__r.Name, Contact__r.Marketplace_Verified_Contact__c, Contact__r.Account.Name, New_Title__c, Old_Title__c FROM Update__c WHERE Role_Change__c = true
                                            AND createddate >= :timeLimitBound
                                            AND Contact__r.Marketplace_Verified_Contact__c = true
                                            AND Is_Accessible__c = true
                                            AND Contact__c in :followedContacts], 'Role Change');
            accConFirmJoinedMap = populateMaps([SELECT Id, Firm_Joined__c, Firm_Joined__r.id, Firm_Joined__r.Name, Firm_Left__c, Firm_Left__r.Name, Contact__c, Contact__r.Name FROM Update__c
                                                WHERE Job_Change__c = true
                                                AND createddate >= :timeLimitBound
                                                AND (Firm_Joined__r.X100_Marketplace__c = true OR Firm_Joined__r.X100_Everest__c = true)
                                                AND Is_Accessible__c = true
                                                AND Firm_Joined__c in :followedAccounts], 'Firm Joined');
            accConFirmLeftMap = populateMaps([SELECT Id, Firm_Joined__c, Firm_Joined__r.id, Firm_Joined__r.Name, Firm_Left__c, Firm_Left__r.Id, Firm_Left__r.Name, Contact__c, Contact__r.Name FROM Update__c
                                                WHERE Job_Change__c = true
                                                AND createddate >= :timeLimitBound
                                                AND (Firm_Left__r.X100_Marketplace__c = true OR Firm_Left__r.X100_Everest__c = true)
                                                AND Is_Accessible__c = true
                                                AND Firm_Left__c in :followedAccounts], 'Firm Left');
            accountCustodianUpdatesMap = populateMaps([SELECT Id, Last_Updated_Date__c, Account__c, Account__r.Name, RecordChangedBy__c, Field_Name__c, Old_Value__c, New_Value__c FROM Update__c
                                                        WHERE CreatedDate >= :timeLimitBound 
                                                        AND (Account__r.X100_Marketplace__c = true OR Account__r.X100_Everest__c = true)
                                                        AND Field_Name__c = 'Custodian_s__c'
                                                        AND Is_Accessible__c = true
                                                    ], 'Custodian Update');
            performanceRelatedToAccount = populateMaps([SELECT Id,Name, Account__c, Account__r.Name,Account__r.RecordType.DeveloperName FROM Performance__c
                                                WHERE Investment_Strategy__r.Investment_Strategy_Verified__c = true
                                                AND Account__r.RecordType.DeveloperName = 'Dakota_360_Account'
                                                AND createddate >= :timeLimitBound
                                                AND Account__c in :followedAccounts
                                                AND (Account__r.X100_Marketplace__c = true OR Account__r.X100_Everest__c = true)
                                                ], 'Performance');
            investmentStrategyRelatedToAccount = populateMaps([SELECT Id,Name, Account__c, Account__r.Name,Account__r.RecordType.DeveloperName FROM Investment_Strategy__c
                                                WHERE createddate >= :timeLimitBound
                                                AND Account__c in :followedAccounts
                                                AND Account__r.RecordType.DeveloperName = 'Dakota_360_Account'
                                                AND Investment_Strategy_Verified__c = true
                                                AND (Account__r.X100_Marketplace__c = true OR Account__r.X100_Everest__c = true)
                                                ], 'Investment Strategy');
            managerPresentationRelatedToAccount = populateMaps([SELECT Id,Name, Account_Name__c, Account__c,Account__r.RecordType.DeveloperName, Asset_Class__c, Sub_Asset_Class__c, Meeting_Date__c, 
                                                Public_Plan_Minute__c, Public_Plan_Minute__r.Name, Investment_Strategy__c, 
                                                Investment_Strategy__r.Name, Manager_Presentation_Type__c
                                                FROM Manager_Presentation__c
                                                WHERE Is_Active__c = true
                                                AND RecordTypeId = :presentationDeckRecordtypeId
                                                AND createddate >= :timeLimitBound
                                                AND Account__c IN :followedAccounts
                                                AND (Account__r.X100_Marketplace__c = true OR Account__r.X100_Everest__c = true)
                                                AND Account__r.RecordType.DeveloperName = 'Dakota_360_Account'
                                            ], 'Presentation Deck Account');
            managerPresentationConsultantRelatedToAccount = populateMaps([SELECT Id,Name, Asset_Class__c, Sub_Asset_Class__c, Meeting_Date__c, 
                                                            Public_Plan_Minute__c, Public_Plan_Minute__r.Name, Investment_Strategy__c, 
                                                            Investment_Strategy__r.Name, Manager_Presentation_Type__c, Consultant__c, Consultant__r.Name
                                                            FROM Manager_Presentation__c
                                                            WHERE Is_Active__c = true
                                                            AND RecordTypeId = :presentationDeckRecordtypeId
                                                            AND createddate >= :timeLimitBound
                                                            AND (Consultant__c IN :followedAccounts)
                                                            AND (Consultant__r.X100_Marketplace__c = true OR Consultant__r.X100_Everest__c = true)
                                                            AND Consultant__r.RecordType.DeveloperName = 'Dakota_360_Account'
                                                        ], 'Presentation Deck Conusltant');
            managerPresentationPPFRelatedToAccount = populateMaps([SELECT Id,Name, Account_Name__c, Asset_Class__c, Sub_Asset_Class__c, Meeting_Date__c, 
                                                        Public_Plan_Minute__c, Public_Plan_Minute__r.Name, Investment_Strategy__c, 
                                                        Investment_Strategy__r.Name, Manager_Presentation_Type__c, Public_Pension_Fund__c, Public_Pension_Fund__r.Name
                                                        FROM Manager_Presentation__c
                                                        WHERE Is_Active__c = true
                                                        AND RecordTypeId = :presentationDeckRecordtypeId
                                                        AND createddate >= :timeLimitBound
                                                        AND Public_Pension_Fund__c IN :followedAccounts
                                                        AND (Public_Pension_Fund__r.X100_Marketplace__c = true OR Public_Pension_Fund__r.X100_Everest__c = true)
                                                        AND Public_Pension_Fund__r.RecordType.DeveloperName = 'Dakota_360_Account'
                                                    ], 'Presentation Deck PPF');
            List<ContactHistory> contactsHistory = [SELECT id, ContactId,Contact.Marketplace_Verified_Contact__c,Contact.Name, field, OldValue, NewValue FROM ContactHistory 
                                                WHERE field = 'Asset_Class_Coverage__c'
                                                AND createddate >= :timeLimitBound
                                                AND Contact.Marketplace_Verified_Contact__c = true
                                                AND ContactId IN :followedContacts];
            List<ContactHistory> assetClassChangesInContact = new List<ContactHistory>();
                                                for (ContactHistory history : contactsHistory ) {
                                                    if(!(history.OldValue instanceof Id) && !(history.NewValue instanceof Id)) {
                                                        assetClassChangesInContact.add(history);
                                                    }
                                                }
            assetClassChangesInContactMap = populateMaps(assetClassChangesInContact, '');
            dakotaContentRelatedToContact = populateMaps([SELECT Id, Name, Contact_Linked__c, Contact_Linked__r.Name, Dakota_Live_Call__c, Dakota_Live_Call__r.Name FROM Dakota_Content__c
                                                WHERE createddate >= :timeLimitBound
                                                AND Contact_Linked__c in :followedContacts
                                                AND (Contact_Linked__r.Marketplace_Verified_Contact__c = true)
                                                ], '');
            fieldConsultantContactMap  = populateMaps([SELECT Id, Roles, IsDirect, AccountId,Account.Name, ContactId, Contact.Name FROM AccountContactRelation
                                                WHERE createddate >= :timeLimitBound
                                                AND Roles IN ('General Consultant', 'Real Estate Consultant', 'Hedge Funds Consultant','Private Equity Consultant','Private Credit Consultant')
                                                AND ContactId in :followedContacts
                                                AND (Contact.Contact_Type__c = 'Field Consultant')
                                                AND (Account.X100_Marketplace__c = true OR Account.X100_Everest__c = true)
                                                AND (Contact.Marketplace_Verified_Contact__c = true)
                                                ], '');

            fieldConsultantAccountMap  = populateMaps([SELECT Id, Roles, IsDirect, AccountId,Account.Name, ContactId, Contact.Name FROM AccountContactRelation
                                                WHERE createddate >= :timeLimitBound
                                                AND Roles IN ('General Consultant', 'Real Estate Consultant', 'Hedge Funds Consultant','Private Equity Consultant','Private Credit Consultant')
                                                AND AccountId in :followedAccounts
                                                AND (Account.X100_Marketplace__c = true OR Account.X100_Everest__c = true)
                                                AND (Contact.Marketplace_Verified_Contact__c = true)
                                                AND (Contact.Contact_Type__c = 'Field Consultant')
                                                ], 'Consultant_Related_Account');

            fundraisingNewsRelatedToAccountMap = populateMaps([SELECT Id, Name,Account__c, Account__r.Name, Publish_Date__c FROM Dakota_News__c
                                                WHERE createddate >= :timeLimitBound
                                                AND Account__c IN :followedAccounts
                                                AND (Account__r.X100_Marketplace__c = true OR Account__r.X100_Everest__c = true)
                                                ], '');
            
            publicPlanMinuteRelatedToAccountMap = populateMaps([SELECT Id,Name,Account__c,Account__r.Name, Account__r.X100_Marketplace__c, Account__r.X100_Everest__c FROM Public_Plan_Minute__c
                                                WHERE createddate >= :timeLimitBound
                                                AND Account__c IN :followedAccounts
                                                AND (Account__r.X100_Marketplace__c = true OR Account__r.X100_Everest__c = true)
                                                ], '');
            childAccountsMap = populateMaps([SELECT id,name, Parent_Account__c,Parent_Account__r.Name FROM Account
                                                WHERE Parent_Account__c != null
                                                AND createddate >= :timeLimitBound
                                                AND Parent_Account__c IN :followedAccounts
                                                AND (X100_Marketplace__c = true OR X100_Everest__c = true)
                                                ], 'Child_Account');
            List<ContactHistory> contactsHistory2 = [SELECT id, ContactId,Contact.Marketplace_Verified_Contact__c,Contact.Name, field, OldValue, NewValue FROM ContactHistory 
                                                WHERE field = 'Email'
                                                AND createddate >= :timeLimitBound
                                                AND Contact.Marketplace_Verified_Contact__c = true
                                                AND ContactId IN :followedContacts];
            List<ContactHistory> emailChangesInContact = new List<ContactHistory>();
            for (ContactHistory history : contactsHistory2 ) {
                if(!(history.OldValue instanceof Id) && !(history.NewValue instanceof Id)) {
                    emailChangesInContact.add(history);
                }
            }
            emailChangesInContactMap = populateMaps(emailChangesInContact, '');
        } catch(Exception ex) {
            System.debug(ex.getMessage());
        }
   
   
        List<EmailTemplate> emailTemplate = [SELECT Id, Subject, Description, HtmlValue, DeveloperName, Body FROM EmailTemplate
                                            WHERE DeveloperName = :System.Label.Updates_on_followed_Accounts_and_Contacts];
        Map<Id,Email_Notification_Preferences__c> emailNotificationPrefMap = new  Map<Id, Email_Notification_Preferences__c>();
        List <Email_Notification_Preferences__c> emailNotificationPref = [SELECT Id, OwnerId, Account_Updates_Selection__c, Contact_Updates_Selection__c, Only_Weekly_Updates__c FROM Email_Notification_Preferences__c WHERE OwnerId IN :usersId] ;
        for (Email_Notification_Preferences__c pref : emailNotificationPref) {
            if (mapOfUserAndItsFollowedAcc.get(pref.OwnerId) != null || mapOfUserAndItsFollowedCon.get(pref.OwnerId) != null) {
                emailNotificationPrefMap.put(pref.OwnerId, pref);
            }
        } 

        if (emailTemplate.size() > 0 || Test.isRunningTest()) {
            Date today = System.today();
            String subject = (Test.isRunningTest())? 'test email subject' :  ('Dakota Marketplace Following Update - [' + today.month() + '/' + today.day() + '/' + today.year() + ']');
            for (Id userId: usersId) {
                String body =(Test.isRunningTest())? 'test email body' : emailTemplate.get(0).HtmlValue;
                body = body.replace('{!TodayText}', 'today');
                body = body.replace('{!Today}', today.month() + '/' + today.day() + '/' + today.year());
                String userName = '';
                String userEmail = '';
                List<String> followedConIds = mapOfUserAndItsFollowedCon.get(userId);
                List<String> lstFieldConsultant = new List<String>();
                List<String> lstAccFieldConsultant = new List<String>();
                Email_Notification_Preferences__c preferences = emailNotificationPrefMap.get(userId);
                Set<String> selectedContactValues;
                Set<String> selectedAccountValues;

                Boolean contactsPreferencesExist = false;
                Boolean accountsPreferencesExist = false;
                if (preferences?.Only_Weekly_Updates__c != true) {
                    if (preferences?.Contact_Updates_Selection__c != null) {
                        contactsPreferencesExist = true;
                        selectedContactValues = new Set<String>(preferences.Contact_Updates_Selection__c.split(';'));
                    }
                    if (preferences?.Account_Updates_Selection__c != null) {
                        accountsPreferencesExist = true;
                        selectedAccountValues = new Set<String>(preferences.Account_Updates_Selection__c.split(';'));
                    }
                    List<String> lstGoneChangesLines = new List<String>();
                    List<String> lstJobChangesLines = new List<String>();
                    List<String> lstRoleChangesLines = new List<String>();
                    List<String> lstAssetClassesLine = new List<String>();
                    List<String> lstDakotaContentLine = new List<String>();
                    List<String> lstContactEmailsLine = new List<String>();

                    if (followedConIds != null && followedConIds.size() > 0 ) {
                        for (String conId : followedConIds) {
                    
                            if ((contactsPreferencesExist && selectedContactValues.contains('Job Changes'))) {
                                List<Update__c> jobUpdates = jobChangeMap.get(conId);
                                if (jobUpdates != null && jobUpdates.size() > 0) {
                                    for (Update__c up : jobUpdates) {
                                        String firmJoined = up?.Firm_Joined__r?.Name != null ? up?.Firm_Joined__r?.Name : '';
                                        String firmLeft = up?.Firm_Left__r?.Name != null ? up?.Firm_Left__r?.Name : '';
                                        String contactName = up?.Contact__r?.Name != null ? up?.Contact__r?.Name : '';
                                        String jobChangeRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + up.id;
                                        String jobChangeLine = '';
                                        if (!String.isBlank(contactName) && (!String.isBlank(firmLeft) && !String.isBlank(firmJoined)) && !String.isBlank(jobChangeRecordLink)) {
                                            jobChangeLine = '<ul><li><b>' + contactName + '</b> has ' + (!String.isBlank(firmLeft) ? 'left <b>' + firmLeft + '</b>' : '') + ((!String.isBlank(firmLeft) && !String.isBlank(firmJoined)) ? ' and' : '' ) + (!String.isBlank(firmJoined) ? ' joined <b>' + firmJoined + '</b>' : '') + ' firm. <a href=' + jobChangeRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (jobChangeLine != '' && !lstJobChangesLines.contains(jobChangeLine)) {
                                            lstJobChangesLines.add(jobChangeLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                            if ((contactsPreferencesExist && selectedContactValues.contains('Role Changes'))) {
                                List<Update__c> roleUpdates = roleChagneMap.get(conId);
                                if (roleUpdates != null && roleUpdates.size() > 0) {
                                    for (Update__c up : roleUpdates) {
                                        String contactName = up?.Contact__r?.Name != null ? up?.Contact__r?.Name : '';
                                        String newTitle = up.New_Title__c != null ? up.New_Title__c : '';
                                        String oldTitle = up.Old_Title__c != null ? up.Old_Title__c : '';
                                        String roleChangeRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + up.id;
                                        String roleChangeLine = '';
                                        Boolean isGoneChange = false;
                                        Boolean marketPlaceVerified = up?.Contact__r?.Marketplace_Verified_Contact__c;
                                        if (!String.isBlank(contactName) && newTitle == 'GONE') {
                                            String accountName = up?.Contact__r?.Account.Name;
                                            isGoneChange = true;
                                            roleChangeLine = '<ul><li><b>' + contactName + '</b> has left' + (!String.isBlank(accountName) ? ' <b>' + accountName + '</b>,' : '') + ' their new role is currently unknown.</ul>';
                                        } else if (marketPlaceVerified == true && !String.isBlank(contactName) && oldTitle == 'GONE' && newTitle != 'GONE') {
                                            isGoneChange = true;
                                            String accountName = up?.Contact__r?.Account.Name;
                                            roleChangeLine = '<ul><li><b>' + contactName + '</b> has joined' + (!String.isBlank(accountName) ? ' <b>' + accountName + '</b>' : '') + (!String.isBlank(newTitle) ? ', their new role is <b>' + newTitle + '</b>' : '') + '.</ul>';
                                        } else if (marketPlaceVerified == true && !String.isBlank(contactName) && (!String.isBlank(newTitle) || !String.isBlank(oldTitle)) && !String.isBlank(roleChangeRecordLink)) {
                                            roleChangeLine = '<ul><li><b>' + contactName + '</b> has been promoted' + (!String.isBlank(newTitle) ? ' to <b>' + newTitle + '</b>' : '') +(!String.isBlank(oldTitle) ? ' from their previous role as <b>' + oldTitle + '</b>' : '') + '. <a href=' + roleChangeRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';                                    }
                                        if (isGoneChange == true && roleChangeLine != '' && !lstGoneChangesLines.contains(roleChangeLine)) {
                                            lstGoneChangesLines.add(roleChangeLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        } else if (isGoneChange == false && roleChangeLine != '' && !lstRoleChangesLines.contains(roleChangeLine)) {
                                            lstRoleChangesLines.add(roleChangeLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                            if ((contactsPreferencesExist && selectedContactValues.contains('Asset Class Coverage'))) {
                                List<ContactHistory> contHistoryList = assetClassChangesInContactMap.get(conId);
                                if (contHistoryList != null && contHistoryList.size() > 0) {
                                    for (ContactHistory contHist : contHistoryList) {
                                        String contName = contHist?.Contact?.Name != null ? contHist.Contact.Name : '';
                                        String newAssetClassCoverage = contHist?.NewValue != null ? String.valueOf(contHist.NewValue) : '';
                                        String oldAssetClassCoverage = contHist?.OldValue != null ? String.valueOf(contHist.OldValue) : '';
                                        String contLink = System.Label.Marketplace_Community_Base_URL+'detail/' + contHist.ContactId;
                                        String assetClassChangeLine = '';
                                        if (!String.isBlank(contName) && (!String.isBlank(newAssetClassCoverage) || !String.isBlank(oldAssetClassCoverage)) && !String.isBlank(contLink)) {
                                            assetClassChangeLine = '<ul><li><b>' + contName + '</b> has had a change to their asset class coverage. <a href=' + contLink  + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (assetClassChangeLine != '' && !lstAssetClassesLine.contains(assetClassChangeLine)) {
                                            lstAssetClassesLine.add(assetClassChangeLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                            if ((contactsPreferencesExist && selectedContactValues.contains('Email Changes'))) {
                                List<ContactHistory> contHistoryList2 = emailChangesInContactMap.get(conId);
                                if (contHistoryList2 != null && contHistoryList2.size() > 0) {
                                    for (ContactHistory contHist : contHistoryList2) {
                                        String contName = contHist?.Contact?.Name != null ? contHist.Contact.Name : '';
                                        String newEmail = contHist?.NewValue != null ? String.valueOf(contHist.NewValue) : '';
                                        String oldEmail = contHist?.OldValue != null ? String.valueOf(contHist.OldValue) : '';
                                        String contLink = System.Label.Marketplace_Community_Base_URL+'detail/' + contHist.ContactId;
                                        String emailChangeLine = '';
                                        if (!String.isBlank(contName) && (!String.isBlank(newEmail) || !String.isBlank(oldEmail)) && !String.isBlank(contLink)) {
                                            emailChangeLine = '<ul><li><b>' + contName + '</b> has had a change in their email address<br>&emsp;<b>New Value:</b> '+newEmail+'<br>&emsp;<b>Old Value:</b> '+oldEmail+'<br>&emsp;<a href=' + contLink  + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (emailChangeLine != '' && !lstContactEmailsLine.contains(emailChangeLine)) {
                                            lstContactEmailsLine.add(emailChangeLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                            if ((contactsPreferencesExist && selectedContactValues.contains('Dakota Content'))) {
                                List<Dakota_Content__c> dakotaContentList = dakotaContentRelatedToContact.get(conId);
                                if (dakotaContentList != null && dakotaContentList.size() > 0) {
                                    for (Dakota_Content__c dakotaContent : dakotaContentList) {
                                        String contName = dakotaContent?.Contact_Linked__r?.Name != null ? dakotaContent?.Contact_Linked__r?.Name : '';
                                        String dakotaContentName = dakotaContent?.Dakota_Live_Call__r?.Name != null ? dakotaContent?.Dakota_Live_Call__r?.Name : '';
                                        String dakotaContentRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + dakotaContent.id;
                                        String dakotaContentLine = '';
                                        if (!String.isBlank(contName) && !String.isBlank(dakotaContentName) && !String.isBlank(dakotaContentRecordLink)) {
                                            dakotaContentLine = '<ul><li><b>' + contName + '</b> has been featured on <b>' + dakotaContentName + '</b>. <a href=' + dakotaContentRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';                                    }
                                        if (dakotaContentLine != '' && !lstDakotaContentLine.contains(dakotaContentLine)) {
                                            lstDakotaContentLine.add(dakotaContentLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                            if ((contactsPreferencesExist && selectedContactValues.contains('Field Consultants'))) {
                                List<AccountContactRelation> fieldConsultantListList = fieldConsultantContactMap.get(conId);
                                if (fieldConsultantListList != null && fieldConsultantListList.size() > 0) {
                                    for (AccountContactRelation fieldConsultant : fieldConsultantListList) {  
                                        String contName = fieldConsultant?.Contact?.Name != null ? fieldConsultant?.Contact?.Name : '';
                                        String fieldConsultantAccountName =fieldConsultant?.Account?.Name != null ? fieldConsultant?.Account.Name : '';
                                        String fieldConsultantRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + fieldConsultant.ContactId;
                                        String fieldConsultantLine = '';

                                        if (!String.isBlank(contName) && !String.isBlank(fieldConsultantAccountName) && !String.isBlank(fieldConsultantRecordLink)) {
                                            fieldConsultantLine = '<ul><li><b>' + contName + '</b> has been tagged as a field consultant on <b>' + fieldConsultantAccountName + '</b>. <a href=' + fieldConsultantRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';                                    }
                                        if (fieldConsultantLine != '' && !lstFieldConsultant.contains(fieldConsultantLine)) {
                                            lstFieldConsultant.add(fieldConsultantLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                
                    
                    List<String> followedAccId = mapOfUserAndItsFollowedAcc.get(userId);
                    List<String> lstFirmJoined = new List<String>();
                    List<String> lstFirmLeft = new List<String>();
                    List<String> lstClientBase = new List<String>();
                    List<String> lstInvestments = new List<String>();
                    List<String> lstInvestmentsRelatedToInvFirmAcc = new List<String>();
                    List<String> lstConsultants = new List<String>();
                    List<String> lstPerformance = new List<String>();
                    List<String> lstInvStr = new List<String>();
                    List<String> lisManagerPres = new List<String>();
                    List<String> listPublicPlanMinutes = new List<String>();
                    List<String> listchildAcc = new List<String>();
                    List<String> lstAccAUM = new List<String>();
                    List<String> lstAccCustodian = new List<String>();                 
                    List<String> listFundraisaing = new List<String>();
                    


                    if (followedAccId != null && followedAccId.size() > 0) {
                        for (String accId : followedAccId) {
                            if ((accountsPreferencesExist && selectedAccountValues.contains('Contacts'))) {
                                List<Update__c> tempAccConFirmJoined= accConFirmJoinedMap.get(accId);
                                if (tempAccConFirmJoined != null && tempAccConFirmJoined.size() > 0) {
                                    for (Update__c up : tempAccConFirmJoined) {
                                        String firmJoined = up?.Firm_Joined__r?.Name != null ? up?.Firm_Joined__r?.Name : '';
                                        String firmLeft = up?.Firm_Left__r?.Name != null ? up?.Firm_Left__r?.Name : '';
                                        String contactName = up?.Contact__r?.Name != null ? up?.Contact__r?.Name : '';
                                        String accConFirmJoinedRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + up.id;
                                        String firmJoinedLine = '';
                                        if (!String.isBlank(contactName) && !String.isBlank(firmJoined) && !String.isBlank(accConFirmJoinedRecordLink)) {
                                            firmJoinedLine = '<ul><li><b>' + firmJoined + '</b> has had an update at the contact level: <b>' + contactName + '</b>'+ (!String.isBlank(firmJoined) ? ' has joined <b>' + firmJoined + '</b>' : '') + ((!String.isBlank(firmLeft) && !String.isBlank(firmJoined)) ? ' and' : '' ) + (!String.isBlank(firmLeft) ? ' was previously at <b>'+ firmLeft + '</b>' : '') + '. <a href=' + accConFirmJoinedRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';                                    }
                                        if (firmJoinedLine != '' && !lstFirmJoined.contains(firmJoinedLine)) {
                                            lstFirmJoined.add(firmJoinedLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    } 
                                }

                                List<Update__c> tempAccConFirmLeft= accConFirmLeftMap.get(accId);
                                if (tempAccConFirmLeft != null && tempAccConFirmLeft.size() > 0) {
                                    for (Update__c up : tempAccConFirmLeft) {
                                        String firmJoined = up?.Firm_Joined__r?.Name != null ? up?.Firm_Joined__r?.Name : '';
                                        String firmLeft = up?.Firm_Left__r?.Name != null ? up?.Firm_Left__r?.Name : '';
                                        String contactName = up?.Contact__r?.Name != null ? up?.Contact__r?.Name : '';
                                        String accConFirmLeftRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + up.id;
                                        String firmLeftLine = '';
                                        if (!String.isBlank(contactName) && !String.isBlank(firmLeft) && !String.isBlank(accConFirmLeftRecordLink)) {
                                            firmLeftLine = '<ul><li><b>' + firmLeft + '</b> has had an update at the contact level: <b>' + contactName + '</b> has left <b>' + firmLeft +'</b>' + (!String.isBlank(firmJoined) ? ' and joined <b>'+ firmJoined + '</b>' : '') + '. <a href=' + accConFirmLeftRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';                                    }
                                        if (firmLeftLine != '' && !lstFirmLeft.contains(firmLeftLine)) {
                                            lstFirmLeft.add(firmLeftLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    } 
                                }
                            }
                            if ((accountsPreferencesExist && selectedAccountValues.contains('Client Base'))) {
                                List<Client_Base__c> clientBaseList = clientBaseUpdateMap.get(accId);
                                if (clientBaseList != null && clientBaseList.size() > 0) {
                                    for (Client_Base__c cb : clientBaseList ) {
                                        String accountName = cb?.Account__r?.Name != null ? cb?.Account__r?.Name : '';
                                        String clientBaseName = cb?.Name != null ? cb.Name : '';
                                        String clientBaseRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + cb.id;
                                        String clientBaseLine = '';
                                        if (!String.isBlank(accountName) && !String.isBlank(clientBaseName) && !String.isBlank(clientBaseRecordLink)) {
                                            clientBaseLine = '<ul><li><b>' + accountName + '</b> has added a new client to their client base. <b>' + clientBaseName + '</b>, is now appearing on the client base list for <b>' + accountName +'</b>. <a href=' + clientBaseRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';                                    }
                                        if (clientBaseLine != '' && !lstClientBase.contains(clientBaseLine)) {
                                            lstClientBase.add(clientBaseLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    } 
                                }
                            }

                            if ((accountsPreferencesExist && selectedAccountValues.contains('Investments'))) {
                                List<Investment__c> invList = investmentsInAccountMap.get(accId);
                                if (invList !=null && invList.size()>0) {
                                    if (invList.size() <= 5) {
                                        for (Investment__c inv : invList ) {
                                            String accountName = inv?.Account__r?.Name != null ? inv?.Account__r?.Name : '';
                                            Decimal fundAmount = inv?.Fund_Balance__c != null ? inv.Fund_Balance__c : 0;
                                            string invAmount = String.valueOf(fundAmount.format());
                                            String investmentRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + inv.id;
                                            String investmentName = inv?.Investment_Strategy__r?.Name != null ? inv?.Investment_Strategy__r?.Name : '';
                                            String investmentLine = '';
                                            if (!String.isBlank(accountName) && !String.isBlank(investmentRecordLink)) {
                                                investmentLine = '<ul><li><b>' + accountName + '</b> has invested' + (inv?.Fund_Balance__c != null ? ' <b>$' + invAmount + '</b>' : '') + (!String.isBlank(investmentName) ? ' in <b>' + investmentName + '</b>' : '') + '. <a href=' + investmentRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                            }
                                            if (investmentLine != '' && !lstInvestments.contains(investmentLine)) {
                                                lstInvestments.add(investmentLine);
                                                if (usersMap.get(userId) != null) {
                                                    userName = usersMap.get(userId)?.Name;
                                                    userEmail = usersMap.get(userId)?.Email;
                                                }
                                            }
                                        } 
                                    } else {
                                        TimeZone currentUserTimeZone = UserInfo.getTimezone();
                                        Integer currentUserTimeZoneOffset = currentUserTimeZone.getOffset(System.Now()) / 1000;
                                        String createddate = String.valueOf(timeLimitBound.addSeconds(-currentUserTimeZoneOffset))?.replace(' ', ':');
                                        String accountName = invList[0]?.Account__r?.Name != null ? invList[0]?.Account__r?.Name : '';
                                        Decimal fundAmount = invList[0]?.Fund_Balance__c != null ? invList[0].Fund_Balance__c : 0;
                                        string invAmount = String.valueOf(fundAmount.format());
                                        String investmentName = invList[0]?.Investment_Strategy__r?.Name != null ? invList[0]?.Investment_Strategy__r?.Name : '';
                                        String investmentLine = '';
                                        String investmentRecordLink = System.Label.Marketplace_Community_Base_URL+'view-accountrelatedinvestments?recordId='+accId+'&listType=Public%20Investment&isInvestmentUpdate=True&createddate='+createddate;
                                        investmentLine = '<ul><li><b>' + accountName + '</b> has new Investments. ' + '<a href=' + investmentRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        if (investmentLine != '' && !lstInvestments.contains(investmentLine)) {
                                            lstInvestments.add(investmentLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }

                                List<Investment__c> invListInvFirmAcc = publicInvInInvestmentFirmAccountMap.get(accId);
                            
                                if (invListInvFirmAcc != null && invListInvFirmAcc.size() > 0) {
                                    String accountName = invListInvFirmAcc[0]?.Investment_Strategy__r.Account__r?.Name;
                                    TimeZone currentUserTimeZone = UserInfo.getTimezone();
                                    Integer currentUserTimeZoneOffset = currentUserTimeZone.getOffset(System.Now()) / 1000;
                                    String createddate = String.valueOf(timeLimitBound.addSeconds(-currentUserTimeZoneOffset))?.replace(' ', ':');
                                    if(invListInvFirmAcc.size() <= 5) {
                                        for (Investment__c inv : invListInvFirmAcc ) {
                                            String investmentRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + inv.id;
                                            String investmentName = inv?.Name != null ? inv?.Name : '';
                                            String invAccount =  inv?.Account__r.Name != null ? inv?.Account__r.Name : '';
                                            String invStrName = inv?.Investment_Strategy__r?.Name != null ? inv?.Investment_Strategy__r?.Name : '';
                                            String investmentLine = '';
                                            if (!String.isBlank(accountName) && !String.isBlank(investmentRecordLink)) {
                                            investmentLine = '<ul><li><b>' + accountName + '</b> has received a new investment from <b>' + invAccount +'</b> in their <b>'+invStrName+'</b>. <a href=' + investmentRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                            }
                                            if (investmentLine != '' && !lstInvestmentsRelatedToInvFirmAcc.contains(investmentLine)) {
                                                lstInvestmentsRelatedToInvFirmAcc.add(investmentLine);
                                                if (usersMap.get(userId) != null) {
                                                    userName = usersMap.get(userId)?.Name;
                                                    userEmail = usersMap.get(userId)?.Email;
                                                }
                                            }
                                        } 
                                    } else {
                                        String publicInvLink = System.Label.Marketplace_Community_Base_URL+'view-accountrelatedinvestments?recordId='+accId+'&listType=Public%20Investment&fromFollowEmailPubicInv=True&createddate='+createddate;
                                        String invLine = '';
                                        invLine = '<ul><li><b>' + accountName + '</b> has new Investments. <a href=' + publicInvLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        if (invLine != '' && !lstInvestmentsRelatedToInvFirmAcc.contains(invLine)) {
                                            lstInvestmentsRelatedToInvFirmAcc.add(invLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            if ((accountsPreferencesExist && selectedAccountValues.contains('Consultants'))) {  
                                List<AccountHistory> acchistList = consultantAccountsMap.get(accId);
                                if (acchistList != null && acchistList.size() > 0) {
                                    for (AccountHistory acchist : acchistList ) {
                                        String accName = acchist?.Account?.Name != null ? acchist.Account.Name : '';
                                        String newConsultant = acchist?.NewValue != null ? String.valueOf(acchist.NewValue) : '';
                                        String oldConsultant = acchist?.OldValue != null ? String.valueOf(acchist.OldValue) : '';
                                        String accLink = System.Label.Marketplace_Community_Base_URL+'detail/' + acchist.AccountId;
                                        String consultantLine = '';

                                        if (!String.isBlank(accName) && (!String.isBlank(oldConsultant) || !String.isBlank(newConsultant)) && !String.isBlank(accLink)) {
                                            consultantLine = '<ul><li><b>' + accName + '</b> has had a change to their consultants<br>&emsp;<b>New Value: </b>' + (!String.isBlank(newConsultant) ? newConsultant : '') + '<br>&emsp;<b>Old Value: </b>'+ (!String.isBlank(oldConsultant) ? oldConsultant : '') +'<br>&emsp;<a href=' + accLink + ' target="_blank">Click</a> to view all consultant coverage for <b>'+ accName + '</b> in Marketplace.</ul>';
                                        }
                                        if (consultantLine != '' && !lstConsultants.contains(consultantLine)) {
                                            lstConsultants.add(consultantLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }

                            if ((accountsPreferencesExist && selectedAccountValues.contains('Performance'))) {
                                List<Performance__c> performanceList = performanceRelatedToAccount.get(accId);
                                if (performanceList != null && performanceList.size() > 0) {
                                    for (Performance__c invStr : performanceList ) {
                                        String accountName = invStr?.Account__r?.Name != null ? invStr?.Account__r?.Name : '';
                                        String invStrName = invStr?.Name != null ? invStr.Name : '';
                                        String invStrRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + invStr.id;
                                        String invStrLine = '';
                                        if (!String.isBlank(accountName) && !String.isBlank(invStrName) && !String.isBlank(invStrRecordLink)) {
                                            invStrLine = '<ul><li><b>' + accountName + '</b> has had performance data added to their fund <b>' + invStrName +'</b>. <a href=' + invStrRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (invStrLine != '' && !lstPerformance.contains(invStrLine)) {
                                            lstPerformance.add(invStrLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    } 
                                }
                            }

                            if ((accountsPreferencesExist && selectedAccountValues.contains('New Funds'))) {
                                List<Investment_Strategy__c> invStrList = investmentStrategyRelatedToAccount.get(accId);
                                if (invStrList != null && invStrList.size() > 0) {
                                    for (Investment_Strategy__c invStr : invStrList ) {
                                        String accountName = invStr?.Account__r?.Name != null ? invStr?.Account__r?.Name : '';
                                        String invStrName = invStr?.Name != null ? invStr.Name : '';
                                        String invStrRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + invStr.id;
                                        String invStrLine = '';
                                        if (!String.isBlank(accountName) && !String.isBlank(invStrName) && !String.isBlank(invStrRecordLink)) {
                                            invStrLine = '<ul><li><b>' + accountName + '</b> has had new funds identified by Dakota. <a href=' + invStrRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (invStrLine != '' && !lstInvStr.contains(invStrLine)) {
                                            lstInvStr.add(invStrLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    } 
                                }
                            }

                            if ((accountsPreferencesExist && selectedAccountValues.contains('Presentation Deck'))) {
                                List<Manager_Presentation__c> managerPresentationList = managerPresentationRelatedToAccount.get(accId);
                                if (managerPresentationList != null && managerPresentationList.size() > 0) {
                                    for (Manager_Presentation__c managerPres : managerPresentationList ) {
                                        String accountName = managerPres?.Account_Name__c != null ? managerPres?.Account_Name__c : '';
                                        String managerPresName = managerPres?.Name != null ? managerPres.Name : '';
                                        String managerPresRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + managerPres.id;
                                        String managerPresLine = '';
                                        if (!String.isBlank(accountName) && !String.isBlank(managerPresName) && !String.isBlank(managerPresRecordLink)) {
                                            managerPresLine = '<ul><li><b>' + accountName + '</b> has had a new presentation deck added to their account. <a href=' + managerPresRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (managerPresLine != '' && !lisManagerPres.contains(managerPresLine)) {
                                            lisManagerPres.add(managerPresLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    } 
                                }
                                List<Manager_Presentation__c> managerPresentationConsultantList = managerPresentationConsultantRelatedToAccount.get(accId);
                                if (managerPresentationConsultantList != null && managerPresentationConsultantList.size() > 0) {
                                    for (Manager_Presentation__c managerPres : managerPresentationConsultantList ) {
                                        String accountName = managerPres?.Consultant__c != null ? managerPres?.Consultant__r?.Name : '';
                                        String managerPresName = managerPres?.Name != null ? managerPres.Name : '';
                                        String managerPresRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + managerPres.id;
                                        String managerPresLine = '';
                                        if (!String.isBlank(accountName) && !String.isBlank(managerPresName) && !String.isBlank(managerPresRecordLink)) {
                                            managerPresLine = '<ul><li><b>' + accountName + '</b> has had a new presentation deck added to their account. <a href=' + managerPresRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (managerPresLine != '' && !lisManagerPres.contains(managerPresLine)) {
                                            lisManagerPres.add(managerPresLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    } 
                                }
                                List<Manager_Presentation__c> managerPresentationPPFList = managerPresentationPPFRelatedToAccount.get(accId);
                                if (managerPresentationPPFList != null && managerPresentationPPFList.size() > 0) {
                                    for (Manager_Presentation__c managerPres : managerPresentationPPFList ) {
                                        String accountName = managerPres?.Public_Pension_Fund__c != null ? managerPres?.Public_Pension_Fund__r?.Name : '';
                                        String managerPresName = managerPres?.Name != null ? managerPres.Name : '';
                                        String managerPresRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + managerPres.id;
                                        String managerPresLine = '';
                                        if (!String.isBlank(accountName) && !String.isBlank(managerPresName) && !String.isBlank(managerPresRecordLink)) {
                                            managerPresLine = '<ul><li><b>' + accountName + '</b> has had a new presentation deck added to their account. <a href=' + managerPresRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (managerPresLine != '' && !lisManagerPres.contains(managerPresLine)) {
                                            lisManagerPres.add(managerPresLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    } 
                                }
                            }

                            if ((accountsPreferencesExist && selectedAccountValues.contains('Public Plan Minutes'))) {
                                List<Public_Plan_Minute__c> lstPublicPlanMinutes = publicPlanMinuteRelatedToAccountMap.get(accId);
                                if (lstPublicPlanMinutes != null && lstPublicPlanMinutes.size() > 0) {
                                    for (Public_Plan_Minute__c publicPlanMinutes : lstPublicPlanMinutes) {
                                        String accName = publicPlanMinutes?.Account__r?.Name != null ? publicPlanMinutes?.Account__r?.Name : '';
                                        String publicPlanMinutesRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + publicPlanMinutes.id;
                                        String publicPlanMinutesLine = '';
                                        if (!String.isBlank(accName) && !String.isBlank(publicPlanMinutesRecordLink)) {
                                            publicPlanMinutesLine = '<ul><li><b>' + accName + '</b> has new Public Plan Minutes added. <a href=' + publicPlanMinutesRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (publicPlanMinutesLine != '' && !listPublicPlanMinutes.contains(publicPlanMinutesLine)) {
                                            listPublicPlanMinutes.add(publicPlanMinutesLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }

                            if ((accountsPreferencesExist && selectedAccountValues.contains('Child Accounts'))) {
                                List<Account> childAccList = childAccountsMap.get(accId);
                                if (childAccList != null && childAccList.size() > 0) {
                                    for (Account acc : childAccList) {
                                        String accName = acc?.Parent_Account__r?.Name != null ? acc?.Parent_Account__r?.Name : '';
                                        String accLine = '';
                                        String parentAccountRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + acc?.Parent_Account__c;
                                        accLine = '<ul><li><b>' + accName + '</b> has new child accounts identified. <a href=' + parentAccountRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        if (accLine != '' && !listchildAcc.contains(accLine)) {
                                            listchildAcc.add(accLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                        
                            if ((accountsPreferencesExist && selectedAccountValues.contains('AUM'))) {
                                List<AccountHistory> accAUMhistList = accountAUMUpdatesMap.get(accId);
                                if (accAUMhistList != null && accAUMhistList.size() > 0) {
                                    for (AccountHistory acchist : accAUMhistList ) {
                                        String accName = acchist?.Account?.Name != null ? acchist.Account.Name : '';
                                        String newAUM = acchist?.NewValue != null ? '$' + formatCurrencyString(String.valueOf(acchist.NewValue)) : '';
                                        String accLink = System.Label.Marketplace_Community_Base_URL+'detail/' + acchist.AccountId;
                                        String AUMLine = '';
                                        AUMLine = '<ul><li><b>' + accName + '</b> has an updated AUM, the new AUM is <b>' + (!String.isBlank(newAUM) ? newAUM : '') + '</b>. <a href=' + accLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        if (AUMLine != '' && !lstAccAUM.contains(AUMLine)) {
                                            lstAccAUM.add(AUMLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }

                            if ((accountsPreferencesExist && selectedAccountValues.contains('Custodian'))) {
                                List<Update__c> accCustodianHistList = accountCustodianUpdatesMap.get(accId);
                                if (accCustodianHistList != null && accCustodianHistList.size() > 0) {
                                    for (Update__c accCustodianChangeRec : accCustodianHistList ) {
                                        String accName = accCustodianChangeRec?.Account__r?.Name != null ? accCustodianChangeRec.Account__r.Name : '';
                                        String newCustodian = accCustodianChangeRec?.New_Value__c != null ? String.valueOf(accCustodianChangeRec?.New_Value__c) : '';
                                        String oldCustodian = accCustodianChangeRec?.Old_Value__c != null ? String.valueOf(accCustodianChangeRec?.Old_Value__c) : '';
                                        String accLink = System.Label.Marketplace_Community_Base_URL+'detail/' + accCustodianChangeRec.Account__c;
                                        String custodianLine = '';
                                        String oldValue = !String.isBlank(oldCustodian) ? String.join(oldCustodian?.split(';'), '; ') : '';
                                        String newValue = !String.isBlank(newCustodian) ? String.join(newCustodian?.split(';'), '; '): '';
                                        custodianLine = '<ul><li><b>' + accName + '</b> has had a change in their custodian<br>&emsp;<b>New Value:</b> ' + newValue + '<br>&emsp;<b>Old Value:</b> ' + oldValue + '<br>&emsp;<a href=' + accLink  + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        if (custodianLine != '' && !lstAccCustodian.contains(custodianLine)) {
                                            lstAccCustodian.add(custodianLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }

                            if ((accountsPreferencesExist && selectedAccountValues.contains('Field Consultants'))) {
                                List<AccountContactRelation> fieldConsultantAccountList = fieldConsultantAccountMap.get(accId);
                                if (fieldConsultantAccountList != null && fieldConsultantAccountList.size() > 0) {
                                    for (AccountContactRelation fieldConsultant : fieldConsultantAccountList) {
                                        String accName = fieldConsultant?.Account?.Name != null ? fieldConsultant?.Account?.Name : '';
                                        String fieldConsultantRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + fieldConsultant.AccountId;
                                        String fieldConsultantLine = '';

                                        if (!String.isBlank(accName) && !String.isBlank(fieldConsultantRecordLink)) {
                                            fieldConsultantLine = '<ul><li><b>' + accName + '</b> has a new field consultant tagged to their account. <a href=' + fieldConsultantRecordLink + ' target="_blank">Click</a> to view in Marketplace.</ul>';
                                        }
                                        if (fieldConsultantLine != '' && !lstAccFieldConsultant.contains(fieldConsultantLine)) {
                                            lstAccFieldConsultant.add(fieldConsultantLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            if ((accountsPreferencesExist && selectedAccountValues.contains('Fundraising News'))) {
                                List<Dakota_News__c> fundraisingNewsList = fundraisingNewsRelatedToAccountMap.get(accId);
                                if (fundraisingNewsList != null && fundraisingNewsList.size() > 0) {
                                    for (Dakota_News__c fundrais : fundraisingNewsList) {
                                        String fundraisName = fundrais?.Name != null ? fundrais?.Name : '';
                                        String accName = fundrais?.Account__r?.Name != null ? fundrais?.Account__r?.Name : '';
                                        String fundraisRecordLink = System.Label.Marketplace_Community_Base_URL+'detail/' + fundrais.Id;

                                        String fundraisLine = '';
                                        fundraisLine = '<ul><li><b>' + accName + '</b> has been mentioned in the following fundraising news post: <br> <a href=' + fundraisRecordLink + ' target="_blank">'+fundraisName+'</a></ul>';
                                        if (fundraisLine != '' && !listFundraisaing.contains(fundraisLine)) {
                                            listFundraisaing.add(fundraisLine);
                                            if (usersMap.get(userId) != null) {
                                                userName = usersMap.get(userId)?.Name;
                                                userEmail = usersMap.get(userId)?.Email;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Boolean isEmailValid = false;
                    if (followedConIds != null && followedConIds.size() > 0) {
                        List <String> tempArray = new List<String>();
                        tempArray.addAll(lstGoneChangesLines);
                        tempArray.addAll(lstRoleChangesLines);
                        lstRoleChangesLines = tempArray;

                        if (lstJobChangesLines.size() > 0 || lstRoleChangesLines.size() > 0 || lstDakotaContentLine.size() > 0 || lstAssetClassesLine.size() > 0 || lstContactEmailsLine.size() > 0 
                            || lstFieldConsultant.size() > 0 || lstAccFieldConsultant.size() > 0 ) {
                            String finalContactUpdates = '<h2>Contact Updates:</h2>' + (lstJobChangesLines.size() > 0 ? String.join(lstJobChangesLines, '') : '')
                            + (lstRoleChangesLines.size() > 0 ? String.join(lstRoleChangesLines, '')  : '')
                            + (lstContactEmailsLine.size() > 0 ? String.join(lstContactEmailsLine, '')  : '')
                            + (lstAssetClassesLine.size() > 0 ? String.join(lstAssetClassesLine, '')  : '')
                            + (lstDakotaContentLine.size() > 0 ? String.join(lstDakotaContentLine, '')  : '')
                            + (lstFieldConsultant.size() > 0 ? String.join(lstFieldConsultant, '')  : '')
                            + (lstAccFieldConsultant.size() > 0 ? String.join(lstAccFieldConsultant, '')  : '');
                            isEmailValid = true;
                            body = finalContactUpdates != '' ? body.replace('{Contact_Updates}', finalContactUpdates): '';
                            body = body.replace('{Field_Consultant}', '');
                        } else {
                            body = body.replace('{Contact_Updates}', '');
                            body = body.replace('{Field_Consultant}', '');
                        }
                    } else {
                        body = body.replace('{Contact_Updates}', '');
                        body = body.replace('{Field_Consultant}', '');
                    }

                    if (followedAccId != null && followedAccId.size() > 0) {
                        if (lstInvestmentsRelatedToInvFirmAcc.size() > 0 || lstPerformance.size() > 0 || lstInvStr.size() > 0 || lisManagerPres.size() > 0) {
                            String finalInvFirmAccountUpdates = '<h2>Investment Firm Notifications:</h2>' + (lstInvestmentsRelatedToInvFirmAcc.size() > 0 ? String.join(lstInvestmentsRelatedToInvFirmAcc, '') : '') 
                            + (lstPerformance.size() > 0 ? String.join(lstPerformance, '') : '')
                            + (lstInvStr.size() > 0 ? String.join(lstInvStr, '') : '')
                            + (lisManagerPres.size() > 0 ? String.join(lisManagerPres, '') : '');
                            body = finalInvFirmAccountUpdates != '' ? body.replace('{Investment_Firm_Notifications}', finalInvFirmAccountUpdates): '';
                            isEmailValid = true;
                        } else {
                            body = body.replace('{Investment_Firm_Notifications}', '');
                        }

                        if (lstFirmJoined.size() > 0 || lstFirmLeft.size() > 0 || lstClientBase.size() > 0 || 
                        lstInvestments.size() > 0 || lstConsultants.size() > 0 || 
                        listPublicPlanMinutes.size() > 0 || listchildAcc.size() > 0 || 
                        lstAccAUM.size() > 0 || lstAccCustodian.size() > 0 || listFundraisaing.size() > 0 ) {
                            String finalAccountUpdates = '<h2>Account Updates:</h2>' + ((lstFirmJoined.size() > 0 || lstFirmLeft.size() > 0) ? String.join(lstFirmJoined, '') + String.join(lstFirmLeft, '') : '') 
                            + (lstClientBase.size() > 0 ? String.join(lstClientBase, '') : '')
                            + (lstInvestments.size() > 0 ? String.join(lstInvestments, '') : '')
                            + (lstConsultants.size() > 0 ? String.join(lstConsultants, '') : '')
                            + (listPublicPlanMinutes.size() > 0 ? String.join(listPublicPlanMinutes, '') : '')
                            + (listchildAcc.size() > 0 ? String.join(listchildAcc, '') : '')
                            + (lstAccAUM.size() > 0 ? String.join(lstAccAUM, '') : '')
                            + (lstAccCustodian.size() > 0 ? String.join(lstAccCustodian, '') : '')
                            + (listFundraisaing.size() > 0 ? String.join(listFundraisaing, '') : '');

                            body = finalAccountUpdates != '' ? body.replace('{Account_Updates}', finalAccountUpdates): '';
                            isEmailValid = true;
                        } else {
                            body = body.replace('{Account_Updates}', '');
                        }
                    } else {
                        body = body.replace('{Investment_Firm_Notifications}', '');
                        body = body.replace('{Account_Updates}', '');
                    }

                    if (!String.isBlank(userName)) {
                        body = body.replace('{!FirstName}', userName);
                    }
                    if ((accConFirmJoinedMap.keySet().size() > 0 ||
                        accConFirmLeftMap.keySet().size() > 0 ||
                        jobChangeMap.keySet().size() > 0 ||
                        roleChagneMap.keySet().size() > 0 ||
                        clientBaseUpdateMap.keySet().size() > 0 ||
                        investmentsInAccountMap.keySet().size() > 0 ||
                        consultantAccountsMap.keySet().size() > 0 ||
                        performanceRelatedToAccount.keySet().size() > 0 ||
                        investmentStrategyRelatedToAccount.keySet().size() > 0 ||
                        managerPresentationRelatedToAccount.keySet().size() > 0 ||
                        publicInvInInvestmentFirmAccountMap.keySet().size() > 0 ||
                        assetClassChangesInContactMap.keySet().size() > 0 ||
                        dakotaContentRelatedToContact.keySet().size() > 0 ||
                        fieldConsultantContactMap.keySet().size() > 0 ||
                        fieldConsultantAccountMap.keySet().size() > 0 ||
                        fundraisingNewsRelatedToAccountMap.keySet().size() > 0 ||
                        childAccountsMap.keySet().size() > 0 ||
                        accountAUMUpdatesMap.keySet().size() > 0 ||
                        accountCustodianUpdatesMap.keySet().size() > 0 ||
                        publicPlanMinuteRelatedToAccountMap.keySet().size() > 0) && String.isNotBlank(userEmail) && isEmailValid == true) {
                            mapOfUserEmailToEmailBody.put(userEmail, body);
                    }
                }
            }

            List<Messaging.SingleEmailMessage> emailList = new List<Messaging.SingleEmailMessage>();
            List<OrgWideEmailAddress> fromEmail;
            try {
                fromEmail = [SELECT Id, Address, DisplayName FROM OrgWideEmailAddress WHERE DisplayName='Dakota Marketplace'];
            } catch (Exception ex) {
                System.debug(ex.getMessage() + ex.getStackTraceString());
            }
            if (fromEmail?.size() > 0) {
                for (String recipient : mapOfUserEmailToEmailBody.keySet()) {
                    Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                    email.setOrgWideEmailAddressId(fromEmail[0].Id);
                    email.setToAddresses(new String[]{recipient});
                    email.setSubject(subject);
                    email.setPlainTextBody(mapOfUserEmailToEmailBody.get(recipient));
                    email.setHtmlBody(mapOfUserEmailToEmailBody.get(recipient));
                    emailList.add(email);
                }
            }

            Messaging.SendEmailResult[] sendResults = Messaging.sendEmail(emailList);
            for (Messaging.SendEmailResult result : sendResults) {
                if (result.isSuccess()) {
                    System.debug('Email sent successfully ');
                } else {
                    System.debug('Failed to send email. Error: ' + result.getErrors()[0].getMessage());
                }
            }
        }
    }

    public void finish(Database.BatchableContext bc){

    }

    
    public static String formatCurrencyString(String value) {
        Decimal decimalValue = Decimal.valueOf(value);
        return  decimalValue.format();
    }

    public static Map<Id,List<sObject>> populateMaps(List<sObject> relatedLists,String UpdateType) {
        Map<Id, List<sObject>> relatedObjectMap = new Map<Id, List<sObject>>();
        for (sObject obj : relatedLists) {
            Schema.SObjectType objectType = obj.getSObjectType();
            Id objectId = getIdFromObjectType(obj, String.valueOf(objectType), UpdateType);
            if (relatedObjectMap.containsKey(objectId)) {
                relatedObjectMap.get(objectId).add(obj);
            } else {
                List<sObject> objList = new List<sObject>();
                objList.add(obj);
                relatedObjectMap.put(objectId,objList);
            }
        }
        return relatedObjectMap;
    }

    public static Id getIdFromObjectType(sObject relatedObject, String objectType, String updateType) {
        if (objectType == 'AccountHistory') {
            return ((AccountHistory)relatedObject).AccountId;
        } else if (objectType == 'Investment__c') {
            Investment__c invRec = ((Investment__c)relatedObject);
            if (updateType == 'Public Investment') {
                return invRec.Account__c;
            } else if (updateType == '13F Filings Inv Strategy') {
                return invRec.Investment_Strategy__c;
            } else if (updateType == '13F Filings Account') {
                return invRec.Account__c;
            } 
            else if (updateType == 'Inv_Firm_Public_Investment') {
                return invRec.investment_strategy__r.Account__c;
            }
        } else if (objectType == 'Client_Base__c') {
            return ((Client_Base__c)relatedObject).Account__c;
        } else if (objectType=='Update__c') {
            Update__c updateRec = ((Update__c)relatedObject);
            if (updateType == 'Job Change') {
                return updateRec.Contact__c;
            } else if (updateType == 'Role Change') {
                return updateRec.Contact__c;
            } else if (updateType == 'Firm Joined') {
                return updateRec.Firm_Joined__c;
            } else if (updateType == 'Firm Left') {
                return updateRec.Firm_Left__c;
            } else if (updateType == 'Custodian Update') {
                return updateRec.Account__c;
            }
        }
        else if (objectType == 'Investment_Strategy__c') {
            if (updateType == 'Investment Strategy') {
                return ((Investment_Strategy__c)relatedObject).Account__c;
            }
        } else if (objectType == 'Performance__c') {
                return ((Performance__c)relatedObject).Account__c;
        } else if (objectType == 'Manager_Presentation__c') {
            Manager_Presentation__c mpRec = ((Manager_Presentation__c)relatedObject);
            if (updateType == 'Presentation Deck Account') {
                return mpRec.Account__c;
            } else if (updateType == 'Presentation Deck Conusltant') {
                return mpRec.Consultant__c;
            } else if (updateType == 'Presentation Deck PPF') {
                return mpRec.Public_Pension_Fund__c;
            } else if (updateType == 'Meeting Material') {
                return mpRec.Account__c;
            }
        } else if (objectType == 'Public_Plan_Minute__c') {
            return ((Public_Plan_Minute__c)relatedObject).Account__c;
        } else if(objectType=='ContactHistory') {
            return ((ContactHistory)relatedObject).ContactId;
        } else if (objectType == 'Dakota_Content__c') {
            return ((Dakota_Content__c)relatedObject).Contact_Linked__c;
        } else if (objectType == 'AccountContactRelation' && updateType == '') {
            return ((AccountContactRelation)relatedObject).ContactId;
        } else if (objectType == 'Dakota_News__c') {
            return ((Dakota_News__c)relatedObject).Account__c;
        } else if (objectType == 'AccountContactRelation' && updateType == 'Consultant_Related_Account') {
            return ((AccountContactRelation)relatedObject).AccountId;
        } else if (updateType=='Child_Account') {
            return ((Account)relatedObject).Parent_Account__c;
        } 
    
        
        return null;
    }
}