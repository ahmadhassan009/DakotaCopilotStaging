@isTest
public with sharing class ForgotControllerTest {
    @IsTest(SeeAllData=true)
    private static void testLogin() {
        // Instantiate a new controller with all parameters in the page
        ForgotController forgotObj = new ForgotController();
        forgotObj.usernameOrEmail = 'demo.dakota@rolustech.net';
        forgotObj.forgotPassword() ;
        forgotObj.usernameOrEmail = 'demo.dakota@rolustech.net.marketplace.com';
        forgotObj.forgotPassword() ;
    }
}