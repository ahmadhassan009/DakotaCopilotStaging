public with sharing class MpPublicUrlCallout implements Queueable, Database.AllowsCallouts {
    Map<String,String> contIdToMpIdMap = new Map<String,String>();
    Map<String,String> MpIdToMpNameMap = new Map<String,String>(); 
    Map<String,String> contIdToNameMap = new Map<String,String>();      
    Map<String,String> contIdToUrlMap = new Map<String,String>();
    String crud = '';
    
    public MpPublicUrlCallout(Map<String,String> contIdToMpIdMap,Map<String,String> MpIdToMpNameMap , Map<String,String> contIdToNameMap , Map<String,String> contIdToUrlMap, String crud) 
    {
        this.contIdToMpIdMap = contIdToMpIdMap;
        this.MpIdToMpNameMap = MpIdToMpNameMap;
        this.contIdToNameMap = contIdToNameMap;
        this.contIdToUrlMap = contIdToUrlMap;
        this.crud = crud;
    }

    public HttpResponse sendHttpRequest(String URL ,String method, String body) {

        Heroku_Credentials__c herokuCredsObj = Heroku_Credentials__c.getInstance('Authentication_Credentials');
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

    public void execute(QueueableContext context) {  
        Heroku_Credentials__c herokuCredsObj = Heroku_Credentials__c.getInstance('Authentication_Credentials');
        String herokuUrl = herokuCredsObj.Heroku_URL__c;

        if(crud=='Create')  
        {
            List<MpPublicUrl> createBody = prepareRequestBody();
            sendHttpRequest(herokuUrl+'/index.php/api/dakota', 'POST', JSON.serialize(new MpPublicUrlWrppaer(createBody)));
        }    
        else
        {
            List<DeleteMpPublicUrl> delBody = prepareRequestBodyForDelete();
            sendHttpRequest(herokuUrl+'/index.php/api/dakota', 'POST', JSON.serialize(new DeleteMpPublicUrlWrppaer(delBody)));            
        }
        
    }

    private List<MpPublicUrl> prepareRequestBody() {
        List<MpPublicUrl> data = new List<MpPublicUrl>();
        for(String key: contIdToMpIdMap.keySet()){ 
            Datetime lastmodifieddate =System.now();
            data.add(new MpPublicUrl(contIdToMpIdMap.get(key),MpIdToMpNameMap.get(contIdToMpIdMap.get(key)),contIdToUrlMap.get(key),key,contIdToNameMap.get(key),lastmodifieddate));     // mp id, mp name, public url , contentDocId,contentDocName  ,lastmodifieddate
        }
        return data;
    }

    private List<DeleteMpPublicUrl> prepareRequestBodyForDelete() {
        List<DeleteMpPublicUrl> data = new List<DeleteMpPublicUrl>();

        for(String key: contIdToMpIdMap.keySet()){   
            data.add(new DeleteMpPublicUrl(contIdToMpIdMap.get(key),key));     // mp id, contentDocId   
        }
        return data;
    }

    private class MpPublicUrlWrppaer {
        public List<MpPublicUrl> data = new List<MpPublicUrl>();
        public String module= '';
        public Boolean create;
        public MpPublicUrlWrppaer (List<MpPublicUrl> cl) {
            data = cl;
            module = 'content_document_link';
            create = true;
        }
     }
 
     private class MpPublicUrl {
         public String manager_presentation_id = '';
         public String manager_presentation_name = '';
         public String document_id = '';
         public String document_name = '';
         public String url = '';
         public Datetime lastmodifieddate;

         public MpPublicUrl(String mpId,String mpName, String mpUrl,String docId,String docName,Datetime lastmodifieddate) {
            this.manager_presentation_id = mpId;
            this.manager_presentation_name = mpName;
            this.url = mpUrl;
            this.document_id = docId;
            this.document_name = docName;
            this.lastmodifieddate = lastmodifieddate;
         }
     }


     private class DeleteMpPublicUrlWrppaer {
        public List<DeleteMpPublicUrl> data = new List<DeleteMpPublicUrl>();
        public String module= '';
        public Boolean deleted;
        public DeleteMpPublicUrlWrppaer (List<DeleteMpPublicUrl> cl) {
            data = cl;
            module = 'content_document_link';
            deleted = true;
        }
     }
 
     private class DeleteMpPublicUrl {
         public String manager_presentation_id = '';
         public String document_id = '';

         public DeleteMpPublicUrl(String mpId,String docId) {
            this.manager_presentation_id = mpId;
            this.document_id = docId;
         }
     }

}