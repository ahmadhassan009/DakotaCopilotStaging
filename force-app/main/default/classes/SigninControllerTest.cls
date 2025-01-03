@isTest
private class SigninControllerTest {
    
    @IsTest(SeeAllData=true)
    private static void testLogin() {
        // Instantiate a new controller with all parameters in the page
        SigninController controller = new SigninController();
        controller.usernameOrEmail = 'demo.dakota@rolustech.net';
        controller.password = '123456';
        controller.login() ;
    }
    
    static testMethod void testGetEncodedSiteUrl() {
        SigninController controller = new SigninController();
        controller.siteURL = 'https://example.com';
        String result = controller.getEncodedSiteUrl();
        System.assertEquals('https%3A%2F%2Fexample.com', result);
    }
    
    static testMethod void testGetEncodedStartUrl() {
        SigninController controller = new SigninController();
        controller.startURL = '/apex/MyPage';
        String result = controller.getEncodedStartUrl();
        System.assertEquals('%2Fapex%2FMyPage', result);
    }
}