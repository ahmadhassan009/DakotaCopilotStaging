public with sharing class userInfoForGAController {

    @AuraEnabled
    public static Map<String, String> getUserAccountInfo(Id userId)
    {
        List<User> userList=[SELECT Id, Email, Account.Investment_Focus_single__c, Contact.Contact_Type__c, Contact.Role__c FROM User where id=:userId];
        if(userList.size() > 0) {
            List<String> userInfo=new List<String>();
            Map<String, String> userInfoMap=new Map<String, String>();
            userInfoMap.put('email', userList[0].Email);
            userInfoMap.put('Investment_Focus_single__c', userList[0].Account.Investment_Focus_single__c);
            userInfoMap.put('Contact_Type__c', userList[0].Contact.Contact_Type__c);
            userInfoMap.put('Role__c', userList[0].Contact.Role__c);
            return userInfoMap;
        }
        return null;
    } 
}