/**
 * An apex page controller that exposes the site login functionality
 */
global without sharing class SigninController {
    public Boolean isLoginFailed {get; set;}
    global String usernameOrEmail {get; set;}
    global String rememberMe {get; set;}
    global String password {get; set;}
    public String siteURL  {get; set;}
    public String startURL {get; set;}
    public String iframeURL {get; set;}
    public String errorMsg {get {return errorMsg;} set {errorMsg = 'Please check your username/email and password. If you still can’t log in, contact your Dakota Marketplace administrator.';}}
    
    global SigninController () {
        siteURL  = Site.getBaseUrl();
        startURL = System.currentPageReference().getParameters().get('startURL');
        if (startURL == null) startURL = '/';
        iframeURL = System.Label.Marketplace_Login_Iframe;

        
    }

    global PageReference login() {
        String emailaddr = '';
        List<User> userList = [Select id,username from User where Email=:usernameOrEmail and Profile.UserLicense.Name='Customer Community Plus' and isActive = true ];
        if(userList != null && userList.size() == 1) {
            emailaddr = usernameOrEmail;
            usernameOrEmail = userList[0].username;
        }

        PageReference ref= Site.login(usernameOrEmail, password, startURL);

        if(ref==null)
        {
            errorMsg = 'Please check your username/email and password. If you still cant log in, contact your Dakota Marketplace administrator.';
            if(userList.size() == 1) {
                usernameOrEmail = emailaddr;
            }
            isLoginFailed=true;
            return null;
        }

        ref.setRedirect(true);
    
        return ref;
    }
    
    global String getEncodedSiteUrl() {
        return EncodingUtil.urlEncode(siteURL, 'UTF-8');
    }
    
    global String getEncodedStartUrl() {
        return EncodingUtil.urlEncode(startURL, 'UTF-8');
    }
    
}