global class BatchToUpdateAccountsProductStructure implements Database.Batchable<sObject> {
    String accountIds = '';
    global BatchToUpdateAccountsProductStructure(String accountList)
    {
        this.accountIds = accountList;
    }
    global Database.QueryLocator start(Database.BatchableContext bc) {
        String query = 'SELECT Id,Separate_Account__c,Limited_Partnership__c, ETF__c, CIT__c, Mutual_Fund__c, Product_Structure__c FROM Account WHERE id IN  ('+ accountIds + ')';
        return Database.getQueryLocator(query);
    }
    global void execute(Database.BatchableContext bc, List<Account> accounts){
        List<Id> accIds = new List<Id>();
       
        for(Account acc: accounts)
        {
            accIds.add(acc.Id);
        }
        List<Investment_Strategy__c> invrList = [SELECT Id, Account__c, Product_Structure__c FROM Investment_Strategy__c WHERE Account__c IN: accIds AND Product_Structure__c!=NULL];
        Map<Id, Boolean> ETFExist = new  Map<Id, Boolean>();
        Map<Id, Boolean> BDCExist = new  Map<Id, Boolean>();
        Map<Id, Boolean> closedEndFundExist = new  Map<Id, Boolean>();
        for(Account acc: accounts)
        {
           ETFExist.put(acc.Id, false);
           BDCExist.put(acc.Id, false);
           closedEndFundExist.put(acc.Id, false);
            for(Investment_Strategy__c invr: invrList)
            {
                if(invr.Account__c == acc.Id && invr.Product_Structure__c == 'ETF')
                    ETFExist.put(acc.Id, true);
                if( invr.Account__c == acc.Id && invr.Product_Structure__c == 'BDC')
                    BDCExist.put(acc.Id, true);
                if( invr.Account__c == acc.Id && invr.Product_Structure__c == 'Closed-End Fund')
                    closedEndFundExist.put(acc.Id, true);
            }
        }

        for(Account acc: accounts)
        {
            if(acc.Product_Structure__c == null)
                acc.Product_Structure__c = '';
            if(acc.Mutual_Fund__c == true && !acc.Product_Structure__c.contains('Mutual Fund'))
            {
                acc.Product_Structure__c = acc.Product_Structure__c + ';Mutual Fund';
            }
            if(((ETFExist!=null && ETFExist.size()>0 && ETFExist.get(acc.Id)) || (acc.ETF__c == true)) && !acc.Product_Structure__c.contains('ETF'))
            {
                acc.Product_Structure__c = acc.Product_Structure__c  + ';ETF';
            }
            if(acc.Limited_Partnership__c == true && !acc.Product_Structure__c.contains('Limited Partnership'))
            {
                acc.Product_Structure__c = acc.Product_Structure__c + ';Limited Partnership';
            }
            if(acc.Separate_Account__c == true && !acc.Product_Structure__c.contains('Separate Account'))
            {
                acc.Product_Structure__c = acc.Product_Structure__c + ';Separate Account';
            }
            if(acc.CIT__c == true && !acc.Product_Structure__c.contains('CIT'))
            {
                acc.Product_Structure__c = acc.Product_Structure__c  + ';CIT';
            }

            if(BDCExist!=null && BDCExist.size()>0 && BDCExist.get(acc.Id) && !acc.Product_Structure__c.contains('BDC'))
            {
                acc.Product_Structure__c = acc.Product_Structure__c + ';BDC';
            }

            if(closedEndFundExist!=null && closedEndFundExist.size()>0 && closedEndFundExist.get(acc.Id) && !acc.Product_Structure__c.contains('Closed-End Fund'))
            {
                acc.Product_Structure__c = acc.Product_Structure__c + ';Closed-End Fund';
            }
        }
        Database.update(accounts, false);
    }
    global void finish(Database.BatchableContext bc){
    } 
}