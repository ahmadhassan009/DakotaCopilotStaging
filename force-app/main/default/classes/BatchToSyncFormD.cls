global with sharing class BatchToSyncFormD implements Database.Batchable<String>, Database.AllowsCallouts, Database.stateful{
    private Integer totalCount;
    private Integer fromOffset;
    private String nextOffset;
    public static FormDSyncedDate__c formDStartDate = FormDSyncedDate__c.getInstance('StartDate');    
    public List<Form_D_Offering__c> formdList;
    public List<SEC_API_Related_Person__c> relatedPersonList;
    public List<String> secIdList;
    private Boolean isUpdated;
    public Id relatedPersonRecId = Schema.SObjectType.SEC_API_Related_Person__c.getRecordTypeInfosByDeveloperName().get('Related_Person').getRecordTypeId();
    public Id recipientsRecId = Schema.SObjectType.SEC_API_Related_Person__c.getRecordTypeInfosByDeveloperName().get('Recipients').getRecordTypeId();
    
    public BatchToSyncFormD(Integer fromOffset,Boolean isUpdated) {
        this.totalCount = 0;
        this.isUpdated = isUpdated;
        this.fromOffset = fromOffset;           
        formdList = new List<Form_D_Offering__c>();
        relatedPersonList = new List<SEC_API_Related_Person__c>();
        secIdList = new List<String>();        
    }

    global Iterable<String> start(Database.BatchableContext BC){
        String StartDate = formDStartDate.StartDate__c;
        //DateTime inputDateTime = DateTime.valueOf(StartDate + ' 00:00:00');
        //DateTime resultDateTime = inputDateTime.addMonths(1);
        this.nextOffset = StartDate;//resultDateTime.format('yyyy-MM-dd');
        List<String> responseQuery = new List<String>();   
        String query='{"query": {"query_string": {"query": "filedAt:['+StartDate+' TO '+this.nextOffset+' ] AND offeringData.typeOfFiling.newOrAmendment.isAmendment:'+this.isUpdated+'"}}, "from": "'+this.fromOffset+'", "size": "50", "sort": [{"filedAt": {"order": "desc"}}]}';   
        responseQuery.add(query);
        return responseQuery;
    }
    
    global void execute(Database.BatchableContext BC, List<String> responseQuery){       
        String endpoint = System.Label.Form_D_API_End_Point;
        String authorizationHeader = System.Label.Form_D_Authorization_Url;
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('POST');
        request.setHeader('Authorization', authorizationHeader);
        request.setHeader('Content-Type', 'application/json');
        request.setBody(responseQuery[0]);
        Http http = new Http();
        HttpResponse response = http.send(request);

        if (response.getStatusCode() == 200) {
            String responseBody = response.getBody();
            FormDWarapper result= FormDWarapper.parse(responseBody);
            storData(result);
        } else {
            ///sending email in case of failure.
            String filterBodyToBePassedInReq = 'HTTP Callout failed with status code: ' + response.getStatusCode();
            filterBodyToBePassedInReq += 'Response body: ' + response.getBody();
            List<Messaging.SingleEmailMessage> lstAllMails = new List<Messaging.SingleEmailMessage>();           
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setSubject('Form D Sync Scheduler Exception');
            mail.setToAddresses(new list<string>{'draftcrmdev@rolustech.com'});
            mail.setPlainTextBody(filterBodyToBePassedInReq);
            mail.setSaveAsActivity(false);
            lstAllMails.add(mail);
            Messaging.sendEmail(lstAllMails,false);
        }     
        try {
            if(formdList.size()>0)
            {
                Database.upsert(formdList, Form_D_Offering__c.Fields.Previous_Accession_No__c, true);
            }
        } catch(Exception ex) {
            System.debug(ex.getMessage());
        }  

        List<Form_D_Offering__c> formdRecordsList = [Select Id,Previous_Accession_No__c,Accession_No__c,SEC_Id__c from Form_D_Offering__c where SEC_Id__c IN :secIdList];
        Map<String,Id> formdSecIdToIdMap = new Map<String,Id>();
        for(Form_D_Offering__c formD : formdRecordsList) {
            formdSecIdToIdMap.put(formD.SEC_Id__c, formD.Id);
            formD.Previous_Accession_No__c =  formD.Accession_No__c;
        }
        if(formdRecordsList.size()>0)
        {
            update formdRecordsList;
        }
        
        relatedPersonList = assignFormDLookup(relatedPersonList, formdSecIdToIdMap);

        if(this.isUpdated == true) {
            Set<Id> formdIds = new Set<Id>();
            List<SEC_API_Related_Person__c> relatedPersonsRecordsList = [Select Id,Form_D_Offering__c from SEC_API_Related_Person__c where Form_D_Offering__c IN :formdSecIdToIdMap.values()];
            if(relatedPersonsRecordsList.size()>0) {
                for(SEC_API_Related_Person__c relatedPerson : relatedPersonsRecordsList) {
                    formdIds.add(relatedPerson.Form_D_Offering__c);
                }  
                relatedPersonList = removeObjectById(relatedPersonList,formdIds,'Form_D_Offering__c');
            }
        }
        
        try {
            if(relatedPersonList.size()>0) {
                insert relatedPersonList;
            }
        } catch(Exception ex) {
            System.debug(ex.getMessage());
        } 
    }
    
    global void finish(Database.BatchableContext BC) {
        if(this.fromOffset + 50 <= this.totalCount) {
            Database.executeBatch(new BatchToSyncFormD(this.fromOffset + 50,this.isUpdated));
        }
        else if(this.isUpdated == false) {
            this.isUpdated = true;
            this.fromOffset = 0;
            Database.executeBatch(new BatchToSyncFormD(this.fromOffset,this.isUpdated));
        }
        else {
            DateTime inputDateTime = DateTime.valueOf(this.nextOffset + ' 00:00:00');
            DateTime resultDateTime = inputDateTime.addDays(1);
            formDStartDate.StartDate__c = resultDateTime.format('yyyy-MM-dd');
            update formDStartDate;
            //save next offset in custom settings
        }
    }

    public static List<SEC_API_Related_Person__c> assignFormDLookup(List<SEC_API_Related_Person__c> relatedPersonList, Map<String,Id> formdSecIdToIdMap) {
        List<SEC_API_Related_Person__c> filteredList = new List<SEC_API_Related_Person__c>();  
        for(SEC_API_Related_Person__c relatedPerson : relatedPersonList) {
            if(formdSecIdToIdMap.get(relatedPerson.SEC_Id__c)!=null)
            {
                relatedPerson.Form_D_Offering__c = formdSecIdToIdMap.get(relatedPerson.SEC_Id__c);
                filteredList.add(relatedPerson);
            }
        }      
        return filteredList;
    }

    public static List<SEC_API_Related_Person__c> removeObjectById(List<SEC_API_Related_Person__c> objectList, Set<Id> idsToRemove, String fieldToCompare) {
        List<SEC_API_Related_Person__c> filteredList = new List<SEC_API_Related_Person__c>();        
        for (SEC_API_Related_Person__c obj : objectList) {
            Id fieldValue = (Id) obj.get(fieldToCompare);
            if (fieldValue != null && !idsToRemove.contains(fieldValue)) {
                filteredList.add(obj);
            }
        }        
        return filteredList;
    }

    public string checkNameFields(string name) {
        List<String> junkDataList = new List<String>{'NA', 'N/A', 'n/a', 'na','-','--','(N/A)','(none)','[none]','[entity]','*'};
        if (junkDataList.contains(name)) {
            return '';
        } else {
            return name;
        }
    }

    public string createStatesOfSolicitation(List<FormDWarapper.StatesOfSolicitationList> statesOfSolicitationList) {        
        String statesOfSolicitation='';
        if(statesOfSolicitationList!=null && statesOfSolicitationList.size()>0) {
            for(FormDWarapper.StatesOfSolicitationList state: statesOfSolicitationList) {
                if(state.value!=null) {
                    statesOfSolicitation = state.value;
                }
                else {
                    statesOfSolicitation += statesOfSolicitation!='' ? ', ' : '';
                    statesOfSolicitation += state.state + (state.description !=null ? '(' + state.description + ')' : '');
                }
            }            
        }
        return statesOfSolicitation;
    }

    public  Void storData(FormDWarapper result) {
        
        Map<String,boolean> accessionNoAndIsAmend= new Map<String,boolean>();
        this.totalCount = result?.total?.value;
        for(Integer i=0; i<result.offerings.size();i++ ) {
            secIdList.add(result.offerings[i].id);
            String dateString = result.offerings[i].filedAt;
            String datePart = dateString.substring(0, 10);
            String timePart = dateString.substring(11, 19);
            String timeZoneOffsetPart = dateString.substring(19);
            Datetime parsedDatetime = Datetime.valueOf(datePart+' '+timePart);
            Integer timeZoneOffsetMinutes = Integer.valueOf(timeZoneOffsetPart.substring(0, 3)) * 60 + Integer.valueOf(timeZoneOffsetPart.substring(4));
            parsedDatetime = parsedDatetime.addMinutes(timeZoneOffsetMinutes);
            
            String yearOfIncome = (result.offerings[i]?.primaryIssuer != null && result.offerings[i]?.primaryIssuer?.yearOfInc!= null && result.offerings[i]?.primaryIssuer?.yearOfInc?.withinFiveYears != null &&  result.offerings[i]?.primaryIssuer?.yearOfInc?.withinFiveYears)? result.offerings[i].primaryIssuer.yearOfInc.value: '';
            String fiveYears = (result.offerings[i]?.primaryIssuer != null && result.offerings[i]?.primaryIssuer?.yearOfInc!= null && result.offerings[i]?.primaryIssuer?.yearOfInc?.withinFiveYears != null &&  result.offerings[i]?.primaryIssuer?.yearOfInc?.withinFiveYears)? 'Within Last Five Years': 'Over Five Years Ago';
           
            String relatedPersonName = result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonName?.lastName;
            relatedPersonName = result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonName?.middleName !=null ? checkNameFields(result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonName?.middleName) + ' ' + relatedPersonName : '' + relatedPersonName ;
            relatedPersonName = result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonName?.firstName !=null ? checkNameFields(result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonName?.firstName) + ' ' + relatedPersonName : '' + relatedPersonName;
            String relationshipsOfRelatedPerson = result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonRelationshipList?.relationship !=null ? String.join(result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonRelationshipList?.relationship, ',') : '';
            String clarificationOfResponseRelatedPerson = result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relationshipClarification !=null ? result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relationshipClarification : '';

            String recipientName = (result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null) ? result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.recipientName : '';
            String recipientCRDNumber = (result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null) ? result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.recipientCRDNumber : '';
            String associatedBDName = (result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null) ? result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.associatedBDName : '';
            String associatedBDCRDNumber = (result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null) ? result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.associatedBDCRDNumber : '';
            String recipientStreet = (result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null) ? result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.recipientAddress?.street1 : '';
            String recipientCity = (result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null) ? result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.recipientAddress?.city : '';
            String recipientZipCode = (result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null) ? result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.recipientAddress?.zipCode : '';
            boolean foreignSolicitation =(result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.foreignSolicitation !=null) ? result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.foreignSolicitation : false;
            
            boolean isAmendment = result.offerings[i]?.offeringData?.typeOfFiling?.newOrAmendment?.isAmendment !=null ? result.offerings[i]?.offeringData?.typeOfFiling?.newOrAmendment?.isAmendment : false;
            String previousAccessionNumber =  isAmendment == true ? result.offerings[i]?.offeringData?.typeOfFiling?.newOrAmendment?.previousAccessionNumber : result.offerings[i].accessionNo;
                
            List<FormDWarapper.StatesOfSolicitationList> statesOfSolicitationList = (result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null) ? result.offerings[i]?.offeringData?.salesCompensationList?.recipient[0]?.statesOfSolicitationList : null;
            String statesOfSolicitation = createStatesOfSolicitation(statesOfSolicitationList);

/////////////////////////Related Persons///////////
            if(result.offerings[i]?.relatedPersonsList != null && result.offerings[i]?.relatedPersonsList?.relatedPersonInfo != null)
            {
                List<FormDWarapper.relatedPersonInfo> relatedPersonInfoList = result.offerings[i]?.relatedPersonsList?.relatedPersonInfo;
                for(Integer j=0; j < relatedPersonInfoList.size(); j++ )
                {
                    String relatedPersonFullName = relatedPersonInfoList[j]?.relatedPersonName?.lastName;
                    relatedPersonFullName = relatedPersonInfoList[j]?.relatedPersonName?.middleName !=null ? checkNameFields(relatedPersonInfoList[j]?.relatedPersonName?.middleName) + ' ' + relatedPersonFullName : '' + relatedPersonFullName ;
                    relatedPersonFullName = relatedPersonInfoList[j]?.relatedPersonName?.firstName !=null ? checkNameFields(relatedPersonInfoList[j]?.relatedPersonName?.firstName) + ' ' + relatedPersonFullName : '' + relatedPersonFullName;
            
                    SEC_API_Related_Person__c relatedPerson = new SEC_API_Related_Person__c(
                        recordTypeId =  relatedPersonRecId,
                        SEC_Id__c = result.offerings[i].id,
                        Related_Person_Address__Street__s = relatedPersonInfoList[j]?.relatedPersonAddress?.street1,
                        Street2__c = relatedPersonInfoList[j]?.relatedPersonAddress?.street2,
                        Related_Person_Address__City__s = relatedPersonInfoList[j]?.relatedPersonAddress?.city,
                        Related_Person_Address__PostalCode__s = relatedPersonInfoList[j]?.relatedPersonAddress?.zipCode,
                        Country_Code__c = relatedPersonInfoList[j]?.relatedPersonAddress?.stateOrCountry,
                        Country_Description__c = relatedPersonInfoList[j]?.relatedPersonAddress?.stateOrCountryDescription,
                        Related_Person_Name__c = relatedPersonFullName,
                        Name = relatedPersonFullName.length() > 80 ? relatedPersonFullName.substring(0,80) : relatedPersonFullName,
                        Relationship__c =  relatedPersonInfoList[j]?.relatedPersonRelationshipList?.relationship !=null ? String.join(relatedPersonInfoList[j]?.relatedPersonRelationshipList?.relationship, ',') : '',
                        Clarification_of_Response_Related_Person__c = relatedPersonInfoList[j]?.relationshipClarification !=null ? relatedPersonInfoList[j]?.relationshipClarification : ''        
                    );
                    relatedPersonList.add(relatedPerson);
                }
            }
///////////////////////Recipents//////////
            if((result.offerings[i]?.offeringData?.salesCompensationList !=null && result.offerings[i]?.offeringData?.salesCompensationList?.recipient !=null))
            {
                List<FormDWarapper.Recipient> recipientList = result.offerings[i]?.offeringData?.salesCompensationList?.recipient;
                for(Integer j=0; j < recipientList.size(); j++ )
                {                    
                    SEC_API_Related_Person__c relatedPerson = new SEC_API_Related_Person__c(
                        recordTypeId =  recipientsRecId,
                        SEC_Id__c = result.offerings[i].id,
                        Recipient_Name__c = recipientList[j]?.recipientName,
                        Name = recipientList[j]?.recipientName.length() > 80 ? recipientList[j]?.recipientName.substring(0,80) : recipientList[j]?.recipientName,
                        Recipient_CRD_Number__c = recipientList[j]?.recipientCRDNumber,
                        Associated_Broker_Dealer_Name__c = recipientList[j]?.associatedBDName,
                        Associated_Broker_Dealer_CRD_Number__c = recipientList[j]?.associatedBDCRDNumber,
                        Recipient_Address__Street__s = recipientList[j]?.recipientAddress?.street1,
                        Street2__c = recipientList[j]?.recipientAddress?.street2,
                        Recipient_Address__City__s = recipientList[j]?.recipientAddress?.city,
                        Recipient_Address__PostalCode__s  = recipientList[j]?.recipientAddress?.zipCode,
                        Country_Code__c = recipientList[j]?.recipientAddress?.stateOrCountry,
                        Country_Description__c = recipientList[j]?.recipientAddress?.stateOrCountryDescription,
                        States_of_Solicitation__c = createStatesOfSolicitation(recipientList[j]?.statesOfSolicitationList),
                        Foreign_Non_US__c = recipientList[j]?.foreignSolicitation !=null ? recipientList[j]?.foreignSolicitation : false                 
                    );
                    relatedPersonList.add(relatedPerson);
                }                
            }                    
            
            Form_D_Offering__c formD = new Form_D_Offering__c(
                CIK__c = result.offerings[i].primaryIssuer.cik,
                Name_Issuer__c = result.offerings[i].primaryIssuer.entityName,
                Name = result.offerings[i].primaryIssuer.entityName.length() > 80 ? result.offerings[i].primaryIssuer.entityName.substring(0,80) : result.offerings[i].primaryIssuer.entityName,
                Entity_Type__c = result.offerings[i].primaryIssuer.entityType,
                Jurisdiction_of_Incorporation_Organizati__c = result.offerings[i].primaryIssuer.jurisdictionOfInc,
                specify_year__c = yearOfIncome,
                Year_of_Incorporation_Organization__c = fiveYears,
                Address__Street__s = result.offerings[i].primaryIssuer.issuerAddress.street1,
                Street2__c = result.offerings[i].primaryIssuer.issuerAddress.street2,
                Address__City__s = result.offerings[i].primaryIssuer.issuerAddress.city,
                Address__PostalCode__s = result.offerings[i].primaryIssuer.issuerAddress.zipCode,
                Country_Code__c = result.offerings[i].primaryIssuer.issuerAddress.stateOrCountry,
                Country_Description__c = result.offerings[i].primaryIssuer.issuerAddress.stateOrCountryDescription,
                Phone_No__c = result.offerings[i].primaryIssuer.issuerPhoneNumber,
                Schema_Version__c = result.offerings[i].schemaVersion,
                Submission_Type__c = result.offerings[i].submissionType,
                Test_Live__c = result.offerings[i].testOrLive,
                Accession_No__c = result.offerings[i].accessionNo,
                SEC_Id__c = result.offerings[i].id,
                Filed_At__c = parsedDatetime,


                ///////////////////////////
                Related_Person_Address__Street__s = result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonAddress?.street1,
                Related_Person_Address__City__s = result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonAddress?.city,
                Related_Person_Address__PostalCode__s = result.offerings[i]?.relatedPersonsList?.relatedPersonInfo[0]?.relatedPersonAddress?.zipCode,
                Related_Person_Name__c = relatedPersonName,
                Relationship__c = relationshipsOfRelatedPerson,
                Clarification_of_Response_Related_Person__c = clarificationOfResponseRelatedPerson,
                Industry_Group__c = result.offerings[i]?.offeringData?.industryGroup?.industryGroupType !=null ? result.offerings[i]?.offeringData?.industryGroup?.industryGroupType : '',
                Industry_Group_Fund_Type__c = result.offerings[i]?.offeringData?.industryGroup?.investmentFundInfo?.investmentFundType !=null ? result.offerings[i]?.offeringData?.industryGroup?.investmentFundInfo?.investmentFundType : '',
                Act_of_1940__c = result.offerings[i]?.offeringData?.industryGroup?.investmentFundInfo?.is40Act !=null ? result.offerings[i]?.offeringData?.industryGroup?.investmentFundInfo?.is40Act : false,
                Revenue_Range__c = result.offerings[i]?.offeringData?.issuerSize?.revenueRange !=null ? result.offerings[i]?.offeringData?.issuerSize?.revenueRange : '',
                Aggregate_Net_Asset_Value_Range__c = result.offerings[i]?.offeringData?.issuerSize?.aggregateNetAssetValueRange !=null ? result.offerings[i]?.offeringData?.issuerSize?.aggregateNetAssetValueRange : '',
                Investment_Company_Act_Section__c = result.offerings[i]?.offeringData?.federalExemptionsExclusions?.item !=null ? String.join(result.offerings[i]?.offeringData?.federalExemptionsExclusions?.item, ',') : '',
                Amendment__c =  result.offerings[i]?.offeringData?.typeOfFiling?.newOrAmendment?.isAmendment !=null ? result.offerings[i]?.offeringData?.typeOfFiling?.newOrAmendment?.isAmendment : false,
                Previous_Accession_No__c = previousAccessionNumber,
                Date_of_First_Sale__c = result.offerings[i]?.offeringData?.typeOfFiling?.dateOfFirstSale?.value !=null ? Date.valueOf(result.offerings[i]?.offeringData?.typeOfFiling?.dateOfFirstSale?.value) : null,
                First_Sale_Yet_to_Occur__c = result.offerings[i]?.offeringData?.typeOfFiling?.dateOfFirstSale?.yetToOccur !=null ? result.offerings[i]?.offeringData?.typeOfFiling?.dateOfFirstSale?.yetToOccur : false,
                Offering_Last_More_Than_One_Year__c = result.offerings[i]?.offeringData?.durationOfOffering?.moreThanOneYear !=null ? result.offerings[i]?.offeringData?.durationOfOffering?.moreThanOneYear : false,
                Equity_Type__c = result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isEquityType !=null ? result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isEquityType : false,            
                Debt_Type__c = result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isDebtType !=null ? result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isDebtType : false,            
                Option_To_Acquire_Type__c = result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isOptionToAcquireType !=null ? result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isOptionToAcquireType : false,
                Security_To_Be_Acquired_Type__c = result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isSecurityToBeAcquiredType !=null ? result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isSecurityToBeAcquiredType : false,
                Pooled_Investment_Fund_Type__c = result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isPooledInvestmentFundType !=null ? result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isPooledInvestmentFundType : false,
                Tenant_In_Common_Type__c = result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isTenantInCommonType !=null ? result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isTenantInCommonType : false,
                Mineral_Property_Type__c = result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isMineralPropertyType !=null ? result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isMineralPropertyType : false,
                Other_Type__c = result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isOtherType !=null ? result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.isOtherType : false,
                Description_Of_Other_Type__c = result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.descriptionOfOtherType !=null ? result.offerings[i]?.offeringData?.typesOfSecuritiesOffered?.descriptionOfOtherType : '',
                Is_Business_Combination_Transaction__c = result.offerings[i]?.offeringData?.businessCombinationTransaction?.isBusinessCombinationTransaction !=null ? result.offerings[i]?.offeringData?.businessCombinationTransaction?.isBusinessCombinationTransaction : false,
                Clarification_Of_Response_Business_Comb__c = result.offerings[i]?.offeringData?.businessCombinationTransaction?.clarificationOfResponse !=null ? result.offerings[i]?.offeringData?.businessCombinationTransaction?.clarificationOfResponse : '',
                Minimum_Investment_Accepted__c = result.offerings[i]?.offeringData?.minimumInvestmentAccepted !=null ? result.offerings[i]?.offeringData?.minimumInvestmentAccepted : null,
                Recipient_Name__c = recipientName,
                Recipient_CRD_Number__c = recipientCRDNumber,
                Associated_Broker_Dealer_Name__c = associatedBDName,
                Associated_Broker_Dealer_CRD_Number__c = associatedBDCRDNumber,
                Recipient_Address__Street__s = recipientStreet,
                Recipient_Address__City__s = recipientCity,
                Recipient_Address__PostalCode__s  = recipientZipCode,
                States_of_Solicitation__c = statesOfSolicitation,
                Foreign_Non_US__c = foreignSolicitation,
                Total_Offering_Amount__c = result.offerings[i]?.offeringData?.offeringSalesAmounts?.totalOfferingAmount !=null ? result.offerings[i]?.offeringData?.offeringSalesAmounts?.totalOfferingAmount: null,
                Total_Amount_Sold__c = result.offerings[i]?.offeringData?.offeringSalesAmounts?.totalAmountSold !=null ? result.offerings[i]?.offeringData?.offeringSalesAmounts?.totalAmountSold: null,
                Total_Remaining_to_be_Sold__c = result.offerings[i]?.offeringData?.offeringSalesAmounts?.totalRemaining !=null ? result.offerings[i]?.offeringData?.offeringSalesAmounts?.totalRemaining: null,
                Clarification_of_Response_Sales_Amounts__c = result.offerings[i]?.offeringData?.offeringSalesAmounts?.clarificationOfResponse !=null ? result.offerings[i]?.offeringData?.offeringSalesAmounts?.clarificationOfResponse: '',
                Has_Non_Accredited_Investors__c = result.offerings[i]?.offeringData?.investors?.hasNonAccreditedInvestors !=null ? result.offerings[i]?.offeringData?.investors?.hasNonAccreditedInvestors: false,
                Number_of_Non_Accredited_Investors__c = result.offerings[i]?.offeringData?.investors?.numberNonAccreditedInvestors !=null ? result.offerings[i]?.offeringData?.investors?.numberNonAccreditedInvestors: null,
                Total_Number_Already_Invested__c = result.offerings[i]?.offeringData?.investors?.totalNumberAlreadyInvested !=null ? result.offerings[i]?.offeringData?.investors?.totalNumberAlreadyInvested: null,
                Sales_Commissions__c = result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.salesCommissions?.dollarAmount !=null ? result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.salesCommissions?.dollarAmount: null,                
                Sales_Commissions_Estimate__c = result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.salesCommissions?.isEstimate !=null ? result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.salesCommissions?.isEstimate: false,                
                Finders_Fees__c = result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.findersFees?.dollarAmount !=null ? result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.findersFees?.dollarAmount: null,                
                Finders_Fees_Estimate__c = result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.findersFees?.isEstimate !=null ? result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.findersFees?.isEstimate: false,                
                Clarification_of_Res_Sales_and_Finders__c = result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.clarificationOfResponse !=null ? result.offerings[i]?.offeringData?.salesCommissionsFindersFees?.clarificationOfResponse: '',                 
                Amount_of_Gross_Proceeds_Used__c = result.offerings[i]?.offeringData?.useOfProceeds?.grossProceedsUsed?.dollarAmount !=null ? result.offerings[i]?.offeringData?.useOfProceeds?.grossProceedsUsed?.dollarAmount: null,                
                Amount_of_Gross_Proceeds_Used_Estimate__c = result.offerings[i]?.offeringData?.useOfProceeds?.grossProceedsUsed?.isEstimate !=null ? result.offerings[i]?.offeringData?.useOfProceeds?.grossProceedsUsed?.isEstimate: false,                
                Clarification_of_Res_Gross_Proceeds__c = result.offerings[i]?.offeringData?.useOfProceeds?.clarificationOfResponse !=null ? result.offerings[i]?.offeringData?.useOfProceeds?.clarificationOfResponse: '',               
                Issuer__c = result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.issuerName !=null ? result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.issuerName : '',            
                Signature_Name__c = result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.signatureName !=null ? result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.signatureName : '', 
                Name_of_Signature__c = result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.nameOfSigner !=null ? result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.nameOfSigner : '',   
                Signature_Title__c = result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.signatureTitle !=null ? result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.signatureTitle : '',    
                Signature_Date__c = result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.signatureDate !=null ? Date.valueOf(result.offerings[i]?.offeringData?.signatureBlock?.signature[0]?.signatureDate) : null,  
                Authorized_Person__c = result.offerings[i]?.offeringData?.signatureBlock?.authorizedRepresentative !=null ? result.offerings[i]?.offeringData?.signatureBlock?.authorizedRepresentative : false        
                
                );
            formdList.add(formD);            
        }       
    }
}