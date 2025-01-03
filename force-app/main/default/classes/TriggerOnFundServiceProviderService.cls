public with sharing class TriggerOnFundServiceProviderService {
    public static void populateform5500Checkbox(List<Fund_Service_Provider__c> newFundServiceProvider,Map<Id, Fund_Service_Provider__c> oldFundServiceProvider)
    {
        List<id> newsOrUpdatedAcc = new List<id>();
        List<Fund_Service_Provider__c> newsOrUpdatedRecords = new List<Fund_Service_Provider__c>();
        for(Fund_Service_Provider__c fundServiceProvider : newFundServiceProvider)
        {
            if((Trigger.isInsert ) || (Trigger.isUpdate && (fundServiceProvider.Account__c != oldFundServiceProvider.get(fundServiceProvider.Id).Account__c )))
            {
                newsOrUpdatedAcc.add(fundServiceProvider.Account__c);
                newsOrUpdatedRecords.add(fundServiceProvider);
            }
        }

        if(newsOrUpdatedAcc.size()>0)
        {
            Map<ID, Account> relatedAccList = new Map<ID, Account>([select Id,Name, ACK_ID__c from Account where Id in :newsOrUpdatedAcc]);

            for(Fund_Service_Provider__c fundServiceProvider : newsOrUpdatedRecords)
            {
                Account acc = relatedAccList.get(fundServiceProvider.Account__c);
                if(acc.ACK_ID__c !=null && !String.isBlank(acc.ACK_ID__c))
                {
                    fundServiceProvider.Form_5500_Account__c=true;
                }  
                else 
                {
                    fundServiceProvider.Form_5500_Account__c=false;                    
                }       
            }        
        }

    }
    public static void resetHerokuSyncFlag(List<Fund_Service_Provider__c> newFundServiceProvider, Map<Id,Fund_Service_Provider__c> oldFundServiceProvider)
    {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('FundServiceProviders');
        helperObj.resetHerokuSyncFlag((List<SObject>)newFundServiceProvider, (Map<Id, SObject>)oldFundServiceProvider);
    }

    public static void deleteRecFromHeroku(Map<Id,Fund_Service_Provider__c> oldFundServiceProvider)
    {
        System.enqueueJob(new DeleteRecFromHeroku(oldFundServiceProvider.keySet(),'FundServiceProviders'));
    }
    
}