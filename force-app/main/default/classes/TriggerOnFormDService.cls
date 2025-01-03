public with sharing class TriggerOnFormDService {
    
    public static void updateRelatedRecordsMpVerifiedCheck(List<Form_D_Offering__c> newFormDList, Map<Id, Form_D_Offering__c> oldFormDMap)
    {
        List<SEC_API_Related_Person__c> recordsToUpdateList=new List<SEC_API_Related_Person__c>();
        List<Id> formDIds =new List<Id>();
        if(Trigger.isDelete) {
            for(Form_D_Offering__c fd: oldFormDMap.values()) {
                if(fd.Marketplace_verified__c==true)
                {
                    formDIds.add(fd.Id);
                }
            }
            recordsToUpdateList = [SELECT id,Marketplace_verified__c from SEC_API_Related_Person__c where Marketplace_verified__c=true and Form_D_Offering__c=null limit 9999];
            for(SEC_API_Related_Person__c sec: recordsToUpdateList) {
                sec.Marketplace_verified__c =  false;
            }
        }else{
            
            for(Form_D_Offering__c fd: newFormDList) {
                if(fd.Marketplace_verified__c != oldFormDMap.get(fd.Id).Marketplace_verified__c)
                {
                    formDIds.add(fd.Id);
                }
            }
            recordsToUpdateList = [SELECT id,Marketplace_verified__c,Form_D_Offering__r.Marketplace_verified__c from SEC_API_Related_Person__c where Form_D_Offering__c IN: formDIds limit 9999];
            for(SEC_API_Related_Person__c sec: recordsToUpdateList) {
                sec.Marketplace_verified__c = sec.Form_D_Offering__r.Marketplace_verified__c;
            }
        }
         
        if(recordsToUpdateList.size() > 0){
            try {
                update recordsToUpdateList;
            } catch(Exception ex) {
                system.debug(ex.getMessage());
            } 
        }
    }

    public static void formdMpVeifiedCheckbox(List<Form_D_Offering__c> newFormDList)
    {
        if(TriggerOnFormDHandler.runOnce()){

            List<Id> formDIds =new List<Id>();
            for(Form_D_Offering__c fd: newFormDList) {
                formDIds.add(fd.Id);
            }
            List<Form_D_Offering__c> formDOfferingsToUpdate =new List<Form_D_Offering__c>();
            List<Form_D_Offering__c> formDOfferings = [SELECT id,Marketplace_verified__c,Filed_At__c, Name_Issuer__c, Industry_Group_Fund_Type__c, Name, Account__c, Account__r.Name   , Asset_Class__c, Sub_Asset_Class__c, Date_of_First_Sale__c, Total_Amount_Sold__c, Total_Number_Already_Invested__c, Recipient_Address__City__s,Recipient_Address__CountryCode__s from Form_D_Offering__c where Filed_At__c >= 2024-01-01T12:00:00.0000+00:00 and (Entity_Type__c in ('Limited Partnership', 'General Partnership') or  Act_of_1940__c =true)  and New_Notice__c =true and (NOT Name_Issuer__c LIKE '%a series%') and (NOT Name_Issuer__c LIKE '%spv%') and (Account__c <> null and Account__r.Name <> '') and Not_Applicable__c <> true and Id IN: formDIds ];

            if(formDOfferings.size() > 0 ) {
                List<Id> accIds = new List<Id>();
                for(Form_D_Offering__c fd: formDOfferings) {
                    accIds.add(fd.Account__c);
                    Integer indexToRemove = formDIds.indexOf(fd.Id);
                    formDIds.remove(indexToRemove);
                }
                Map<Id, Integer> accountInvestmentCountMap = new Map<Id, Integer>();
                List<AggregateResult> invStg = [select count(Id),Account__c from Investment_Strategy__c where Account__c =:accIds group by Account__c];
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
            }

            if(Trigger.isUpdate && formDIds.size()>0) {
                List<Form_D_Offering__c> formDOfferingsRemaining = [SELECT id,Marketplace_verified__c from Form_D_Offering__c where Id IN: formDIds ];
                for(Form_D_Offering__c fd3: formDOfferingsRemaining) {
                    if(formDIds.contains(fd3.Id)){
                        fd3.Marketplace_verified__c=false;
                        formDOfferingsToUpdate.add(fd3);
                    }
                }
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
}