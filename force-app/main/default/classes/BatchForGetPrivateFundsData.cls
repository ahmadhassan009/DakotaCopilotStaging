global with sharing class BatchForGetPrivateFundsData implements Database.Batchable<sObject>, Database.AllowsCallouts{

    public static List<Form_ADV_Private_Fund__c> formAdvPrivateFundsList = new List<Form_ADV_Private_Fund__c>();

    global Database.QueryLocator start(Database.BatchableContext bc)
    {
        return Database.getQueryLocator([select Id,CRD_No__c,form_ADV_Private_Fund_Flag__c from Form_ADV__c where form_ADV_Private_Fund_Flag__c=false limit 20]);
    }
    global void execute(Database.BatchableContext bc, List<Form_ADV__c> formADVFirmList)
    {   
        Integer count=0;
        for(Form_ADV__c formADVFirm : formADVFirmList)
        {
            getPrivateFunds(formADVFirm.Id,formADVFirm.CRD_No__c);
            formADVFirm.form_ADV_Private_Fund_Flag__c=true;
            count++;
            if(math.mod(count, 10) == 0) 
            {
                datetime start=system.now();
                while(system.now() < start.addseconds(2)){}
            }
        }
        System.enqueueJob(new QueueableClassFormAdvAndItsChilds(formADVFirmList,formAdvPrivateFundsList,null));
    }
    
    global void finish(Database.BatchableContext BC) {        
        Database.executeBatch(new BatchForFormAdvSeperatelyManagedAccounts());
    }

    public static void getPrivateFunds(Id formAdvId,String crdNumber) {
        String endpointUrl = System.Label.Form_ADV_API_End_Point + 'schedule-d-7-b-1/' + crdNumber + '?token='+System.Label.Form_D_Authorization_Url;
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpointUrl);
        request.setMethod('GET');
        HttpResponse response = new Http().send(request);
        if (response.getStatusCode() == 200  && !String.isBlank(response.getBody())) {
            storData(response.getBody(), formAdvId, crdNumber);
        } else {
            System.debug('Error: ' + response.getStatusCode() + ' - ' + response.getBody());
        }
    }

    public static Void storData(String result,Id formAdvId,String crdNumber) {

        List<Object> responseData = (List<Object>)JSON.deserializeUntyped(result);
        if (!responseData.isEmpty()) {
            for(Integer i=0; i<responseData.size();i++ ) 
            {
                Form_ADV_Private_Fund__c firmOwner = new Form_ADV_Private_Fund__c(Form_ADV__c =  formAdvId, CRD_Number__c = Integer.valueOf(crdNumber));

                Map<String, Object> responseDataMap = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(responseData[i]));
                firmOwner.Name_of_Private_Fund__c = responseDataMap?.get('1a-nameOfFund') != null ? (String)responseDataMap?.get('1a-nameOfFund') : '';
                String fundName =  responseDataMap?.get('1a-nameOfFund') != null ? (String)responseDataMap?.get('1a-nameOfFund') : '';
                firmOwner.Name = fundName.length() > 80 ? fundName.substring(0,80) : fundName;
                firmOwner.Identification_No__c = responseDataMap?.get('1b-fundIdentificationNumber') != null ? (String)responseDataMap?.get('1b-fundIdentificationNumber') : ''; 

                Map<String, Object> orgStateCountryMap = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(responseDataMap?.get('2-lawOrganizedUnder')));
                firmOwner.Organization_State__c = orgStateCountryMap?.get('state')  != null ? (String)orgStateCountryMap?.get('state') : '';
                firmOwner.Organization_Country__c = orgStateCountryMap?.get('country') != null ? (String)orgStateCountryMap?.get('country') : '';
                firmOwner.Names_of_Partners__c = responseDataMap?.get('3a-namesOfGeneralPartnerManagerTrusteeDirector') != null ? JSON.serialize((List<Object>)responseDataMap?.get('3a-namesOfGeneralPartnerManagerTrusteeDirector')) : '';
                firmOwner.Filing_Advisers__c = responseDataMap?.get('3b-filingAdvisers') != null ? JSON.serialize((Object)responseDataMap?.get('3b-filingAdvisers')) : '';
                firmOwner.Fund_Exclusion_Under_3c1__c = responseDataMap?.get('4-1-exclusionUnder3c1')!= null ? (Boolean)responseDataMap?.get('4-1-exclusionUnder3c1') : false;
                firmOwner.Fund_Exclusion_Under_3c7__c = responseDataMap?.get('4-2-exclusionUnder3c7') != null ? (Boolean)responseDataMap?.get('4-2-exclusionUnder3c7') : false;
                firmOwner.Name_and_Country_of_Authority__c = responseDataMap?.get('5-nameCountryOfForeignFinancialRegAuthority') != null ? JSON.serialize((List<Object>)responseDataMap?.get('5-nameCountryOfForeignFinancialRegAuthority')) : '';
                firmOwner.Is_Master_Fund__c = responseDataMap?.get('6a-isMasterFundInMasterFeederArrangement') != null ? (Boolean)responseDataMap?.get('6a-isMasterFundInMasterFeederArrangement') : false;
                firmOwner.In_Master_Feeder_Agreement__c = responseDataMap?.get('6c-isFeederFundInMasterFeederAgreement') != null ? (Boolean)responseDataMap?.get('6c-isFeederFundInMasterFeederAgreement') : false;
                firmOwner.Name_of_Master_Fund__c = responseDataMap?.get('6d-nameIdOfMasterFund') != null ? (String)responseDataMap?.get('6d-nameIdOfMasterFund') : '';
                firmOwner.Is_Fund_of_Funds__c = responseDataMap?.get('8a-isFundOfFunds') != null ? (Boolean)responseDataMap?.get('8a-isFundOfFunds') : false;
                firmOwner.Funds_Managed_by_You_or_Related_Person__c = responseDataMap?.get('8b-investsInFundsManagedByYouRelatedPerson') != null ? (Boolean)responseDataMap?.get('8b-investsInFundsManagedByYouRelatedPerson') : false;
                firmOwner.Fund_Invest_in_Securities__c = responseDataMap?.get('9-investsInSecuritiesAccordingTo6e') != null ? (Boolean)responseDataMap?.get('9-investsInSecuritiesAccordingTo6e') : false;

                Map<String, Object> typeOfFundMap = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(responseDataMap?.get('10-typeOfFund')));
                firmOwner.Selected_Fund_Types__c = typeOfFundMap?.get('selectedTypes') != null ? JSON.serialize((List<Object>)typeOfFundMap?.get('selectedTypes')) : '';
                firmOwner.Other_Fund_Type__c = typeOfFundMap?.get('otherFundType') != null ? (String)typeOfFundMap?.get('otherFundType') : '';
                firmOwner.Gross_Asset_Value__c = responseDataMap?.get('11-grossAssetValue') != null ? (Long)responseDataMap?.get('11-grossAssetValue') : null;
                firmOwner.Min_Investment_Commitment__c = responseDataMap?.get('12-minInvestmentCommitment')!= null ? (Long)responseDataMap?.get('12-minInvestmentCommitment') : null;
                firmOwner.Number_Of_Beneficial_Owners__c = responseDataMap?.get('13-numberOfBeneficialOwners') != null ? (Long)responseDataMap?.get('13-numberOfBeneficialOwners') : null;
                firmOwner.Percentage_Owned_By_You__c = responseDataMap?.get('14-percentageOwnedByYou') != null ? (Long)responseDataMap?.get('14-percentageOwnedByYou') : null;
                firmOwner.Percentage_Owned_By_Funds_Of_Funds__c = responseDataMap?.get('15a-percentageOwnedByFundsOfFunds') != null ? (Long)responseDataMap?.get('15a-percentageOwnedByFundsOfFunds') : null;
                firmOwner.Sales_Are_Limited__c = responseDataMap?.get('15b-salesAreLimited') != null ? (Boolean)responseDataMap?.get('15b-salesAreLimited') : false;                
                firmOwner.Percentage_OwnedByNonUnitedStatesPersons__c = responseDataMap?.get('16-percentageOwnedByNonUnitedStatesPersons') != null ? (Long)responseDataMap?.get('16-percentageOwnedByNonUnitedStatesPersons') : null;
                firmOwner.Is_Subadviser__c = responseDataMap?.get('17a-isSubadviser') != null ? (Boolean)responseDataMap?.get('17a-isSubadviser') : false;                
                firmOwner.Name_And_Sec_File_Number__c = responseDataMap?.get('17b-nameAndSecFileNumber') != null ? (String)responseDataMap?.get('17b-nameAndSecFileNumber') : '';
                firmOwner.Investment_Advisers_Advise_Fund__c = responseDataMap?.get('18a-investmentAdvisersAdviseFund') != null ? (Boolean)responseDataMap?.get('18a-investmentAdvisersAdviseFund') : false;                
                firmOwner.Clients_Are_Solicited__c = responseDataMap?.get('19-clientsAreSolicited') != null ? (Boolean)responseDataMap?.get('19-clientsAreSolicited') : false;                
                firmOwner.Percentage_Clients_Invested_In_Fund__c = responseDataMap?.get('20-percentageClientsInvestedInFund')!= null ? (Long)responseDataMap?.get('20-percentageClientsInvestedInFund') : null;
                firmOwner.Fund_Relied_On_Exemption__c = responseDataMap?.get('21-fundReliedOnExemption') != null ? (Boolean)responseDataMap?.get('21-fundReliedOnExemption') : false;                
                firmOwner.Form_D_File_Numbers__c = responseDataMap?.get('22-formDFileNumbers') != null ? JSON.serialize((List<Object>)responseDataMap?.get('22-formDFileNumbers')) : '';
                firmOwner.FinancialStatementsAreSubjectToAnnualAud__c = responseDataMap?.get('23a-1-financialStatementsAreSubjectToAnnualAudit') != null ? (Boolean)responseDataMap?.get('23a-1-financialStatementsAreSubjectToAnnualAudit') : false;                
                firmOwner.Financial_Statements_Prepared_WithUsGaap__c = responseDataMap?.get('23a-2-financialStatementsPreparedWithUsGaap')!= null ? (Boolean)responseDataMap?.get('23a-2-financialStatementsPreparedWithUsGaap') : false;                
                firmOwner.FinancialStatementsDistributedToInvestor__c = responseDataMap?.get('23g-financialStatementsDistributedToInvestors')!= null ? (Boolean)responseDataMap?.get('23g-financialStatementsDistributedToInvestors') : false;                
                firmOwner.Fund_Uses_Prime_Brokers__c = responseDataMap?.get('24a-fundUsesPrimeBrokers') != null ? (Boolean)responseDataMap?.get('24a-fundUsesPrimeBrokers') : false;                
                firmOwner.Fund_Uses_Administrators__c = responseDataMap?.get('26a-fundUsesAdministrators') != null ? (Boolean)responseDataMap?.get('26a-fundUsesAdministrators') : false;                
                firmOwner.PercentageOfAssetsValuedNotByRelatedPers__c = responseDataMap?.get('27-percentageOfAssetsValuedNotByRelatedPerson') != null ? (Long)responseDataMap?.get('27-percentageOfAssetsValuedNotByRelatedPerson') : null;
                firmOwner.Fund_Uses_Marketers__c = responseDataMap?.get('28a-fundUsesMarketers')!= null ? (Boolean)responseDataMap?.get('28a-fundUsesMarketers') : false;                
                
                
                /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                firmOwner.Unqualified_Reports_Since_Last_Update__c = responseDataMap?.get('23h-reportsIncludeUnqualifiedOpinions') != null ? (String)responseDataMap?.get('23h-reportsIncludeUnqualifiedOpinions') : '';            
                List<Object> auditorsList = responseDataMap?.get('23b-f-auditors') != null ? (List<Object>)responseDataMap?.get('23b-f-auditors') : null;
                if (!auditorsList.isEmpty()) {
                    Map<String, Object> auditorMap = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(auditorsList[0]));

                    firmOwner.name_of_Independent_Public_Account__c = auditorMap?.get('23b-name')!= null ? (String)auditorMap?.get('23b-name') : '';
                    firmOwner.is_Registered_Account__c = auditorMap?.get('23e-isRegistered') != null ? (Boolean)auditorMap?.get('23e-isRegistered') : false;
                    firmOwner.PCAOB_Assigned_No__c = auditorMap?.get('23e-boardAssignedNumber') != null ? (String)auditorMap?.get('23e-boardAssignedNumber') : '';
                    firmOwner.is_Account_Subject_To_Inspection__c = auditorMap?.get('23f-isSubjectToInspection') != null ? (Boolean)auditorMap?.get('23f-isSubjectToInspection') : false;                    
                    
                    List<Object> recordsLocation =  new List<Object>();
                    recordsLocation.add(auditorMap?.get('23c-location'));
                    Map<String, Object> responseLocationDataMap;
                    if (!recordsLocation.isEmpty()) {
                        responseLocationDataMap = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(recordsLocation[0]));
                        firmOwner.Records_Location_City__c = responseLocationDataMap?.get('city') != null ? (string)responseLocationDataMap?.get('city') : '';
                        firmOwner.Records_Location_State__c = responseLocationDataMap?.get('state') != null ? (string)responseLocationDataMap?.get('state') : '';
                        firmOwner.Records_Location_Country__c = responseLocationDataMap?.get('country') != null ? (string)responseLocationDataMap?.get('country') : '';
                    }
                }
                formAdvPrivateFundsList.add(firmOwner);
            }
        }    
    }
}