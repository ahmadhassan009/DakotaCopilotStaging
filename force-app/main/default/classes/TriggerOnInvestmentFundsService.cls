public with sharing class TriggerOnInvestmentFundsService {
    public static void populateform5500Checkbox(List<Investment_Funds__c> newInvestmentFunds,Map<Id, Investment_Funds__c> oldInvestmentFunds)
    {
        
        List<id> newsOrUpdatedAcc = new List<id>();
        List<Investment_Funds__c> newsOrUpdatedRecords = new List<Investment_Funds__c>();
        for(Investment_Funds__c investmentFunds : newInvestmentFunds)
        {
            if((Trigger.isInsert ) || (Trigger.isUpdate && (investmentFunds.Account__c != oldInvestmentFunds.get(investmentFunds.Id).Account__c )))
            {
                newsOrUpdatedAcc.add(investmentFunds.Account__c);
                newsOrUpdatedRecords.add(investmentFunds);
            }
        }
        if(newsOrUpdatedAcc.size()>0)
        {
            Map<ID, Account> relatedAccList = new Map<ID, Account>([Select Id, Name, ACK_ID__c From Account Where Id In :newsOrUpdatedAcc]);

            for(Investment_Funds__c investmentFunds : newsOrUpdatedRecords)
            {
                Account acc = relatedAccList.get(investmentFunds.Account__c);
                if(acc.ACK_ID__c !=null && !String.isBlank(acc.ACK_ID__c))
                {
                    investmentFunds.Form_5500_Account__c=true;
                }  
                else 
                {
                    investmentFunds.Form_5500_Account__c=false;                    
                }       
            }        
        }
        
    }

    public static void resetHerokuSyncFlag(List<Investment_Funds__c> newInvestmentFunds,Map<Id, Investment_Funds__c> oldInvestmentFunds)
    {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('InvestmentFunds');
        helperObj.resetHerokuSyncFlag((List<SObject>)newInvestmentFunds, (Map<Id, SObject>)oldInvestmentFunds);
    }

    public static void deleteRecFromHeroku(Map<Id, Investment_Funds__c> oldInvestmentFunds)
    {
        System.enqueueJob(new DeleteRecFromHeroku(oldInvestmentFunds.keySet(),'InvestmentFunds'));
    }
}