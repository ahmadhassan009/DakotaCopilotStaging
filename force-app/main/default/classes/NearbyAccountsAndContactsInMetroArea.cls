public with sharing class NearbyAccountsAndContactsInMetroArea {
    
    public class RecordsData 
    {
        @AuraEnabled public Decimal Longitude { get; set; }
        @AuraEnabled public Decimal Latitude { get; set; }
        @AuraEnabled public ID RecordId { get; set; }
        @AuraEnabled public String Name { get; set; }
        @AuraEnabled public String AccountType { get; set; }
        @AuraEnabled public Decimal AUM { get; set; }
        @AuraEnabled public String Description { get; set; }
        @AuraEnabled public String Website { get; set; }
        @AuraEnabled public String Phone { get; set; }
        @AuraEnabled public ID MetroAreaId { get; set; }
        @AuraEnabled public String Address { get; set; }
        @AuraEnabled public Integer contactCount { get; set; }
    } 
    @AuraEnabled 
    public static List<RecordsData> getRecordsInformation(String accountIds, String contactIds,String dakotaSearchesIds , String metroAreaId)
    {
        List<RecordsData> nearByRecordsListAccounts = new List<RecordsData>();
        List <Marketplace_Searches__c> searchesRecords = new List<Marketplace_Searches__c>();
        List<Id> accountIdsString = new List<Id>();
        
        dakotaSearchesIds = dakotaSearchesIds.replace('[', '(');
        dakotaSearchesIds = dakotaSearchesIds.replace(']', ')');
        dakotaSearchesIds = dakotaSearchesIds.replace('"','\'');
        
        if(dakotaSearchesIds != null && dakotaSearchesIds != '' && dakotaSearchesIds != '()')
        {
            String query = 'SELECT Id, Account__c FROM Marketplace_Searches__c WHERE Id IN ' + dakotaSearchesIds;
            searchesRecords = Database.query(query);
            for(Marketplace_Searches__c searchRecord : searchesRecords)
            {
                if(searchRecord.Account__c != null)
                {
                    accountIdsString.add(searchRecord.Account__c);
                }
            }
            if(accountIdsString != null && accountIdsString.size() >0)
            {
                String dakotaSearchesString = ''; 
                dakotaSearchesString = JSON.serialize(accountIdsString);
                dakotaSearchesString = dakotaSearchesString.replace('[', '(');
                dakotaSearchesString = dakotaSearchesString.replace(']', ')');
                dakotaSearchesString = dakotaSearchesString.replace('"','\'');
                nearByRecordsListAccounts.addAll(getNeighboringRecordDetails(dakotaSearchesString,metroAreaId));
            }
        }
        
        contactIds = contactIds.replace('[', '(');
        contactIds = contactIds.replace(']', ')');
        contactIds = contactIds.replace('"','\'');
        accountIds = accountIds.replace('[', '(');
        accountIds = accountIds.replace(']', ')');
        accountIds = accountIds.replace('"','\'');
        if(accountIds != null && accountIds != '' && accountIds != '()')
        {
            nearByRecordsListAccounts.addAll(getNeighboringRecordDetails(accountIds,metroAreaId));
        }
        if(contactIds != null && contactIds != '' && contactIds != '()')
        {
            nearByRecordsListAccounts.addAll(getNeighboringRecordDetailsContacts(contactIds,metroAreaId));
        }
        return nearByRecordsListAccounts;
    }
    private static List<RecordsData> getNeighboringRecordDetailsContacts(String contactIds, String metroAreaId)
    {
        if(contactIds != null && contactIds != '()' && contactIds != '')
        {
            String neighboringRecordsQueryContacts = '';
            String neighboringRecordsQueryContactsNotGeocoded = '';
            List< Contact > neighboringDataContacts = new List<Contact>();
            List<Contact> neighboringDataContactsNotGeocoded = new List<Contact>();
            List< Contact > neighboringData = new List<Contact>();
            Map<String, Contact> QueryResultMap = new Map <String, Contact>();
            Map<String, Integer> contactCountMap = new Map<String, Integer>();
            Map<Id, Integer> selectedRecordIds = new Map<Id, Integer>();
            Set <Id> selectedAccountRecords = new Set<Id>();
            Set<Id> accountOfContactsNotGeocoded = new Set<Id>();
     
            neighboringRecordsQueryContacts += 'SELECT account.Id, account.Name, account.Type, account.AUM__c, account.Description, account.Website, account.Phone, MailingStreet, MailingCity, MailingState, MailingPostalCode, MailingCountry, MailingLongitude, MailingLatitude FROM Contact WHERE ';      
            neighboringRecordsQueryContacts += ' Metro_Area__c = :metroAreaId AND MailingLongitude != null AND MailingLatitude != null ';  
            neighboringRecordsQueryContacts += ' AND Id IN ' + contactIds;
            
            neighboringRecordsQueryContactsNotGeocoded += 'SELECT account.Id,account.BillingLongitude,account.BillingLatitude, account.Name, account.Type, account.AUM__c, account.Description, account.Website, account.Phone, MailingStreet, MailingCity, MailingState, MailingPostalCode, MailingCountry, MailingLongitude, MailingLatitude FROM Contact WHERE ';
            neighboringRecordsQueryContactsNotGeocoded += ' Metro_Area__c = :metroAreaId AND MailingLongitude = null AND MailingLatitude = null ';  
            neighboringRecordsQueryContactsNotGeocoded += 'AND Id IN '+ contactIds;
            
            neighboringDataContacts = Database.query(neighboringRecordsQueryContacts);
            neighboringDataContactsNotGeocoded = Database.query(neighboringRecordsQueryContactsNotGeocoded);
            
            if(neighboringDataContactsNotGeocoded != null && neighboringDataContactsNotGeocoded.size() > 0)
            {
                for(Contact con : neighboringDataContactsNotGeocoded)
                {
                    if(con.AccountId != null)
                    {
                        accountOfContactsNotGeocoded.add(con.AccountId);
                    }
                }
            }
            Integer counter;
            String compositeKey;
            for(Contact contactRow : neighboringDataContacts) {
                counter = 0;
                compositeKey = '';
                compositeKey = String.valueOf(contactRow.AccountId) + String.valueOf((Decimal) contactRow.get('MailingLongitude')) + String.valueOf((Decimal) contactRow.get('MailingLatitude'));
                QueryResultMap.put(compositeKey, contactRow);
                selectedRecordIds.put(contactRow.AccountId, 0);
                if(contactCountMap.containsKey(compositeKey)) {
                    counter = contactCountMap.get(compositeKey);
                    contactCountMap.put(compositeKey, counter+1);
                } else {
                    contactCountMap.put(compositeKey, 1);
                }
            }
            selectedAccountRecords = selectedRecordIds.keySet();
            List<RecordsData> NeighboringRecordList = mapNeighboringDataToCustomObj(QueryResultMap, contactCountMap);
            NeighboringRecordList.addAll(getNeighboringRecordDetailsNotGeocoded(accountOfContactsNotGeocoded,metroAreaId));
            return NeighboringRecordList;
        }
        return null;
    }
    private static List<RecordsData> getNeighboringRecordDetailsNotGeocoded(Set<Id> neighboringDataContactsNotGeocoded,String metroAreaId)
    {
        if(neighboringDataContactsNotGeocoded != null)
        {
            Set<String> accountOfContactsNotGeocodedList = (Set<String>)JSON.deserialize(JSON.serialize(neighboringDataContactsNotGeocoded), Set<String>.class);
            String accountOfContactsNotGeocodedString = String.join(new List<String>(accountOfContactsNotGeocodedList), '\',\'');
            String neighboringAccountRecordsQuery = '';
            neighboringAccountRecordsQuery += 'SELECT Id, Name, Type, AUM__c, Description, Website, Phone, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry, BillingLongitude, BillingLatitude FROM Account WHERE ';
            neighboringAccountRecordsQuery += ' MetroArea__c = :metroAreaId AND BillingLongitude != null AND BillingLatitude != null AND Id IN (\''+ accountOfContactsNotGeocodedString + '\')' ; 
            List< Account > neighboringData = Database.query(neighboringAccountRecordsQuery);
            
            Map<String, Account> QueryResultMap = new Map <String, Account>();
            Map<String, Integer> contactCountMap = new Map<String, Integer>();
            Integer counter;
            String compositeKey;
            for(Account AccountRow : neighboringData) { 
                counter = 0;
                compositeKey='';
                compositeKey = String.valueOf(AccountRow.Id) +String.valueOf((Decimal) AccountRow.get('BillingLongitude')) + String.valueOf((Decimal) AccountRow.get('BillingLongitude'));
                QueryResultMap.put(compositeKey, AccountRow);
                contactCountMap.put(compositeKey, 0);
            }
            List<RecordsData> NeighboringRecordList = mapNeighboringAccountDataToCustomObj(QueryResultMap, contactCountMap);
            return NeighboringRecordList;
        }
        return null;   
    }
    private static List<RecordsData> getNeighboringRecordDetails(String accountIds, String metroAreaId){
        String neighboringRecordsQuery = '';
        String neighboringRecordsQueryContacts = '';
        String neighboringRecordsQueryContactsNotGeocoded = '';
        List< Contact > neighboringData = new List<Contact>();
        List< Contact > neighboringDataContacts = new List<Contact>();
        List<Contact> neighboringDataContactsNotGeocoded = new List<Contact>();
        Map<String, Contact> QueryResultMap = new Map <String, Contact>();
        Map<String, Integer> contactCountMap = new Map<String, Integer>();
        Map<Id, Integer> selectedRecordIds = new Map<Id, Integer>();
        Set <Id> selectedAccountRecords = new Set<Id>();
        Set<Id> accountOfContactsNotGeocoded = new Set<Id>();
        
        if(accountIds != '()' && accountIds != null && accountIds != '')
        {
            neighboringRecordsQuery += 'SELECT account.Id, account.Name, account.Type, account.AUM__c, account.Description, account.Website, account.Phone, MailingStreet, MailingCity, MailingState, MailingPostalCode, MailingCountry, MailingLongitude, MailingLatitude FROM Contact WHERE ';      
            neighboringRecordsQuery += ' Metro_Area__c = :metroAreaId AND MailingLongitude != null AND MailingLatitude != null ';  
            neighboringRecordsQuery += ' AND AccountId IN ' + accountIds;
            neighboringData = Database.query(neighboringRecordsQuery);
        }
        // Map query result to a map <Composite Key with Account Id and count, Contact>
        Integer counter;
        String compositeKey;
        for(Contact contactRow : neighboringData) {
            counter = 0;
            compositeKey = '';
            compositeKey = String.valueOf(contactRow.AccountId) + String.valueOf((Decimal) contactRow.get('MailingLongitude')) + String.valueOf((Decimal) contactRow.get('MailingLatitude'));
            QueryResultMap.put(compositeKey, contactRow);
            selectedRecordIds.put(contactRow.AccountId, 0);
            if(contactCountMap.containsKey(compositeKey)) {
                counter = contactCountMap.get(compositeKey);
                contactCountMap.put(compositeKey, counter+1);
            } else {
                contactCountMap.put(compositeKey, 1);
            }
        }
        selectedAccountRecords = selectedRecordIds.keySet();
        List<RecordsData> NeighboringRecordList = mapNeighboringDataToCustomObj(QueryResultMap, contactCountMap);
        NeighboringRecordList.addall(getNeighboringAccountRecordDetails(accountIds, selectedAccountRecords,metroAreaId));
        return NeighboringRecordList;
    }
    private static List<RecordsData> getNeighboringAccountRecordDetails(String accountIds, Set<Id> selectedAccountRecords, String metroAreaId){
        String neighboringAccountRecordsQuery = '';
        Set<String> alreadyFetchedRecords = (Set<String>)JSON.deserialize(JSON.serialize(selectedAccountRecords), Set<String>.class);
        String alreadyQueriedAccounts = String.join(new List<String>(alreadyFetchedRecords), '\',\'');
        neighboringAccountRecordsQuery += 'SELECT Id, Name, Type, AUM__c, Description, Website, Phone, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry, BillingLongitude, BillingLatitude FROM Account WHERE ';
        neighboringAccountRecordsQuery += ' MetroArea__c = :metroAreaId AND Id IN ' + accountIds;// + ' AND Id IN (\''+ accountOfContactsNotGeocodedString + '\')' ;       
        neighboringAccountRecordsQuery += ' AND Id NOT IN (\''+ alreadyQueriedAccounts + '\')';
        List< Account > neighboringData = Database.query(neighboringAccountRecordsQuery);
        // Map query result to a map <Composite Key with Account Id and count, Account>
        Map<String, Account> QueryResultMap = new Map <String, Account>();
        Map<String, Integer> contactCountMap = new Map<String, Integer>();
        Integer counter;
        String compositeKey;
        for(Account AccountRow : neighboringData) {
            counter = 0;
            compositeKey='';
            compositeKey = String.valueOf(AccountRow.Id) +String.valueOf((Decimal) AccountRow.get('BillingLongitude')) + String.valueOf((Decimal) AccountRow.get('BillingLongitude'));
            QueryResultMap.put(compositeKey, AccountRow);
            contactCountMap.put(compositeKey, 0);
        }
        List<RecordsData> NeighboringRecordList = mapNeighboringAccountDataToCustomObj(QueryResultMap, contactCountMap);
        return NeighboringRecordList;
    }
    
    private static List<RecordsData> mapNeighboringAccountDataToCustomObj(Map< String, Account > queryResult, Map< String, Integer > contactCountMap) {
        List<RecordsData> nearByRecordsObjList = new List<RecordsData>();
        for (Account cObj : queryResult.values()) {
            RecordsData nb_record = new RecordsData();
            nb_record.RecordId = (Id) cObj.get('Id');
            nb_record.Name = (String) cObj.get('Name');
            nb_record.AUM = (Decimal) cObj.get('AUM__c');
            nb_record.Description = (String) cObj.get('Description');
            nb_record.AccountType = (String) cObj.get('Type');
            nb_record.Phone = (String) cObj.get('Phone');
            nb_record.Website = (String) cObj.get('Website');
            //Address concatenation
            String recordAddress = cObj.get('BillingStreet') != NULL ? (String) cObj.get('BillingStreet') + ' ' : '';
            recordAddress += cObj.get('BillingCity') != NULL ? (String) cObj.get('BillingCity') + ' ' : '';
            recordAddress += cObj.get('BillingState') != NULL ? (String) cObj.get('BillingState') + ' ' : '';
            recordAddress += cObj.get('BillingPostalCode') != NULL ? (String) cObj.get('BillingPostalCode') + ' ' : '';
            recordAddress += cObj.get('BillingCountry') != NULL ? (String) cObj.get('BillingCountry') + ' ' : '';
            nb_record.Address = recordAddress;
            nb_record.Latitude = (Decimal) cObj.get('BillingLatitude');
            nb_record.Longitude = (Decimal) cObj.get('BillingLongitude');
            String compositeKey = String.valueOf(nb_record.RecordId) + String.valueOf(nb_record.Longitude) +String.valueOf(nb_record.Latitude);
            nb_record.contactCount = contactCountMap.get(compositeKey);
            nearByRecordsObjList.add(nb_record);
        }
        return nearByRecordsObjList;
    }
    
    
    private static List<RecordsData> mapNeighboringDataToCustomObj(Map< String, Contact > queryResult, Map< String, Integer > contactCountMap) {
        List<RecordsData> nearByRecordsObjList = new List<RecordsData>();
        for (Contact cObj : queryResult.values()) {
            RecordsData nb_record = new RecordsData();
            nb_record.RecordId = (Id) cObj.getSobject('Account').get('Id');
            nb_record.Name = (String) cObj.getSobject('Account').get('Name');
            nb_record.AUM = (Decimal) cObj.getSobject('Account').get('AUM__c');
            nb_record.Description = (String) cObj.getSobject('Account').get('Description');
            nb_record.AccountType = (String) cObj.getSobject('Account').get('Type');
            nb_record.Phone = (String) cObj.getSobject('Account').get('Phone');
            nb_record.Website = (String) cObj.getSobject('Account').get('Website');
            //Address concatenation
            String recordAddress = cObj.get('MailingStreet') != NULL ? (String) cObj.get('MailingStreet') + ' ' : '';
            recordAddress += cObj.get('MailingCity') != NULL ? (String) cObj.get('MailingCity') + ' ' : '';
            recordAddress += cObj.get('MailingState') != NULL ? (String) cObj.get('MailingState') + ' ' : '';
            recordAddress += cObj.get('MailingPostalCode') != NULL ? (String) cObj.get('MailingPostalCode') + ' ' : '';
            recordAddress += cObj.get('MailingCountry') != NULL ? (String) cObj.get('MailingCountry') + ' ' : '';
            nb_record.Address = recordAddress;
            nb_record.Latitude = (Decimal)  cObj.get('MailingLatitude');
            nb_record.Longitude = (Decimal)  cObj.get('MailingLongitude');
            String compositeKey = String.valueOf(nb_record.RecordId) + String.valueOf(nb_record.Longitude) +String.valueOf(nb_record.Latitude);
            nb_record.contactCount = contactCountMap.get(compositeKey);
            nearByRecordsObjList.add(nb_record);
        }
        return nearByRecordsObjList;
    }
     
}