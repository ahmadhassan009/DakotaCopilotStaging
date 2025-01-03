public class TriggerOnInvestmentStrategyService {

    public static void updateRelatedAccountsFormD(List<Investment_Strategy__c> newRecs, Map<Id, Investment_Strategy__c> oldRecs)
    {
        List<Id> formDAccIds =new List<Id>();
        if(newRecs!=null)
        {
            for(Investment_Strategy__c invStr: newRecs)
            {
                if(Trigger.isInsert){
                    if(invStr.Account__c != null)
                    {
                        formDAccIds.add(invStr.Account__c);
                    }
                }else{
                    if(invStr.Account__c != oldRecs.get(invStr.id).Account__c)
                    {
                        if(oldRecs.get(invStr.id).Account__c != null)
                        {
                            formDAccIds.add(oldRecs.get(invStr.id).Account__c);
                        }
                        if(invStr.Account__c != null)
                        {
                            formDAccIds.add(invStr.Account__c);
                        }
                    } 
                }                
            }
        }
        if( Trigger.isDelete && oldRecs.values()!=null){
            for(Investment_Strategy__c invStr: oldRecs.values()) {
                if(invStr.Account__c != null) {
                    formDAccIds.add(invStr.Account__c);
                }
            }
        }
        if(formDAccIds.size()>0){
            
            List<Form_D_Offering__c> formDOfferingsToUpdate =new List<Form_D_Offering__c>();
            List<Form_D_Offering__c> formDOfferings = [SELECT id,Marketplace_verified__c, Account__c from Form_D_Offering__c where Account__c IN: formDAccIds ];
    
            Map<Id, Integer> accountInvestmentCountMap = new Map<Id, Integer>();
            List<AggregateResult> invStg = [select count(Id),Account__c from Investment_Strategy__c where Account__c =:formDAccIds group by Account__c];
            if(invStg.size() > 0 ) {
                for (AggregateResult result : invStg) {
                    Id accountId = (Id)result.get('Account__c');
                    Integer count = (Integer) result.get('expr0');
                    accountInvestmentCountMap.put(accountId, count);
                }
            }

            for(Form_D_Offering__c fd2: formDOfferings) {
                String key = fd2.Account__c;                
                if (accountInvestmentCountMap.get(key) > 0) {
                    fd2.Marketplace_verified__c = true;         
                }else{
                    fd2.Marketplace_verified__c = false;    
                }
                formDOfferingsToUpdate.add(fd2);
            }
    
            if(formDOfferingsToUpdate.size() > 0){
                try {
                    update formDOfferingsToUpdate;
                } catch(Exception ex) {
                    system.debug(ex.getMessage());
                } 
            }
        }
       
    }

    public static void updateProductStructureonAccount(List<Investment_Strategy__c> newRecs, Map<Id, Investment_Strategy__c> oldRecs)
    {
        List<Id> accIds = new List<Id>();
        Map<Id,Set<Investment_Strategy__c>> accountToInvstStrategies = new Map<Id,Set<Investment_Strategy__c>>();
        Set<Id> invrIds = new Set<Id>();

        if(newRecs!=null)
        {
            for(Investment_Strategy__c invStr: newRecs)
            {
                invrIds.add(invStr.id);
                if(invStr.Account__c != null && 
                   ((oldRecs!=null && (invStr.Product_Structure__c != oldRecs.get(invStr.id).Product_Structure__c || invStr.Account__c!=oldRecs.get(invStr.id).Account__c)) || 
                   (oldRecs == null && invStr.Product_Structure__c !=null))) 
                {
                    accIds.add(invStr.Account__c);
                    if(accountToInvstStrategies.containsKey(invStr.Account__c)) {
                        Set<Investment_Strategy__c> tempInvStrategySet = accountToInvstStrategies.get(invStr.Account__c);
                        tempInvStrategySet.add(invStr);
                        accountToInvstStrategies.put(invStr.Account__c,tempInvStrategySet);
                    }
                    else {
                        accountToInvstStrategies.put(invStr.Account__c, new Set<Investment_Strategy__c>{invStr});
                    }
                }
            }
        }
        
        if(accountToInvstStrategies.keySet().size() > 0)
        {
            Map<Id, Account> accList = new Map<Id, Account>([SELECT Id, ETF__c,Interval_Fund__c, Product_Structure__c FROM Account WHERE Id IN: accIds]);
            List<String> productStructures = new List<String>{'ETF','BDC','Closed-End Fund','Interval Fund'};
            List<Investment_Strategy__c> allInvestmentStratgies = [SELECT Id, Account__c, Product_Structure__c FROM Investment_Strategy__c 
                                                     WHERE Account__c IN: accIds 
                                                     AND Product_Structure__c In :productStructures];

            for(Investment_Strategy__c invstStrat : allInvestmentStratgies)
            {
                Set<Investment_Strategy__c> tempInvStrategySet = accountToInvstStrategies.get(invstStrat.Account__c);
                tempInvStrategySet.add(invstStrat);
                accountToInvstStrategies.put(invstStrat.Account__c,tempInvStrategySet);
            }

            Map<Id, Boolean> ETFExist = new  Map<Id, Boolean>();
            Map<Id, Boolean> BDCExist = new  Map<Id, Boolean>();
            Map<Id, Boolean> closedEndFundExist = new  Map<Id, Boolean>();
            Map<Id, Boolean> intervalFundExist = new  Map<Id, Boolean>();
            for(Account acc: accList.values())
            {
                ETFExist.put(acc.Id, false);
                BDCExist.put(acc.Id, false);
                closedEndFundExist.put(acc.Id, false);
                intervalFundExist.put(acc.Id, false);
                Set<Investment_Strategy__c> invStrategySet = accountToInvstStrategies.get(acc.Id);
                for(Investment_Strategy__c invr: invStrategySet)
                {
                    if(!invrIds.contains(invr.id) && invr.Account__c == acc.Id && invr.Product_Structure__c == 'ETF' && acc.Product_Structure__c!=null && acc.Product_Structure__c.contains('ETF'))
                        ETFExist.put(acc.Id, true);
                    if(!invrIds.contains(invr.id) && invr.Account__c == acc.Id && invr.Product_Structure__c == 'BDC' && acc.Product_Structure__c!=null && acc.Product_Structure__c.contains('BDC') )
                        BDCExist.put(acc.Id, true);
                    if(!invrIds.contains(invr.id) && invr.Account__c == acc.Id && invr.Product_Structure__c == 'Closed-End Fund' && acc.Product_Structure__c!=null && acc.Product_Structure__c.contains('Closed-End Fund'))
                        closedEndFundExist.put(acc.Id, true);
                    if(!invrIds.contains(invr.id) && invr.Account__c == acc.Id && invr.Product_Structure__c == 'Interval Fund' && acc.Product_Structure__c!=null && acc.Product_Structure__c.contains('Interval Fund'))
                        intervalFundExist.put(acc.Id, true);
                }
            }

            if(accList != null && accList.size()>0)
            {
                for(Investment_Strategy__c invStr: newRecs)
                {
                    if(accList.get(invStr.Account__c) != null && accList.get(invStr.Account__c).Product_Structure__c == null)
                        accList.get(invStr.Account__c).Product_Structure__c = '';
                    if(ETFExist == null || (ETFExist!=null && ETFExist.size()<=0) || (ETFExist!=null && ETFExist.size()>0 && ETFExist.get(invStr.Account__c) != null && !ETFExist.get(invStr.Account__c)))
                    {
                        if(invStr.Product_Structure__c == 'ETF' && !(accList.get(invStr.Account__c).Product_Structure__c.contains('ETF')))
                        {
                            accList.get(invStr.Account__c).Product_Structure__c = accList.get(invStr.Account__c).Product_Structure__c + ';ETF';
                        }
                        else if(!accList.get(invStr.Account__c).ETF__c && 
                                ((oldRecs!=null && invStr.Product_Structure__c==null && oldRecs.get(invStr.id).Product_Structure__c!=null) 
                                || (oldRecs!=null && invStr.Product_Structure__c!=null && invStr.Product_Structure__c != 'ETF' && oldRecs.get(invStr.id).Product_Structure__c == 'ETF')))
                        {	
                            if( accList.get(invStr.Account__c).Product_Structure__c.contains(';ETF'))
                            {
                                accList.get(invStr.Account__c).Product_Structure__c =  accList.get(invStr.Account__c).Product_Structure__c.replace(';ETF','');
                            }
                            else
                            {
                                accList.get(invStr.Account__c).Product_Structure__c =  accList.get(invStr.Account__c).Product_Structure__c.replace('ETF','');
                            }
                        }
                    }
                    if(BDCExist == null || (BDCExist!=null && BDCExist.size()<=0) || (BDCExist!=null && BDCExist.size()>0 && BDCExist.get(invStr.Account__c) != null && !BDCExist.get(invStr.Account__c)))
                    {
                        if(invStr.Product_Structure__c == 'BDC' && !(accList.get(invStr.Account__c).Product_Structure__c.contains('BDC')))
                        {
                            accList.get(invStr.Account__c).Product_Structure__c = accList.get(invStr.Account__c).Product_Structure__c + ';BDC';
                        }
                        else if((oldRecs!=null && invStr.Product_Structure__c==null && oldRecs.get(invStr.id).Product_Structure__c!=null) || (oldRecs!=null && invStr.Product_Structure__c!=null && invStr.Product_Structure__c!='BDC' && oldRecs.get(invStr.id).Product_Structure__c == 'BDC'))
                        {	
                            if(accList.get(invStr.Account__c).Product_Structure__c.contains(';BDC'))
                            {
                                accList.get(invStr.Account__c).Product_Structure__c =  accList.get(invStr.Account__c).Product_Structure__c.replace(';BDC','');
                            }
                            else
                            {
                                accList.get(invStr.Account__c).Product_Structure__c =  accList.get(invStr.Account__c).Product_Structure__c.replace('BDC','');
                            }
                        }
                    }
                    if(closedEndFundExist == null || (closedEndFundExist!=null && closedEndFundExist.size()<=0) || (closedEndFundExist!=null && closedEndFundExist.size()>0 && closedEndFundExist.get(invStr.Account__c) != null && !closedEndFundExist.get(invStr.Account__c)))
                    {
                        if(invStr.Product_Structure__c == 'Closed-End Fund' && !(accList.get(invStr.Account__c).Product_Structure__c.contains('Closed-End Fund')))
                        {
                            accList.get(invStr.Account__c).Product_Structure__c = accList.get(invStr.Account__c).Product_Structure__c + ';Closed-End Fund';
                        }
                        else if((oldRecs!=null && invStr.Product_Structure__c==null && oldRecs.get(invStr.id).Product_Structure__c!=null) || (oldRecs!=null && invStr.Product_Structure__c!=null && invStr.Product_Structure__c!='Closed-End Fund' && oldRecs.get(invStr.id).Product_Structure__c == 'Closed-End Fund'))
                        {	
                            if(accList.get(invStr.Account__c).Product_Structure__c.contains(';Closed-End Fund'))
                            {
                                accList.get(invStr.Account__c).Product_Structure__c =  accList.get(invStr.Account__c).Product_Structure__c.replace(';Closed-End Fund','');
                            }
                            else
                            {
                                accList.get(invStr.Account__c).Product_Structure__c =  accList.get(invStr.Account__c).Product_Structure__c.replace('Closed-End Fund','');
                            }
                        }
                    }
                    if(intervalFundExist == null || (intervalFundExist!=null && intervalFundExist.size()<=0) || (intervalFundExist!=null && intervalFundExist.size()>0 && intervalFundExist.get(invStr.Account__c) != null && !intervalFundExist.get(invStr.Account__c)))
                    {
                        if(invStr.Product_Structure__c == 'Interval Fund' && !(accList.get(invStr.Account__c).Product_Structure__c.contains('Interval Fund')))
                        {
                            accList.get(invStr.Account__c).Product_Structure__c = accList.get(invStr.Account__c).Product_Structure__c + ';Interval Fund';
                        }
                        else if(!accList.get(invStr.Account__c).Interval_Fund__c && 
                                ((oldRecs!=null && invStr.Product_Structure__c==null && oldRecs.get(invStr.id).Product_Structure__c!=null) 
                                || (oldRecs!=null && invStr.Product_Structure__c!=null && invStr.Product_Structure__c != 'Interval Fund' && oldRecs.get(invStr.id).Product_Structure__c == 'Interval Fund')))
                        {	
                            if(accList.get(invStr.Account__c).Product_Structure__c.contains(';Interval Fund'))
                            {
                                accList.get(invStr.Account__c).Product_Structure__c =  accList.get(invStr.Account__c).Product_Structure__c.replace(';Interval Fund','');
                            }
                            else
                            {
                                accList.get(invStr.Account__c).Product_Structure__c =  accList.get(invStr.Account__c).Product_Structure__c.replace('Interval Fund','');
                            }
                        }
                    }
                }
                update accList.values();
            }
        }
    }

     public static void removeProductStructure(List<Investment_Strategy__c> newRecs, Map<Id, Investment_Strategy__c> oldRecs)
     {
         if(oldRecs!=null)
         {
             Set<Id> accIds = new Set<Id>();
             Set<Id> invrIds = new Set<Id>();
             for(Id key: oldRecs.keySet())
             {
                 if(oldRecs.get(key).Account__c!=null && oldRecs.get(key).Product_Structure__c!=null)
                 {
                     invrIds.add(oldRecs.get(key).id);
                     accIds.add(oldRecs.get(key).Account__c);
                 }
             }
             if(newRecs!=null)
             for(Investment_Strategy__c invStr: newRecs)
             {
                 if(oldRecs.get(invStr.Id).Account__c!=null && oldRecs.get(invStr.Id).Product_Structure__c!=null &&
                   (invStr.Account__c==null || invStr.Account__c != oldRecs.get(invStr.Id).Account__c))
                 {
                     invrIds.add(oldRecs.get(invStr.Id).id);
                     accIds.add(oldRecs.get(invStr.Id).Account__c);
                 }
             }
 
             if(accIds.size() > 0 && invrIds.size() > 0)
             {
                 Map<Id, Account> accList = new Map<Id, Account>([SELECT Id, ETF__c,Interval_Fund__c, Product_Structure__c  FROM Account WHERE Id IN: accIds]);
                 Map<Id,Account> accsToBeUpdated = new Map<Id,Account>();

                 List<Investment_Strategy__c> allInvestmentStratgies = [SELECT Id, Account__c, Product_Structure__c FROM Investment_Strategy__c WHERE Account__c IN: accIds AND Product_Structure__c!=NULL];

                 if(accList!=null && accList.size()>0)
                 {
                     Map<Id,Set<Investment_Strategy__c>> accountToInvstStrategies = new Map<Id,Set<Investment_Strategy__c>>();
                     for(Investment_Strategy__c invstStrat : allInvestmentStratgies)
                     {
                         if(accountToInvstStrategies.containsKey(invstStrat.Account__c)) 
                         {
                             Set<Investment_Strategy__c> tempInvStrategySet = accountToInvstStrategies.get(invstStrat.Account__c);
                             tempInvStrategySet.add(invstStrat);
                             accountToInvstStrategies.put(invstStrat.Account__c,tempInvStrategySet);
                         }
                         else 
                         {
                             accountToInvstStrategies.put(invstStrat.Account__c, new Set<Investment_Strategy__c>{invstStrat});
                         }
                     }
                     
                     Map<Id, Boolean> ETFExist = new  Map<Id, Boolean>();
                     Map<Id, Boolean> BDCExist = new  Map<Id, Boolean>();
                     Map<Id, Boolean> closedEndFundExist = new  Map<Id, Boolean>();
                     Map<Id, Boolean> intervalFundExist = new  Map<Id, Boolean>();
                     
                     if(allInvestmentStratgies.size() > 0)
                     {
                         for(Account acc: accList.values())
                         {
                             ETFExist.put(acc.Id, false);
                             BDCExist.put(acc.Id, false);
                             closedEndFundExist.put(acc.Id, false);
                             intervalFundExist.put(acc.Id, false);
                             Set<Investment_Strategy__c> invStrategySet = accountToInvstStrategies.get(acc.Id);
                             for(Investment_Strategy__c invr: invStrategySet)
                             {
                                 if(!invrIds.contains(invr.id) && invr.Account__c == acc.Id && invr.Product_Structure__c == 'ETF' && acc.Product_Structure__c!=null && acc.Product_Structure__c.contains('ETF'))
                                     ETFExist.put(acc.Id, true);
                                 if(!invrIds.contains(invr.id) && invr.Account__c == acc.Id && invr.Product_Structure__c == 'BDC' && acc.Product_Structure__c!=null && acc.Product_Structure__c.contains('BDC') )
                                     BDCExist.put(acc.Id, true);
                                 if(!invrIds.contains(invr.id) && invr.Account__c == acc.Id && invr.Product_Structure__c == 'Closed-End Fund' && acc.Product_Structure__c!=null && acc.Product_Structure__c.contains('Closed-End Fund'))
                                     closedEndFundExist.put(acc.Id, true);
                                 if(!invrIds.contains(invr.id) && invr.Account__c == acc.Id && invr.Product_Structure__c == 'Interval Fund' && acc.Product_Structure__c!=null && acc.Product_Structure__c.contains('Interval Fund'))
                                     intervalFundExist.put(acc.Id, true);
                             }
                         }
                     }
                     
 
                     for(Id key: oldRecs.keySet())
                     {
                         Account account = accList.get(oldRecs.get(key).Account__c);
                         if(account!=null && account.Product_Structure__c != null)
                         {
                             if(ETFExist == null || (ETFExist!=null && ETFExist.size()<=0) || (ETFExist!=null && ETFExist.size()>0 && !ETFExist.get(oldRecs.get(key).Account__c)))
                             {
                                 if(!account.ETF__c && oldRecs.get(key).Product_Structure__c == 'ETF')
                                 {	
                                     if(account.Product_Structure__c.contains(';ETF'))
                                     {
                                         account.Product_Structure__c =  account.Product_Structure__c.replace(';ETF','');
                                     }
                                     else
                                     {
                                         account.Product_Structure__c =  account.Product_Structure__c.replace('ETF','');
                                     }
                                     accsToBeUpdated.put(account.Id,account);
                                 }
                             }
                             if(BDCExist == null || (BDCExist!=null && BDCExist.size()<=0) || (BDCExist!=null && BDCExist.size()>0 && !BDCExist.get(oldRecs.get(key).Account__c)))
                             {
                                 if(oldRecs.get(key).Product_Structure__c == 'BDC')
                                 {	
                                     if(account.Product_Structure__c.contains(';BDC'))
                                     {
                                         account.Product_Structure__c =  account.Product_Structure__c.replace(';BDC','');
                                     }
                                     else
                                     {
                                         account.Product_Structure__c =  account.Product_Structure__c.replace('BDC','');
                                     }
                                     accsToBeUpdated.put(account.Id,account);
                                 }
                             }
                             if(closedEndFundExist == null || (closedEndFundExist!=null && closedEndFundExist.size()<=0) || (closedEndFundExist!=null && closedEndFundExist.size()>0 && !closedEndFundExist.get(oldRecs.get(key).Account__c)))
                             {
                                 if(oldRecs.get(oldRecs.get(key).id).Product_Structure__c == 'Closed-End Fund')
                                 {	
                                     if(account.Product_Structure__c.contains(';Closed-End Fund'))
                                     {
                                         account.Product_Structure__c =  account.Product_Structure__c.replace(';Closed-End Fund','');
                                     }
                                     else
                                     {
                                         account.Product_Structure__c =  account.Product_Structure__c.replace('Closed-End Fund','');
                                     }
                                     accsToBeUpdated.put(account.Id,account);
                                 }
                             }
                             if(intervalFundExist == null || (intervalFundExist!=null && intervalFundExist.size()<=0) || (intervalFundExist!=null && intervalFundExist.size()>0 && !intervalFundExist.get(oldRecs.get(key).Account__c)))
                             {
                                 if(!account.Interval_Fund__c && oldRecs.get(key).Product_Structure__c == 'Interval Fund')
                                 {	
                                     if(account.Product_Structure__c.contains(';Interval Fund'))
                                     {
                                         account.Product_Structure__c =  account.Product_Structure__c.replace(';Interval Fund','');
                                     }
                                     else
                                     {
                                         account.Product_Structure__c =  account.Product_Structure__c.replace('Interval Fund','');
                                     }
                                     accsToBeUpdated.put(account.Id,account);
                                 }
                             }
                         }
                     }
                     if(accsToBeUpdated!=null && accsToBeUpdated.values().size()>0)
                         update accsToBeUpdated.values();
                 }
             }
         }
     }
 }