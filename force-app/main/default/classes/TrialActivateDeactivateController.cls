public class TrialActivateDeactivateController {

    @AuraEnabled
    public static boolean changeAccountTrialStatus(Id recordId)
    {
        Account acct = [Select Id,Name,Active_Draft_Trial__c,Trial_Start_Date__c,Trial_End_Date__c,Marketplace_Trial__c from Account where Id = :recordId];
        if(acct.Active_Draft_Trial__c == false)
        {
            acct.Active_Draft_Trial__c = true;
            acct.Marketplace_Trial__c = true;
            acct.Trial_Start_Date__c = Date.today();
            update acct;
            return true;
        }
        else
        {
            acct.Active_Draft_Trial__c = false;
            acct.Trial_End_Date__c = Date.today();
            update acct;
            return false;
        }
    }
}