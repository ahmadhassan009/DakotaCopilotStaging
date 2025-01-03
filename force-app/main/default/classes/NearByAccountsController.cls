/**
 * DSC-16 : Nearby Accounts (List View/Map) Dashlet for Accounts/Contacts
 * Data for showing nearby accounts on map and as list view
 */
public class NearByAccountsController {

    /**
    * Get names of the fields which will be shown on card of map
    */
    @AuraEnabled
    public static List<Fields_On_Map_Card__c> getFieldsToBeDisplayedOnCard(){
    	return [Select Name from Fields_On_Map_Card__c where Is_Visible_On_Map__c = true];
    }

    /**
    * NearByRecordsData custom object for holding the data required for map and list view 
    */
    public class NearByRecordsData implements Comparable {
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
        @AuraEnabled public Decimal Distance { get; set; }
        @AuraEnabled public Integer contactCount { get; set; }
        
        public Integer compareTo(Object compareTo) {
            NearByRecordsData compareToRecords = (NearByRecordsData)compareTo;
            // The return value of 0 indicates that both elements are equal.
            Integer returnValue = 0;
            if (Distance > compareToRecords.Distance) {
                // Set return value to a positive value.
                returnValue = 1;
            } else if (Distance < compareToRecords.Distance) {
                // Set return value to a negative value.
                returnValue = -1;
            }
            return returnValue; 
    	}
    }

     /**
     * Get details of the current record and its nearby account records (Pin location of the related contact is shown unless its lat long are empty)   
     * @param recordId the Id of the current record
     * @param entity the current record is an Account or Contact object
     * @param maxDistance maximum distance to which the nearby records could be
     * @param recordLimit the number of records to be shown
     * @param sameAccountType List<String> variable to indicate that nearby records should have these account types or not
     * 
     * @return list of custom object (NearByRecordsData)
     */
    @AuraEnabled
    public static List<NearByRecordsData> getNearByAccounts(Id recordId, String entity, Integer maxDistance, Integer recordLimit, List<String> sameAccountType)
    {
        List<NearByRecordsData> nearByRecordsList = new List<NearByRecordsData>();
        nearByRecordsList = getCurrentRecordDetails(recordId, entity);
        // If the current record is not geo-coded return empty list
        if (nearByRecordsList[0].Longitude == NULL || nearByRecordsList[0].Latitude == NULL) {
            nearByRecordsList.clear();
            return nearByRecordsList;
        }

        //Get the neighboring records to be shown on the map and in the list view
        nearByRecordsList.addall(getNeighboringRecordDetails(recordId, nearByRecordsList[0], maxDistance, recordLimit, sameAccountType));
        return nearByRecordsList;
    }
    
    /**
     * This method query a account type's picklist values from meta data.
     * @return Supported picklist values for filter from meta data.
     */
    @AuraEnabled
    public static String getAccountTypeValueSetFromMetadata() {
        try {
            List<Account_Type_Picklist_Values__mdt> picklistValues = [Select Id, Picklist_Values__c from Account_Type_Picklist_Values__mdt];
            if (picklistValues?.size() > 0) {
                return picklistValues[0]?.Picklist_Values__c;
            } 
            return null;
        } catch (Exception e) {
            throw new AuraHandledException(e?.getMessage());
        }
    }

    /**
     * Get the information of the current record (record on which map is shown) 
     * @param recordId the Id of the current record
     * @param entity teh current record is an Accoun or Contact object
     * 
     * @return list of custom object (NearByRecordsData)
     */
    @AuraEnabled
    public static List<NearByRecordsData> getCurrentRecordDetails(Id recordId, String entity) {
        String currentRecordQuery = '';
        String AccountSelectFields = ' SELECT MetroArea__c, Id, Name, Type, AUM__c, Description, Website, Phone, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry,  BillingLongitude, BillingLatitude';
        String ContactSelectFields = 'SELECT Metro_Area__c, account.Id, account.Name, account.Type, account.AUM__c, account.Description, account.Website, account.Phone, MailingStreet, MailingCity, MailingState, MailingPostalCode, MailingCountry, MailingLongitude, MailingLatitude';
        currentRecordQuery += entity == 'Account' ? AccountSelectFields : ContactSelectFields;
        currentRecordQuery += entity == 'Account' ? ' FROM Account ' : ' FROM Contact ';
        currentRecordQuery += ' WHERE Id =: recordId';
        String FinalQuery = currentRecordQuery;
        List< sObject > currentRecord = Database.query(FinalQuery);
        List<NearByRecordsData> CurrentRecordList = mapDataToCustomObj(currentRecord, entity);
        return CurrentRecordList;
    }

    /**
     * Get current detail like longitude, latitude, account type and Metro Area 
     * 
     * @param queryResult query result for account/contact
     * @param entity Account or Contact
     * 
     * @return list of custom object (NearByRecordsData). List contains only one object that is the current record
     */
    public static List<NearByRecordsData> mapDataToCustomObj(List< sObject > queryResult, String entity) {
        List<NearByRecordsData> nearByRecords = new List<NearByRecordsData>();
        for(sObject queryObj : queryResult) {
            NearByRecordsData nb_record = new NearByRecordsData();
            if(entity == 'Account') {
                nb_record.RecordId = (Id) queryObj.get('Id');
                nb_record.Name = (String) queryObj.get('Name');
                nb_record.AccountType = (String) queryObj.get('Type');
                nb_record.AUM = (Decimal) queryObj.get('AUM__c');
                nb_record.Description = (String) queryObj.get('Description');
                nb_record.Website = (String) queryObj.get('Website');
                nb_record.Phone = (String) queryObj.get('Phone');
                nb_record.Latitude = (Decimal) queryObj.get('BillingLatitude');
                nb_record.Longitude = (Decimal) queryObj.get('BillingLongitude');
                nb_record.MetroAreaId = (Id) queryObj.get('MetroArea__c');
                //Address concatenation
                String recordAddress = queryObj.get('BillingStreet') != NULL ? (String) queryObj.get('BillingStreet') + ' ' : '';
                recordAddress += queryObj.get('BillingCity') != NULL ? (String) queryObj.get('BillingCity') + ' ' : '';
                recordAddress += queryObj.get('BillingState') != NULL ? (String) queryObj.get('BillingState') + ' ' : '';
                recordAddress += queryObj.get('BillingPostalCode') != NULL ? (String) queryObj.get('BillingPostalCode') + ' ' : '';
                recordAddress += queryObj.get('BillingCountry') != NULL ? (String) queryObj.get('BillingCountry') + ' ' : '';
                nb_record.Address = recordAddress;
            } else if (entity == 'Contact') {
                nb_record.RecordId = (Id) queryObj.get('AccountId');
                nb_record.Name = (String) queryObj.getSobject('Account').get('Name');
                nb_record.AccountType = (String) queryObj.getSobject('Account').get('Type');
                nb_record.AUM = (Decimal) queryObj.getSobject('Account').get('AUM__c');
                nb_record.Description = (String) queryObj.getSobject('Account').get('Description');
                nb_record.Website = (String) queryObj.getSobject('Account').get('Website');
                nb_record.Phone = (String) queryObj.getSobject('Account').get('Phone');
                nb_record.Latitude = (Decimal) queryObj.get('MailingLatitude');
                nb_record.Longitude = (Decimal) queryObj.get('MailingLongitude');
                nb_record.MetroAreaId = (Id) queryObj.get('Metro_Area__c');
        		//Address concatenation
                String recordAddress = queryObj.get('MailingStreet') != NULL ? (String) queryObj.get('MailingStreet') + ' ' : '';
                recordAddress += queryObj.get('MailingCity') != NULL ? (String) queryObj.get('MailingCity') + ' ' : '';
                recordAddress += queryObj.get('MailingState') != NULL ? (String) queryObj.get('MailingState') + ' ' : '';
                recordAddress += queryObj.get('MailingPostalCode') != NULL ? (String) queryObj.get('MailingPostalCode') + ' ' : '';
                recordAddress += queryObj.get('MailingCountry') != NULL ? (String) queryObj.get('MailingCountry') + ' ' : '';
                nb_record.Address = recordAddress;
            }
            
            //CountQuery for primary record
            String currentRecordCountQuery = 'SELECT COUNT(Id) contactCount  FROM Contact WHERE accountId = \'' + nb_record.RecordId + '\' AND MailingLatitude = ' + nb_record.Latitude + ' AND MailingLongitude = ' + nb_record.Longitude;
            List< sObject > currentRecordCountResult = Database.query(currentRecordCountQuery);
            nb_record.contactCount = (Integer) currentRecordCountResult[0].get('contactCount');
            nearByRecords.add(nb_record);
        }
        return nearByRecords;
    }

    /**
     * Details of the neighboring records
     * @param recordId the current record Id
     * @param currentRecord current record object
     * @param maxDistance maximum distance to which the nearby records could be
     * @param recordLimit the number of records to be shown
     * @param sameAccountType List<String> variable to indicate that nearby records should have these account types or not
     * 
     * @return list of custom object (NearByRecordsData)
     */
	public static List<NearByRecordsData> getNeighboringRecordDetails(Id recordId, NearByRecordsData currentRecord, Integer maxDistance, Integer recordLimit, List<String> sameAccountType){
        String neighboringRecordsQuery = '';
        String MetroAreaId = currentRecord.MetroAreaId;
        Decimal Latitude = currentRecord.Latitude;
        Decimal Longitude = currentRecord.Longitude;

        neighboringRecordsQuery += 'SELECT account.Id, account.Name, account.Type, account.AUM__c, account.Description, account.Website, account.Phone, MailingStreet, MailingCity, MailingState, MailingPostalCode, MailingCountry, MailingLongitude, MailingLatitude, DISTANCE(MailingAddress, GEOLOCATION(:Latitude, :Longitude), \'mi\') distance FROM Contact WHERE ';
        if (MetroAreaId != NULL) {
            neighboringRecordsQuery += ' Metro_Area__c = :MetroAreaId AND ';
        }
        neighboringRecordsQuery += ' DISTANCE(MailingAddress, GEOLOCATION(:Latitude, :Longitude),  \'mi\') ';
        neighboringRecordsQuery += maxDistance == 0 ? ' > 0 ' : ' < :maxDistance AND DISTANCE(MailingAddress, GEOLOCATION(:Latitude, :Longitude),  \'mi\') > 0 ';
        if (sameAccountType?.size() > 0) {
            neighboringRecordsQuery += ' AND account.Type in :sameAccountType ';
        }
        neighboringRecordsQuery += ' ORDER BY DISTANCE(MailingAddress, GEOLOCATION(:Latitude, :Longitude),  \'mi\') ';
        List< Contact > neighboringData = Database.query(neighboringRecordsQuery);
        // Map query result to a map <Composite Key with Account Id and count, Contact>
        Map<String, Contact> QueryResultMap = new Map <String, Contact>();
        Map<String, Integer> contactCountMap = new Map<String, Integer>();
        Map<Id, Integer> selectedRecordIds = new Map<Id, Integer>();
        Integer counter;
        // DSC-693 : Using rounded distance so that if there is 0.01 difference in distance then record is repeated on the front-end list
        Decimal roundedDistance;
        String compositeKey;
        for(Contact contactRow : neighboringData) {
            counter = 0;
            roundedDistance = (Decimal) contactRow.get('distance');
            compositeKey = '';
            compositeKey = String.valueOf(contactRow.AccountId) + String.valueOf(roundedDistance.setScale(2, RoundingMode.HALF_UP));
            QueryResultMap.put(compositeKey, contactRow);
            selectedRecordIds.put(contactRow.AccountId, 0);
            if(contactCountMap.containsKey(compositeKey)) {
                counter = contactCountMap.get(compositeKey);
                contactCountMap.put(compositeKey, counter+1);
            } else {
                contactCountMap.put(compositeKey, 1);
            }
        }

        Set <Id> selectedAccountRecords = new Set<Id>();
        selectedAccountRecords = selectedRecordIds.keySet();
        List<NearByRecordsData> NeighboringRecordList = mapNeighboringDataToCustomObj(QueryResultMap, contactCountMap);

        /**
         * Fetch account records that lie in radius and either do not have linked contacts 
         * or linked contacts are not geo-coded
         * */

        NeighboringRecordList.addall(getNeighboringAccountRecordDetails(currentRecord, maxDistance, sameAccountType, selectedAccountRecords));

        //Sort on distance
        NeighboringRecordList.sort();
        List<NearByRecordsData> NeighboringRecordListWithLimit = subset(NeighboringRecordList, 0, recordLimit);
        return NeighboringRecordListWithLimit;
    } 

    /**
     * Function to map neighboring record result to custom object
     * @param queryResult map of neighboring records
     * @param contactCountMap map of related contact count
     * 
     * @return list of custom object (NearByRecordsData)
     */ 
    public static List<NearByRecordsData> mapNeighboringDataToCustomObj(Map< String, Contact > queryResult, Map< String, Integer > contactCountMap) {
        List<NearByRecordsData> nearByRecordsObjList = new List<NearByRecordsData>();
        for (Contact cObj : queryResult.values()) {
            NearByRecordsData nb_record = new NearByRecordsData();
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
            nb_record.Distance = (Decimal)  cObj.get('distance');
            String compositeKey = String.valueOf(nb_record.RecordId) + String.valueOf(nb_record.Distance);
            nb_record.contactCount = contactCountMap.get(compositeKey);
            nearByRecordsObjList.add(nb_record);
        }
        return nearByRecordsObjList;
    }

    public static List<NearByRecordsData> getNeighboringAccountRecordDetails(NearByRecordsData currentRecord, Integer maxDistance, List<String> sameAccountType, Set <Id> selectedAccountRecords){
        String neighboringAccountRecordsQuery = '';
        String MetroAreaId = currentRecord.MetroAreaId;
        Decimal Latitude = currentRecord.Latitude;
        Decimal Longitude = currentRecord.Longitude;
		Set<String> alreadyFetchedRecords = (Set<String>)JSON.deserialize(JSON.serialize(selectedAccountRecords), Set<String>.class);
        String accountIds = String.join(new List<String>(alreadyFetchedRecords), '\',\'');
        
        neighboringAccountRecordsQuery += 'SELECT Id, Name, Type, AUM__c, Description, Website, Phone, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry, BillingLongitude, BillingLatitude, DISTANCE(BillingAddress, GEOLOCATION(:Latitude, :Longitude),  \'mi\') distance FROM Account WHERE ';
        if (MetroAreaId != NULL) {
            neighboringAccountRecordsQuery += ' MetroArea__c = :MetroAreaId AND ';
        }
		neighboringAccountRecordsQuery += ' DISTANCE(BillingAddress, GEOLOCATION(:Latitude, :Longitude),  \'mi\') ';
        neighboringAccountRecordsQuery += maxDistance == 0 ? ' > 0 ' : ' < :maxDistance AND DISTANCE(BillingAddress, GEOLOCATION(:Latitude, :Longitude),  \'mi\') > 0 ';
        if (sameAccountType?.size() > 0) {
            neighboringAccountRecordsQuery += ' AND Type in :sameAccountType ';
        }
        neighboringAccountRecordsQuery += ' AND Id NOT IN (\''+ accountIds + '\')';
        neighboringAccountRecordsQuery += ' ORDER BY DISTANCE(BillingAddress, GEOLOCATION(:Latitude, :Longitude),  \'mi\') ';
        List< Account > neighboringData = Database.query(neighboringAccountRecordsQuery);

        // Map query result to a map <Composite Key with Account Id and count, Account>
        Map<String, Account> QueryResultMap = new Map <String, Account>();
        Map<String, Integer> contactCountMap = new Map<String, Integer>();
        Integer counter;
        // DSC-693 : Using rounded distance so that if there is 0.01 difference in distance then record is repeated on the front-end list
        Decimal roundedDistance;
        String compositeKey;
        for(Account AccountRow : neighboringData) {
            counter = 0;
            roundedDistance = (Decimal) AccountRow.get('distance');
            compositeKey='';
            compositeKey = String.valueOf(AccountRow.Id) + String.valueOf(roundedDistance.setScale(2, RoundingMode.HALF_UP));
            QueryResultMap.put(compositeKey, AccountRow);
			contactCountMap.put(compositeKey, 0);
        }
        List<NearByRecordsData> NeighboringRecordList = mapNeighboringAccountDataToCustomObj(QueryResultMap, contactCountMap);
        return NeighboringRecordList;
    }
    
    /**
    * Function to map neighboring record result to custom object
    * @param queryResult map of neighboring records
    * @param contactCountMap map of related contact count
    * 
    * @return list of custom object (NearByRecordsData)
    */ 
    public static List<NearByRecordsData> mapNeighboringAccountDataToCustomObj(Map< String, Account > queryResult, Map< String, Integer > contactCountMap) {
        List<NearByRecordsData> nearByRecordsObjList = new List<NearByRecordsData>();
        for (Account cObj : queryResult.values()) {
            NearByRecordsData nb_record = new NearByRecordsData();
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
            nb_record.Distance = (Decimal) cObj.get('distance');
            
            String compositeKey = String.valueOf(nb_record.RecordId) + String.valueOf(nb_record.Distance);
            nb_record.contactCount = contactCountMap.get(compositeKey);
            nearByRecordsObjList.add(nb_record);
        }
        return nearByRecordsObjList;
    }
    
    public static List<NearByRecordsData> subset(List<NearByRecordsData> list1, Integer startIndex, Integer count) {
        List<NearByRecordsData> returnList = new List<NearByRecordsData>();
        if(list1 != null && list1.size() > 0 && startIndex >= 0 && startIndex <= list1.size()-1 && count > 0){
            for(Integer i = startIndex; i < list1.size() && i - startIndex < count; i++){
                returnList.add(list1.get(i));
            }
        }
        return returnList;
    }
}