public with sharing class MassFollowSharePageController {
    public Boolean renderToast { get; set; }
    public String message { get; set; }
    public String type { get; set; }
  
    public MassFollowSharePageController(ApexPages.StandardSetController controller) {
    }

    public void massFollowShareAction() {
        message = 'Only community users can follow or share.';
        type = 'error';
        renderToast = true;
    }

    @AuraEnabled
    public static List<SObject> getRecordCountViewAll(String objectApiName, String sortedBy, String sortOrder, String nullOrder, String filterId)
    {
        try{
            if ((filterId == 'all') || (objectApiName != 'Account' && objectApiName!='Contact')) {
                String query = 'SELECT Id FROM '+objectApiName;
                query += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 2000 OFFSET 0';
                List<SObject> returnedRecords = Database.query(query); 
                return returnedRecords;
            } else {

                filterId = filterId.replace('Recent-', '');
                if (filterId == 'Recent') {
                    List<ListView> recentRecords = [SELECT Id, Name FROM ListView WHERE sobjectType =:objectAPIName AND Name LIKE 'Recently Viewed %'];
                    if (recentRecords.size() > 0) {
                        filterId = recentRecords[0].Id;
                    }
                }
                String returnedResult = makeCallout(objectApiName,filterId);
                Object untypedObject = JSON.deserializeUntyped(returnedResult);
                Map<String, Object> returnedQuery = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(untypedObject));
                String getQuery = (String) returnedQuery?.get('query');
                List<String> splittedQuery = getQuery.split('ORDER BY');
                List<String> splittedQueryForCount =  splittedQuery[0].split(' FROM');
                getQuery= 'SELECT Id FROM'+splittedQueryForCount[1] +' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 2000 OFFSET 0';
                List<SObject> returnedRecords = Database.query(getQuery);
                return returnedRecords;
            }
        }
        catch(Exception ex){
            system.debug('filterId');
            system.debug(ex.getMessage());         
            return null; 
        }
    }

    @AuraEnabled
    public static List<SObject> getRecordsViewAll(String fieldsToQuery, String objectApiName, String sortedBy, String sortOrder, Integer recLimit, Integer offset, String nullOrder, String filterId)
    {
        try{
            if ((filterId == 'all') || (objectApiName != 'Account' && objectApiName!='Contact')) {
                String query = 'SELECT '+fieldsToQuery+' FROM '+objectApiName;
                query += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
                List<SObject> returnedRecords = Database.query(query); 
                return returnedRecords;
            } else {

                filterId = filterId.replace('Recent-', '');
                if (filterId == 'Recent') {
                    List<ListView> recentRecords = [SELECT Id, Name FROM ListView WHERE sobjectType =:objectAPIName AND Name LIKE 'Recently Viewed %'];
                    if (recentRecords.size() > 0) {
                        filterId = recentRecords[0].Id;
                    }
                }

                String returnedResult = makeCallout(objectApiName,filterId);
                Object untypedObject = JSON.deserializeUntyped(returnedResult);
                Map<String, Object> returnedQuery = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(untypedObject));
                String getQuery = (String) returnedQuery?.get('query');
                List<String> splittedQuery = getQuery.split('ORDER BY');
                List<String> splittedQueryForFields =  splittedQuery[0].split(' FROM');
                getQuery= 'SELECT '+fieldsToQuery+' FROM'+splittedQueryForFields[1] +' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recLimit + ' OFFSET ' + offset;
                List<SObject> returnedRecords = Database.query(getQuery);                 
                return returnedRecords;
            }
        }
        catch(Exception ex){
            system.debug(ex.getMessage());         
            return null; 
        }
    }

    @AuraEnabled
    public static List<Map<String,String>> getOptionsFromApex(String objectAPIName) {        
        List<Map<String,String>> filtersList=new List<Map<String,String>>();        
        List<ListView> listViews = [SELECT Id,Name  FROM ListView WHERE sobjectType =:objectAPIName ORDER BY Name];
        String objectLabel =  objectAPIName =='Investment__c'? 'New Investments' :objectAPIName+'s' ;
        for( ListView listView: listViews) {
            Map<String,String> m2=new Map<String,String>();
            m2.put(listView.Id, listView.Name);
            filtersList.add(m2);
            if (listView.Name == 'Recently Viewed '+objectLabel) {
                Map<String,String> m3=new Map<String,String>();
                m3.put('Recent-'+listView.Id, 'Recently Viewed');
                filtersList.add(m3);
            }
        }
        return filtersList;
    }

    public static String makeCallout(string objectApiName,string filterId) {
        HttpRequest req = new HttpRequest();
        String baseUrl=(String)Url.getOrgDomainURL().toExternalForm();
        req.setEndpoint(baseUrl+'/services/data/v58.0/sobjects/'+objectApiName+'/listviews/'+filterId+'/describe');
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
        req.setHeader('Content-Type', 'application/json');

        Http http = new Http();
        HttpResponse res = http.send(req);
        
        return res.getBody();
    }

    @AuraEnabled
    public static Boolean usersExportAccess() {

        User userExportAccess = [SELECT Id,Allow_Account_and_Contacts_Export__c FROM user WHERE Id=:UserInfo.getUserId()];
        return userExportAccess.Allow_Account_and_Contacts_Export__c;
    }


}