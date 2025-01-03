public with sharing class DataIntegerationsBitCallout  implements Queueable, Database.AllowsCallouts {
    
    List<Account> listToUpdate= new List<Account>();
    Map<Id, String> accountToFlagMap = new Map<Id, String>();
    List<Data_Integration_Creds__mdt> dataIntegerationsMdt = new List<Data_Integration_Creds__mdt>([SELECT Access_Token__c, Heroku_App_URL__c FROM Data_Integration_Creds__mdt WHERE QualifiedApiName='Data_Integrations_Production']);

    public DataIntegerationsBitCallout(List<Account> listToUpdate) 
    {
        this.listToUpdate=listToUpdate;
    }

    public void sendHttpRequest(String URL ,String method, String body) {
        
        String jsonString = '';
        String accessToken = '';
        if(dataIntegerationsMdt.size() > 0){
            accessToken = dataIntegerationsMdt[0].Access_Token__c;
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
        if(Test.isRunningTest()) 
        {
            processResponse('[{\"orgid\":\"0017600000RXDYzAAP\",\"satus\":\"success\",\"message\":\"Client created successfully.\"}]');
            return;
        }
        
        httpRes = http.send(request);
        if(httpRes.getStatusCode() == 200)
        {
            jsonString = httpRes.getBody();
            if (!String.IsBlank(jsonString)) {
                processResponse(jsonString);
            }
        }
    }


    public void execute(QueueableContext context) {
        List<Client> clientList = prepareRequestBody();
        sendHttpRequest(dataIntegerationsMdt[0].Heroku_App_URL__c, 'PUT', JSON.serialize(new updateClientsWrppaer(clientList)));
    }

    private List<client> prepareRequestBody() {
        List<client> data = new List<Client>();
        
        for (Account acc : listToUpdate) {
            accountToFlagMap.put(acc.Id, acc.Data_Integerations__c);
            List<String> crmlist = new List<String>();
            Boolean isActive = false;
            if(String.isNotBlank(acc.Data_Integerations__c)) {
                isActive = true;
                crmlist = acc.Data_Integerations__c.split(';');
            }
            
            data.add(new Client(acc.Id, isActive, crmlist, acc.Is_Trial_User__c));
            
        }
        return data;
    }

    private List<Account> processResponse(String jsonReponse) {
        List<ResponseClass> respListObj;
        ResponseClass respObj = new ResponseClass();
        respListObj = respObj.parse(jsonReponse);

        List<Account> faildAccountList = new List<Account>();
        List<Client> clientsTobeCreated = new List<Client>();
        for (ResponseClass resp : respListObj) {
            if (resp.status == 'error') {   
                faildAccountList.add(new Account(Id = resp.orgid, Data_Integerations__c = accountToFlagMap.get(resp.orgid)));
            }
        }
        if(faildAccountList.size() > 0)  {
            //updating Accounts that were not created
            update faildAccountList;

        }
        return faildAccountList;
    }

    private class updateClientsWrppaer {
        public List<client> data = new List<Client>();
        public updateClientsWrppaer (List<Client> cl) {
            data = cl;
        }
     }
 
     private class Client {
         public String orgid = '';
         public Boolean active = false;
         public Boolean is_trial_user = false;
         public List<String> allowed_crms = new List<String>();
         public Client(String orgId, Boolean active, List<String> allowed_crms,Boolean isTrialUser) {
            this.orgId = orgId;
            this.active = active;
            this.allowed_crms = allowed_crms;
            this.is_trial_user = isTrialUser;
         }
     }

     private class ResponseClass {
        public String orgid = '';
        public String status = '';
        public String message = '';
        public List<ResponseClass> parse(String json) {
            return (List<ResponseClass>) System.JSON.deserialize(json, List<ResponseClass>.class);
        }
        
    }
}