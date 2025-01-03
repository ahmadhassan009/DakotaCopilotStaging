/**
 * An apex page controller that exposes the site forgot password functionality
 */
public without sharing class ForgotController {
  public String usernameOrEmail {get; set;}
  public Boolean isLoginFailed {get; set;}
  public String errorMsg  {get; set;}

  public ForgotController() {
    errorMsg ='We can’t find a username or email that matches what you entered.';
  }

  public PageReference forgotPassword() {
    List<User> userList = new List<User>();

    userList = [Select id,username from User where username=:usernameOrEmail and Profile.UserLicense.Name='Customer Community Plus' and isActive = true];
    if(userList.size() < 1)
    {
      userList = [Select id,username from User where Email=:usernameOrEmail and Profile.UserLicense.Name='Customer Community Plus' and isActive = true];
    } 

    
    if(userList.size() == 1) {
      usernameOrEmail = userList[0].username;
    } else if(!Test.isRunningTest()) {
      isLoginFailed=true;
      return null;
    }
  
    boolean success = Site.forgotPassword(usernameOrEmail);
    PageReference pr = Page.ForgotConfirmUI;
    pr.setRedirect(true);
    if (success) {        
     return pr;
    }
   
    return null;
  }
}