public class SearchesEmailAlertAndTaskCreation {
    
    @InvocableMethod(label = 'Search For Contacts With Same Asset Classes')
    public static void searchForContactsWithSameAssetClasses(List<Id> searchesId) {
        Id marketplaceSearchId = searchesId[0];
        Marketplace_Searches__c searchRecord = [Select Id, recordtypeId, Current_Consultant__c, Name,Asset_Class__c,Account__c,Account__r.Name, Account__r.AUM__c, Consultant__c, Current_Consultant__r.Name,
                                                Consultant__r.Name,Contact__c,Contact__r.Name,Sub_Asset_Class__c,
                                                Description__c,End_Date__c,Amount__c,Emerging_Manager_Search__c,Search_URL__c,Search_Status__c,Requirements__c,Additional_Information__c,Pacing_Information__c
                                                from Marketplace_Searches__c where Id = :marketplaceSearchId Limit 1];
        List<String> searchAssetClassesList = new List<String>();

        if (searchRecord.Asset_Class__c != null) {
            searchAssetClassesList.addAll(searchRecord.Asset_Class__c.split(';'));
        }

        Map<Id,String> contactToSearchesPrefMap = new Map<Id,String>();
        Map<Id,String> contactToAssetClassMap = new Map<Id,String>();
        List<String> searchAssetClassesPrefList = new List<String>();

        List<Email_Notification_Preferences__c> preferencesList = [SELECT Id, OwnerId, CreatedById,CreatedBy.ContactId, Contact_Updates_Selection__c, Search_Updates_Selection__c, Account_Updates_Selection__c
                                                                    FROM Email_Notification_Preferences__c where CreatedBy.Profile.Name IN ('Dakota Customer Community', 'System Administrator')];
        Set<Id> usersId = new Set<Id>();
        for (Email_Notification_Preferences__c notification: preferencesList) {
            usersId.add(notification.OwnerId);
        }
        Map<Id, User> usersMap = new Map<Id, User>([SELECT Id, ContactId FROM User where Id IN :usersId]);
        for (Email_Notification_Preferences__c pref: preferencesList) {
            if (usersMap.containsKey(pref.OwnerId) && String.isNotBlank(usersMap.get(pref.OwnerId)?.contactId)) {
                contactToSearchesPrefMap.put(usersMap.get(pref.OwnerId)?.contactId, pref.Search_Updates_Selection__c);
            }
        }

        if (searchRecord != null) {
            Set<String> assetClassesSet = new Set<String>();
            List<EmailPreference_To_AssetClass__mdt> emailPrefrecnes = [Select Id,MasterLabel,DeveloperName,Asset_Classes__c 
                                                                        from EmailPreference_To_AssetClass__mdt];
            for (EmailPreference_To_AssetClass__mdt customMapping:emailPrefrecnes) {
                List<String> assetClasses = customMapping?.Asset_Classes__c?.split(';');
                for (String searchAssetClass : searchAssetClassesList) {
                    if (customMapping.Asset_Classes__c != null && assetClasses.contains(searchAssetClass)) {
                        assetClassesSet.add(customMapping.MasterLabel);
                    } else if (searchRecord.Emerging_Manager_Search__c==true && customMapping.DeveloperName=='Emerging_Manager_Searches') {
                        assetClassesSet.add(customMapping.MasterLabel);
                    }
                }
            }
            if (assetClassesSet.size() > 0) {
                String assetClasses = '(\'' + String.join(new List<String>(assetClassesSet), '\',\'') + '\')';
                List<Restrict_Searches_Email_Alert__c> excludedSalesCycle = Restrict_Searches_Email_Alert__c.getAll().values();
                
                Integer numOfDays = (Integer)excludedSalesCycle[0].Number_of_Days__c;
                String excludedTypes = excludedSalesCycle[0].Sales_Cycle_Type__c;
                excludedTypes = excludedTypes.replaceAll(',', '\',\'');
                excludedTypes = '(\'' + excludedTypes + '\')';
                
                String query = 'Select Id,FirstName, LastName, Searches_Asset_Class__c,Email, Account.Draft_Sales_Cycle__c from Contact where Email != null AND Searches_Email__c = true AND Searches_Asset_Class__c INCLUDES' + assetClasses + 'AND account.Draft_Sales_Cycle__c NOT IN' + excludedTypes;
                Map<Id, Contact> contactsToBeUpdated = new Map<Id, Contact>((List<Contact>)Database.query(query));
                Map<Id, Contact> contacts = new Map<Id, Contact>();
                for (Contact con : contactsToBeUpdated.values()) {
                    if (contactToSearchesPrefMap.get(con.Id) != null || Test.isRunningTest()) {
                        List<String> contactSearchAssetClassesList = new List<String>();

                        if (con.Searches_Asset_Class__c != null) {
                            contactSearchAssetClassesList.addAll(con.Searches_Asset_Class__c.split(';'));
                        }
                        for (String assetClass : assetClassesSet) {
                            if (contactToSearchesPrefMap.get(con.Id) != null && contactToSearchesPrefMap.get(con.Id)?.contains(assetClass)) {
                                contacts.put(con.Id, con);
                                continue;
                            }
                        }
                    }
                }
                Map<Id,Contact> contactsToBeEmailed = new Map<Id,Contact>();
                
                //DSC-963: Add contacts with account's marketplace sales cycle equals to "Current Customer"
                for (Id contactId : contacts.KeySet()) {
                    if (contacts.get(contactId).Account != null &&
                       contacts.get(contactId).Account.Draft_Sales_Cycle__c == 'Current Customer') {
                        contactsToBeEmailed.put(contactId,contacts.get(contactId));
                    }
                }
                Datetime closeDateCheck = Date.today().addDays(-1 * numOfDays);
                
                //DSC-963: Add contacts with searches email checkbox checked in last 30 days
                List<ContactHistory> contactSearchesHistory = [Select Id,OldValue,NewValue,ContactId from ContactHistory where Field = 'Searches_Email__c'
                                                              And ContactId In :contacts.KeySet() and CreatedDate >= :closeDateCheck order by CreatedDate asc];
                for(ContactHistory conHistory : contactSearchesHistory)
                {
                    if(contacts.containsKey(conHistory.ContactId) && conHistory.NewValue == true)
                    {
                        contactsToBeEmailed.put(conHistory.ContactId,contacts.get(conHistory.ContactId));
                    }
                }
                 
                //DSC-815: Add contacts with case close date is within last 30 days
                List<Case> caseList = [SELECT Id, ContactId, CreatedDate, ClosedDate FROM Case 
                                       WHERE Origin = 'Web' AND Subject = 'Asset Class Preference' 
                                       AND ContactId IN :contacts.keySet() AND ClosedDate >= :closeDateCheck];
                for (Case caseRec: caseList) {
                    if (contacts.containsKey(caseRec.ContactId)) {
                        contactsToBeEmailed.put(caseRec.ContactId,contacts.get(caseRec.ContactId));
                    }
                }
                
                //DSC-970 : Searches Email should always be sent to internal users(contacts)
                Map<Id,Contact> internalUsers = new Map<Id,Contact>([Select Id,FirstName,Searches_Asset_Class__c,Email, Account.Draft_Sales_Cycle__c 
                                               from Contact where Email != null AND Searches_Email__c = true and Email like '%@dakota%']);
                contactsToBeEmailed.putAll(internalUsers);
                
                if (contactsToBeEmailed.values().size() > 0) {
                    BatchForSearchesEmailAlert b = new BatchForSearchesEmailAlert(contactsToBeEmailed.values(),searchRecord);  
                    Database.executebatch(b,50);
                }
            }
        }
    }
}