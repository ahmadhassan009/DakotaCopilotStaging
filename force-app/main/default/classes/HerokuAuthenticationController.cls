public  class HerokuAuthenticationController {

    public class Authentication{
        public String grant_type;
        public String username; 
        public String password; 
        
        public Authentication(){
            this.grant_type = 'password';
        }
    }

    public class OAuthResponse {
        public String access_token;
        public String refresh_token; 
    }

    @AuraEnabled
    public static String getDakotaAccessTokenOnAuthentication(){

        Heroku_Credentials__c herokuCredsObj = Heroku_Credentials__c.getInstance('Authentication_Credentials');
       
        Authentication authWrapperObj = new Authentication();
        authWrapperObj.username = herokuCredsObj.Username__c;
        authWrapperObj.password = herokuCredsObj.Password__c;
        
        HttpRequest httpReq = new HttpRequest();
        HttpResponse httpRes = new HttpResponse();
        Http http = new Http();
        httpReq.setMethod('POST');
        httpReq.setEndPoint(herokuCredsObj.Heroku_URL__c+'/index.php/api/oauth2');
        httpReq.setHeader('Accept', 'application/json');
        httpReq.setHeader('Content-Type', 'application/json');
        httpReq.setTimeout(120000);
        httpReq.setBody(JSON.serialize(authWrapperObj));

        try 
        {
            httpRes = http.send(httpReq);
            if(httpRes.getStatusCode()==200)
            {
                OAuthResponse response =  (OAuthResponse)Json.deserialize(httpRes.getbody(), OAuthResponse.class);
                String accTok = response.access_token;
                herokuCredsObj.Access_Token__c = accTok;

                Datetime now = Datetime.now();
                herokuCredsObj.Expiry_Date__c = now.addMinutes(55);
                
                return accTok;
            }
        }
        catch(Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }
        return null;
    }


}