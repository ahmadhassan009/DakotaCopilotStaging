public with sharing class InfiniteSessionController {
    @AuraEnabled
    public static Boolean isTrailUser(){
        //getting User Account
        List<User> userAccount = [Select Id, LastName, Contact.Account.Active_Draft_Trial__c, Contact.Account.Trial_Start_Date__c From User Where Id =:UserInfo.getUserId()];
        if(userAccount != null && userAccount.size() > 0) {
            if (userAccount[0].Contact.Account.Active_Draft_Trial__c == true && userAccount[0].Contact.Account.Trial_Start_Date__c != null) {
                return true;
            }
        }
        return false;
    }
}