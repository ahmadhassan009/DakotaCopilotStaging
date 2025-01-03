public with sharing class HerokuSyncHelper {
    public  List<String> salesforceFieldsList = new List<String>();
    public  String salesforceFields = '';
    public  List<String> herokuFieldsList = new List<String>();
    String herokuTableName = '';
    Heroku_Credentials__c herokuCredsObj = Heroku_Credentials__c.getInstance('Authentication_Credentials');


    public HerokuSyncHelper(String metadataName)
    {
        List<Heroku_Sycn_Scheduler__mdt> herokuSettings = [SELECT Heroku_Table_Name__c, Fields_List_Salesforce__c, Fields_List_Heroku__c FROM Heroku_Sycn_Scheduler__mdt WHERE DeveloperName = :metadataName];
        if(herokuSettings != null && herokuSettings.size() > 0) {
            this.salesforceFields = herokuSettings[0].Fields_List_Salesforce__c;
            this.salesforceFieldsList = herokuSettings[0].Fields_List_Salesforce__c.split(',');
            this.herokuFieldsList = herokuSettings[0].Fields_List_Heroku__c.split(',');
            this.herokuTableName = herokuSettings[0].Heroku_Table_Name__c;
        }

    }
    /**
     * Function to check if any of the Heroku Synced field has been updated, if thats the case, reset the Heroku Synced Flag to false
     */
    public void resetHerokuSyncFlag(List<sObject> newRecList, Map<Id, SObject> oldRecMap)
    {
        for (sObject newRec : newRecList) {
            //check if any of the Sycned field has been updated
            for (String sfField : salesforceFieldsList) {
                String sfFieldName = sfField.replace('\n', '').replace('\r', '');
                if (newRec.get(sfFieldName) != oldRecMap?.get(newRec?.Id)?.get(sfFieldName)) {
                    newRec.put('Heroku_Synced__c',false);
                    break;
                }
            }
        }
    }

    public List<Map<String, Object>> prepareRequestBody(List<sObject> recList) {
        List<Map<String, Object>> propertiesList = new List<Map<String, Object>>();
        Map<String, Object> property;
        if(herokuFieldsList.size() > 0 && salesforceFieldsList.size() > 0) {
            for(sObject rec: recList){ 
                property = new Map<String, Object>();
                Integer fieldIndex = 0;
                for (String sfField : salesforceFieldsList) {
                    property.put(herokuFieldsList[fieldIndex].replace('\n', '').replace('\r', ''), rec.get(sfField.replace('\n', '').replace('\r', '')));
                    fieldIndex++;  
                }
                propertiesList.add(property);
            }
        }
        return propertiesList;
    }
    
    public List<String> prepareRequestBodyForDelete(Set<id> idsSet) {
        List<String> deleteRecList = new List<String>();
        if(idsSet.size() > 0) 
        {
            for(Id rec: idsSet)
            {
                deleteRecList.add(String.valueOf(rec));
            }
        }        
        return deleteRecList;
    }


    public HttpResponse sendHttpRequest(String URL ,String method, String body) {

        String accessToken = herokuCredsObj.Access_Token__c;
        String authenticationKey = herokuCredsObj.Authentication_Key__c;
        DateTime expiryDate = herokuCredsObj.Expiry_Date__c;
        Datetime now = Datetime.now();
        Boolean csUpdate = false;
        if(expiryDate <= now )
        {
            accessToken = HerokuAuthenticationController.getDakotaAccessTokenOnAuthentication();
            csUpdate = true;
        }

        HttpRequest request = new HttpRequest();
        HttpResponse httpRes = new HttpResponse();
        Http http = new Http();
        request.setEndpoint(URL);
        request.setMethod(method);
        request.setHeader('Accept', 'application/json');
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Oauth-Token', accessToken);
        request.setTimeout(120000);
        request.setBody(body);
        httpRes = http.send(request);
        if(httpRes.getStatusCode()==401)
        {
            accessToken = HerokuAuthenticationController.getDakotaAccessTokenOnAuthentication();
            if(accessToken != null )
            {
                request.setHeader('Oauth-Token', accessToken);
                request.setTimeout(120000);
                httpRes = http.send(request);
    
                herokuCredsObj.Access_Token__c = accessToken;
                herokuCredsObj.Expiry_Date__c = now.addHours(1);
                update herokuCredsObj;
            }
        }
        if(csUpdate == true)
        {
            update herokuCredsObj;
        }

        return httpRes;
    }

    public void processRequest(List<SObject> recList, String crud) {
        HttpResponse httpRes = new HttpResponse();
        String apiEndpoint = herokuCredsobj.Heroku_URL__c+'/index.php/api/dakota';
        String objectName;
        boolean isRecordsUpdated = false;
       if(Test.isRunningTest()) {
            apiEndpoint += '/AccountContactRelation';
        }
        httpRes = sendHttpRequest(apiEndpoint, crud, JSON.serialize(new herokuRequestWrapper(prepareRequestBody(recList), herokuTableName)));
        if(httpRes.getStatusCode() == 200) {
            ResponseWrapper resp = (ResponseWrapper)JSON.deserialize(httpRes.getBody(), ResponseWrapper.class);
            if(resp.inserted_ids != null && resp.inserted_ids.size() > 0) {
                List<SObject> recToUpdateList = new List<SObject>();
                Id recordId = (Test.isRunningTest())?(Id) recList[0].Id :(Id)resp.inserted_ids[0];
                objectName = recordId.getSObjectType().getDescribe().getName();
                sObject recObj = Schema.getGlobalDescribe().get(objectName).newSObject();
                if(Test.isRunningTest()) {
                    for (SObject rec : recList) {
                        recObj = Schema.getGlobalDescribe().get(objectName).newSObject();
                        recObj.put('Id', rec.Id);
                        recObj.put('Heroku_Synced__c', true);
                        recToUpdateList.add(recObj);
                    }
                } else {
                    for (String recId : resp.inserted_ids) {
                        recObj = Schema.getGlobalDescribe().get(objectName).newSObject();
                        recObj.put('Id', recId);
                        recObj.put('Heroku_Synced__c', true);
                        recToUpdateList.add(recObj);
                    }
                }
                if(recToUpdateList.size() > 0)
                {
                    isRecordsUpdated = true;
                    try{
                        update recToUpdateList;
                    }catch(Exception ex){
                        system.debug(ex.getMessage());
                    }
                }
                
            }
        }
            
    }

    public void processRequestForDelete(Set<Id> idsSet, String crud)
    {
        HttpResponse httpRes = new HttpResponse();
        String apiEndpoint = herokuCredsobj.Heroku_URL__c+'/index.php/api/dakota';

        if(Test.isRunningTest()) {
            apiEndpoint += '/Investment';
        }
        List<String> idList = new List<String>(prepareRequestBodyForDelete(idsSet));
        httpRes = sendHttpRequest(apiEndpoint, crud, JSON.serialize(new herokuRequestWrapperForDelete(idList, herokuTableName)));
        
        if(httpRes.getStatusCode() == 200)
        {
            ResponseWrapper resp = (ResponseWrapper)JSON.deserialize(httpRes.getBody(), ResponseWrapper.class);
            if(resp.failed_ids != null && resp.failed_ids.size() > 0) {
                sendEmail(resp.failed_ids);
            }  
        }  
        else
        {
            sendEmail(idList);                
        } 
    }

    public void sendEmail(List<String> idsList)
    {
        List<Messaging.SingleEmailMessage> lstAllMails = new List<Messaging.SingleEmailMessage>();           
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setSubject('Failed Ids for Heroku Table = '+herokuTableName);
        mail.setToAddresses(new list<string>{System.Label.DraftCrmEmail});
        mail.setPlainTextBody(String.valueof(JSON.serialize(idsList)));
        mail.setSaveAsActivity(false);
        lstAllMails.add(mail);
        Messaging.sendEmail(lstAllMails,false);
    }

    public void processRequestForPicklists(List<ScheduleSyncPicklistsInHeroku.SyncPicklistWrapper> picklists, String crud) {
        HttpResponse httpRes = new HttpResponse();
        String apiEndpoint = herokuCredsobj.Heroku_URL__c+'/index.php/api/dakota';

        if(Test.isRunningTest()) {
            apiEndpoint += '/Picklists'; 
        }
        System.debug(picklists);
        httpRes = sendHttpRequest(apiEndpoint, crud, JSON.serialize(new herokuRequestWrapperForPicklists(picklists, 'dakota_picklists')));
        if(httpRes.getStatusCode() == 200) 
        {     
            system.debug('Status Code = '+httpRes.getStatusCode());
        }            
    }

    public class herokuRequestWrapperForPicklists {
        public List<ScheduleSyncPicklistsInHeroku.SyncPicklistWrapper> data  = new List<ScheduleSyncPicklistsInHeroku.SyncPicklistWrapper>();
        public String module= '';        
        public Boolean create;
        public herokuRequestWrapperForPicklists (List<ScheduleSyncPicklistsInHeroku.SyncPicklistWrapper> data, String herokuTableName) {
            this.data = data;
            module = herokuTableName;
            create = true;
        }
    }


    public class herokuRequestWrapper {
        public List<Map<String, Object>> data  = new List<Map<String, Object>>();
        public String module= '';
        public Boolean create;
        public herokuRequestWrapper (List<Map<String, Object>> data, String herokuTableName) {
            this.data = data;
            module = herokuTableName;
            create = true;
        }
    }

    public class herokuRequestWrapperForDelete {
        public List<Id> data  = new List<Id>();
        public String module= '';
        public herokuRequestWrapperForDelete (List<Id> data, String herokuTableName) {
            this.data = data;
            module = herokuTableName;
        }
    }

    public class ResponseWrapper {
        public List<String> inserted_ids;
        public List<String> failed_ids;
    }

}