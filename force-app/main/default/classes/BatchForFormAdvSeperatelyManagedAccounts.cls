global with sharing class BatchForFormAdvSeperatelyManagedAccounts implements Database.Batchable<sObject>, Database.AllowsCallouts{
    public static List<Form_ADV_Schedule_D__c> formDataList = new List<Form_ADV_Schedule_D__c>(); 
    public static List<Schedule_D_Custodian__c> custodiansList = new List<Schedule_D_Custodian__c>(); 
    global Database.QueryLocator start(Database.BatchableContext bc)
    {
        return Database.getQueryLocator([select Id,CRD_No__c,form_ADV_Sep_Managed_Accounts_Flag__c from Form_ADV__c where form_ADV_Sep_Managed_Accounts_Flag__c=false limit 20]);
    }
    global void execute(Database.BatchableContext bc, List<Form_ADV__c> formADVFirmList)
    {   
        Integer count=0;
        for(Form_ADV__c formADVFirm : formADVFirmList)
        {
            try{

                parseAndSaveSeperatelyManagedAccounts(formADVFirm.Id,formADVFirm.CRD_No__c);
            }
            catch(Exception e)
            {
                system.debug(e.getMessage());
            }
            formADVFirm.form_ADV_Sep_Managed_Accounts_Flag__c=true;
            count++;
            if(math.mod(count, 10) == 0) 
            {
                datetime start=system.now();
                while(system.now() < start.addseconds(2)){}
            }
        }
        System.enqueueJob(new QueueableClassFormAdvAndItsChilds(formADVFirmList,formDataList,custodiansList));
    }
    
    global void finish(Database.BatchableContext BC) {
    }

    public static void parseAndSaveSeperatelyManagedAccounts(Id formAdvId,String crdNumber) {
            
        String endpointUrl = System.Label.Form_ADV_API_End_Point +'schedule-d-5-k/' + crdNumber + '?token='+System.Label.Form_D_Authorization_Url;
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpointUrl);
        request.setMethod('GET');
        HttpResponse response = new Http().send(request);
        if (response.getStatusCode() == 200  && !String.isBlank(response.getBody())) {
            Map<String, Object> responseDataMap = (Map<String, Object>)JSON.deserializeUntyped(response.getBody());
            if (!responseDataMap.isEmpty()) {
                
                Map<String, Object> separatelyManagedAccounts = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(responseDataMap.get('1-separatelyManagedAccounts')));
                List<Object> custodiansForSeparatelyManagedAccounts = (List<Object>)JSON.deserializeUntyped(JSON.serialize(responseDataMap.get('3-custodiansForSeparatelyManagedAccounts')));
                
                if (!separatelyManagedAccounts.isEmpty()) {                    
                    
                    processSeparatelyManagedAccounts(separatelyManagedAccounts, formAdvId, crdNumber ,formDataList);
                }
                
                if (!custodiansForSeparatelyManagedAccounts.isEmpty()) {
                    processCustodians(custodiansForSeparatelyManagedAccounts,crdNumber); 
                }
            }
        } else {            
            System.debug('Error: ' + response.getStatusCode() + ' - ' + response.getBody());
        }
    }
    
    public static void processCustodians(List<Object> custodiansForSeparatelyManagedAccounts, String crdNumber) {
        if (!custodiansForSeparatelyManagedAccounts.isEmpty()) {
            
            for (Object custdObj: custodiansForSeparatelyManagedAccounts) {
                Map<String, Object> oj = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(custdObj));
                Schedule_D_Custodian__c custodianData = new Schedule_D_Custodian__c();
                custodianData.CRD_Number__c = crdNumber;
                String legalName =  oj.get('a-legalName') != null ? (String)oj.get('a-legalName') : '';
                custodianData.Name = legalName.length() > 80 ? legalName.substring(0,80) : legalName;
                custodianData.Custodian_Legal_Name__c = (String) oj.get('a-legalName');
                custodianData.Custodian_Business_Name__c = (String) oj.get('b-businessName');
                custodianData.is_Related_Person__c = (Boolean) oj.get('d-isRelatedPerson');
                custodianData.SEC_Registration_Number__c = (String)oj.get('e-secRegistrationNumber');
                custodianData.Legal_Entity_Identifier__c = (String)oj.get('f-lei');
                custodianData.Custodian_AUM__c = (String)oj.get('g-amountHeldAtCustodian');
                List<Object> locationsList = (List<Object>)JSON.deserializeUntyped(JSON.serialize(oj.get('c-locations')));                        
                if (!locationsList.isEmpty()) {
                    Map<String, Object> cLocations = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(locationsList[0]));
                    custodianData.Custodian_Office_City__c = (String) cLocations.get('city');
                    custodianData.Custodian_Office_State__c = (String) cLocations.get('state');
                    custodianData.Custodian_Office_Country__c = (String) cLocations.get('country');
                }
                custodiansList.add(custodianData);
            }   
        }
    }
    
    public static void processSeparatelyManagedAccounts(Map<String, Object> separatelyManagedAccounts, Id formAdvId, String crdNumber,  List<Form_ADV_Schedule_D__c> formDataList) {        
        
        if (!separatelyManagedAccounts.isEmpty()) {
            Form_ADV_Schedule_D__c formData = new Form_ADV_Schedule_D__c();
            formData.CRD_Number__c = Decimal.valueOf(crdNumber); 
            formData.Form_ADV__c =  formAdvId;
            
            for (String level1Key : separatelyManagedAccounts.keySet()) {
                Object value = separatelyManagedAccounts.get(level1Key);                   
                Map<String, Object> separatelyManagedAccounts2 = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(value));                  
                
                for (String level2Key : separatelyManagedAccounts2.keySet()) {                   
                    if (separatelyManagedAccounts2.containsKey(level2Key)) {                            
                        Object value2 = separatelyManagedAccounts2.get(level2Key);
                        
                        try {
                            Map<String, Object> separatelyManagedAccounts3 = null;
                            String separatelyManagedAccountsOther = null;
                            if (level2Key != 'other') {
                                separatelyManagedAccounts3 = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(value2));  
                            } else {
                                
                                
                                separatelyManagedAccountsOther = (String)JSON.deserializeUntyped(JSON.serialize(value2));  
                            }
                            
                            if (level1Key == 'a') {
                                // Process level 1 key 'a'
                                processLevel1A(formData, level2Key, separatelyManagedAccounts3, separatelyManagedAccountsOther);
                            } else if (level1Key == 'b') {
                                // Process level 1 key 'b'
                                processLevel1B(formData, level2Key, separatelyManagedAccounts3, separatelyManagedAccountsOther);
                            }
                        } catch(Exception e) {
                            
                            System.debug('Error in parsing data'+ e.getMessage());
                        }
                    }
                }
            }
            
            formDataList.add(formData);  
        }
    }
    
    private static void processLevel1A(Form_ADV_Schedule_D__c formData, String level2Key, Map<String, Object> separatelyManagedAccounts3, String separatelyManagedAccounts2) {
        // Process level 2 keys for 'a'
        if (level2Key == 'i-exchangeTradedEquity') {
            formData.a_Exchange_Traded_Equity_Mid_Year__c =  (String)separatelyManagedAccounts3.get('midYear');
            formData.a_Exchange_Traded_Equity_End_Year__c =  (String)separatelyManagedAccounts3.get('endOfYear');                                                 
        } else if (level2Key == 'ii-nonExchangeTradedEquity') { 
            formData.a_Non_Exchange_Traded_Equity_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_Non_Exchange_Traded_Equity_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'iii-usGovernmentBonds') { 
            formData.a_US_Government_Bonds_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_US_Government_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'iv-usStateAndLocalBonds') { 
            formData.a_US_State_And_Local_Bonds_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_US_State_And_Local_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'v-sovereignBonds') { 
            formData.a_Sovereign_Bonds_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_Sovereign_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'vi-investmentGradeCorporateBonds') { 
            formData.a_Invest_Grade_Corp_Bonds_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_Invest_Grade_Corp_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'vii-nonInvestmentGradeCorporateBonds') { 
            formData.a_Non_Invest_Grade_Corp_Bonds_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_Non_Invest_Grade_Corp_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'viii-derivatives') { 
            formData.a_Derivatives_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_Derivatives_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'ix-registeredInvestmentCompanies') { 
            formData.a_Registered_Invest_Companies_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_Registered_Invest_Companies_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'x-pooledInvestmentVehicles') { 
            formData.a_Pooled_Investment_Vehicles_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_Pooled_Investment_Vehicles_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'xi-cash') { 
            formData.a_Cash_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_Cash_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'xii-other') { 
            formData.a_Other_Mid_Year__c =  (String) separatelyManagedAccounts3.get('midYear');
            formData.a_Other_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'other') { 
            formData.a_Other_Description__c =  (String) separatelyManagedAccounts2;                                                
        } 
        // Add more conditions as needed
    }
    
    private static void processLevel1B(Form_ADV_Schedule_D__c formData, String level2Key, Map<String, Object> separatelyManagedAccounts3, String separatelyManagedAccounts2) {
        // Process level 2 keys for 'b'
        if (level2Key == 'i-exchangeTradedEquity') {                                        
            formData.b_Exchange_Traded_Equity_End_Year__c =  (String)separatelyManagedAccounts3.get('endOfYear');                                                 
        } else if (level2Key == 'ii-nonExchangeTradedEquity') { 
            formData.b_Non_Exchange_Traded_Equity_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'iii-usGovernmentBonds') { 
            formData.b_US_Government_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'iv-usStateAndLocalBonds') { 
            formData.b_US_State_And_Local_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'v-sovereignBonds') { 
            formData.b_Sovereign_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'vi-investmentGradeCorporateBonds') {
            formData.b_Invest_Grade_Corp_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'vii-nonInvestmentGradeCorporateBonds') {
            formData.b_Non_Invest_Grade_Corp_Bonds_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'viii-derivatives') { 
            formData.b_Derivatives_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'ix-registeredInvestmentCompanies') {
            formData.b_Registered_Invest_Companies_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'x-pooledInvestmentVehicles') { 
            formData.b_Pooled_Investment_Vehicles_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'xi-cash') { 
            formData.b_Cash_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'xii-other') {
            formData.b_Other_End_Year__c =  (String) separatelyManagedAccounts3.get('endOfYear');
        } else if (level2Key == 'other') {
            formData.b_Other_Description__c =  (String) separatelyManagedAccounts2;                                                
        }
    }
}