/**
 * An apex page controller that exposes the site login functionality
 */
global with sharing class CommunitiesLoginController {

    public String SSOUrl = '';
    public String SSOFlag = 'false';
    public String SSOkey { get; set; }
    public String label { get; set; }

    global PageReference CommunitiesLoginController() {
        return loginPage();
    }
    //global CommunitiesLoginController () {}
    
    global PageReference loginPage() {
        Map<String, String> urlParamters = new Map<String, String>();
        List<SSO_Config__mdt> ssoConfigList = new List<SSO_Config__mdt>([SELECT Id, Label, DeveloperName, IDP_Initiated_URL__c, SSO_Key__c FROM SSO_Config__mdt]);
        if(Test.isRunningTest()) {
            urlParamters.put('withOkta', '/CommunitiesLogin?withOkta=true');
        }
        else {
            urlParamters =  ApexPages.currentPage().getParameters();
        }
        //looping through MDT list to see if config key is provided in the URL
        for (SSO_Config__mdt config : ssoConfigList) {
            if(urlParamters.containsKey(config.SSO_Key__c)) {
                SSOFlag = urlParamters.get(config.SSO_Key__c);
                SSOUrl = config.IDP_Initiated_URL__c;
                label = config.Label;
                SSOkey = config.SSO_Key__c+'.png';
                break;
            }
        }
        if (SSOFlag == 'true') {
            return null;
        }
        return forwardToAuthPage();

    }

    global PageReference forwardToSSOPage() {
        PageReference ssoPage = new PageReference(SSOUrl);
        ssoPage.setRedirect(true);
        return ssoPage;
    }

    // Code we will invoke on page load.
    global PageReference forwardToAuthPage() {
        String communityUrl = Site.getBaseUrl();
        String startUrl = System.currentPageReference().getParameters().get('startURL');
        if (startUrl == null) startUrl = '';
        String displayType = System.currentPageReference().getParameters().get('display');
        return new PageReference(communityUrl + '/SigninUI');
    }
}