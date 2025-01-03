public class TriggerOnClientBaseService {
    public static void setClientBaseName (List<Client_Base__c> newClientBases,Map<ID, Client_Base__c> oldclientBaseMap)
    {
        Map<ID,Account> accMap = new Map<ID,Account>();        
        for(Client_Base__c cb : newClientBases)
        {
            accMap.put(cb.Account__c,null);        
        }
        accMap = new Map<ID,Account>([Select ID, Name from Account where ID IN :accMap.keySet()]);
        String clientBaseName='';
        for(Client_Base__c cb : newClientBases){
            if((Trigger.isInsert && accMap.containsKey(cb.Account__c)) || 
               (Trigger.isUpdate && (cb.Type__c != oldclientBaseMap.get(cb.ID).Type__c || cb.Account__c!=oldclientBaseMap.get(cb.ID).Account__c) && accMap.containsKey(cb.Account__c)))
            {
                if(cb.Type__c == 'Individuals (other than high net worth individuals)')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' Individual' +' Client'; 
                else if(cb.Type__c == 'High Net Worth Individuals')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' HNW Individual' +' Client'; 
                else if(cb.Type__c == 'Banking or Thrift Institutions')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' Banking/Thrift Institution' +' Client';                
                else if(cb.Type__c == 'Investment Companies')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' Investment Company' +' Client';                
                else if(cb.Type__c == 'Business Development Companies')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' BDC' +' Client';                
                else if(cb.Type__c == 'Pooled Investment Vehicles (other than investment companies and business development companies)')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' +' Pooled Investment Vehicle' +' Client';                
                else if(cb.Type__c == 'Pension and Profit Sharing Plans (but not the plan participants or government pension plans)')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' Pension/Profit Sharing Plan' +' Client';                
                else if(cb.Type__c == 'Charitable Organizations')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' Charitable Organization' +' Client'; 
                else if(cb.Type__c == 'State or Municipal Government Entities (including government pension plans)')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' State/Municipal Gov’t Entity' +' Client';                                
                else if(cb.Type__c == 'Other Investment Advisers')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' Other Investment Adviser' +' Client';                                
                else if(cb.Type__c == 'Insurance Companies')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' Insurance Company' +' Client';                                
                else if(cb.Type__c == 'Sovereign Wealth Funds and Foreign Official Institutions')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' SWF/Foreign Official Institution' +' Client';                                
                else if(cb.Type__c == 'Corporations or Other Businesses Not Listed Above')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' Corporations/Other Business' +' Client';                                
                else if(cb.Type__c == 'Other')                    
                    clientBaseName = accMap.get(cb.Account__c).Name+' -' + ' Other' +' Client';                 
            } 
            if(clientBaseName.length()>80 )
            {  
                Integer extraChars=0;
                String accName; 
                accName= accMap.get(cb.Account__c).Name;            
                extraChars=(clientBaseName.length()-80);
                if(extraChars < accName.length())
                {
                    Integer accLength=accName.length()-extraChars;
                    accName=accName.substring(0,accLength);
                    clientBaseName=clientBaseName.replace(accMap.get(cb.Account__c).Name, accName);
                }  
            }
            if(clientBaseName!='')
            {
                cb.Name=clientBaseName;
            }
        }       
    }
    @testVisible static private List<refreshComponents__e> eventList = new List<RefreshComponents__e>();   
    public static void refreshClientBasePanels(List<Client_Base__c> newClientBases)
    {
        List<refreshComponents__e> refreshRecordEvents = new List<refreshComponents__e>();
        for (Client_Base__c ClientBase : newClientBases) {
            refreshRecordEvents.add(new refreshComponents__e(
                recordUsed__c = ClientBase.Account__r.ID,
                UserUsed__c = UserInfo.getUserId(),
                userSession__c=UserInfo.getSessionId()
            ));
            eventList.addAll(refreshRecordEvents);
        }
        EventBus.publish(refreshRecordEvents);
    }
    
    public static void updateNumberofQPsInParentAccount(List<Client_Base__c> newClientBases,Map<Id, Client_Base__c> oldclientBaseMap)
    {
        Map<Id,Decimal> accountIdToQPsCount = new Map<Id,Decimal>();
        List<Client_Base__c> clientBaseListToBeUsed = Trigger.IsDelete == true ? oldclientBaseMap.values() : newClientBases;
        
        for(Client_Base__c clientBase :clientBaseListToBeUsed)
        {
            if(clientBase.Account__c != null &&
               (Trigger.IsDelete &&  clientBase.Type__c == 'High Net Worth Individuals') ||
               (Trigger.IsInsert && clientBase.Number_of_Clients__c != null) ||
               (Trigger.IsUpdate && (clientBase.Number_of_Clients__c != oldclientBaseMap.get(clientBase.Id).Number_of_Clients__c ||
                                     clientBase.Type__c != oldclientBaseMap.get(clientBase.Id).Type__c ||
                                     clientBase.Account__c != oldclientBaseMap.get(clientBase.Id).Account__c)))
            {
                accountIdToQPsCount.put(clientBase.Account__c,0);
            }
            if(Trigger.IsUpdate && clientBase.Account__c != oldclientBaseMap.get(clientBase.Id).Account__c && oldclientBaseMap.get(clientBase.Id).Account__c != null)
            {
                accountIdToQPsCount.put(oldclientBaseMap.get(clientBase.Id).Account__c,0);
            }
        }
        
        if(accountIdToQPsCount.keySet().size() > 0)
        {
            for (AggregateResult aggRes : [Select Account__c , MAX(Number_of_Clients__c) maxNumOfClients from Client_Base__c where Account__c In :accountIdToQPsCount.keySet() and Type__c = 'High Net Worth Individuals' Group by Account__c]) 
            {
                Id parentAccountId = (Id) aggRes.get('Account__c');
                Decimal maxNumOfClients = (Decimal) aggRes.get('maxNumOfClients');
                maxNumOfClients = (maxNumOfClients == null) ? 0 : Integer.valueOf(maxNumOfClients * 0.3);
                accountIdToQPsCount.put(parentAccountId,maxNumOfClients);
            }

            List<Account> accountsToBeUpdated = new List<Account>();
            for(Account account : [Select Id,Number_of_QPS__c from Account where Id in :accountIdToQPsCount.keySet()])
            {
                if(accountIdToQPsCount.containsKey(account.Id))
                {
                    account.Number_of_QPS__c = accountIdToQPsCount.get(account.Id) == 0 ? null : accountIdToQPsCount.get(account.Id) ;
                    accountsToBeUpdated.add(account);
                }
            }
            update accountsToBeUpdated;
        }
    }
}