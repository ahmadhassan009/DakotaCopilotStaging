global class ScheduledToSyncInvestmentAdvisorFirms  implements Schedulable,Database.AllowsCallouts {
    public static List<Form_ADV__c> formADVList;
    private static Integer totalCount;
    private static Integer fromOffset;
    public static FormADVDateAndOffset__c formADVDateAndOffset = FormADVDateAndOffset__c.getInstance('DateAndOffset');  

    global void execute(SchedulableContext sc) {
        callout();       
    }

    @future(callout=true)
    public static void callout(){

        formADVList = new List<Form_ADV__c>();
        fromOffset = Integer.valueOf(formADVDateAndOffset.Offset__c);
        String StartDate = formADVDateAndOffset.Date__c;

        DateTime inputDateTime = DateTime.valueOf(StartDate + ' 00:00:00');
        DateTime resultDateTime = inputDateTime.addDays(1);
        String nextOffset = resultDateTime.format('yyyy-MM-dd');
        String endpoint = System.Label.Form_ADV_API_End_Point +'firm';
        String authorizationHeader = System.Label.Form_D_Authorization_Url;
        string chunkSize=System.Label.FormAdvChunkSize;
        integer offSetSize= integer.valueof(System.Label.FormAdvChunkSize);

        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('POST');
        request.setHeader('Authorization', authorizationHeader);
        request.setHeader('Content-Type', 'application/json');
        request.setBody('{"query": {"query_string": {"query": "Filing.Dt:['+StartDate+' TO '+StartDate+' ]"}}, "from": "'+fromOffset+'", "size": "'+ chunkSize +'", "sort": [{"Filing.Dt": {"order": "desc"}}]}');
        Http http = new Http();
        HttpResponse response = http.send(request);

        if (response.getStatusCode() == 200 && !String.isBlank(response.getBody())) {
            String responseBody = response.getBody();
            InvestmentAdvisorFirmsWrapper result= InvestmentAdvisorFirmsWrapper.parse(responseBody);
            storData(result);
        } else {
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

        if(fromOffset + offSetSize <= totalCount) {
            fromOffset += offSetSize;
            formADVDateAndOffset.Offset__c = fromOffset;
            update formADVDateAndOffset;
        }
        else {
            formADVDateAndOffset.Date__c = nextOffset;
            formADVDateAndOffset.Offset__c = 0;
            update formADVDateAndOffset;
        }

        try {
            if(formADVList.size()>0)
            {
                insert formADVList;
            }
        } catch(Exception ex) {
            System.debug(ex.getMessage());
        } 
    }

    public static Boolean checkBoolean(string flag) {
        return flag=='Y' ? true : false;
    }

    public static Void storData(InvestmentAdvisorFirmsWrapper result) {
        totalCount = result.total.value;
        for(Integer i=0; i<result.filings.size();i++ ) {
            List<Object> allCIk = getFinancialIndustryAffiliations(String.valueOf(result.filings[i].Info?.FirmCrdNb));
            
            Form_ADV__c firm = new Form_ADV__c(                
                Filing_Date__c = Date.valueOf(result.filings[i].Filing[0]?.Dt), 
                Form_Version__c = result.filings[i].Filing[0]?.FormVrsn, 
                CRD_No__c = String.valueOf(result.filings[i].Info?.FirmCrdNb),
                Legal_Name__c = result.filings[i].Info?.LegalNm,
                Name = result.filings[i].Info?.LegalNm,
                SEC_File_Number__c = result.filings[i].Info?.SECNb,
                Legal_Entity_Identifier__c = (result.filings[i]?.FormInfo?.Part1A?.Item1 != null && result.filings[i]?.FormInfo?.Part1A?.Item1?.Q1P != null )? result.filings[i].FormInfo.Part1A.Item1.Q1P : null,
                Number_of_Employees__c = (result.filings[i]?.FormInfo?.Part1A?.Item5A != null && result.filings[i]?.FormInfo?.Part1A?.Item5A?.TtlEmp != null )? result.filings[i].FormInfo.Part1A.Item5A.TtlEmp : null,
                All_CIK_Numbers__c = JSON.serialize(allCIk),

                Business_Location_Street1__c = result.filings[i].MainAddr?.Strt1,
                Business_Location_Street2__c = result.filings[i].MainAddr?.Strt2,
                Business_Location_City__c = result.filings[i].MainAddr?.City,
                Business_Location_State__c = result.filings[i].MainAddr?.State,
                Business_Location_Country__c = result.filings[i].MainAddr?.Cntry,
                Business_Location_Postal_Code__c = result.filings[i].MainAddr?.PostlCd,
                Business_Location_Phone_No__c = result.filings[i].MainAddr?.PhNb,
                Business_Location_Fax_No__c = result.filings[i].MainAddr?.FaxNb,

                Individuals_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DA1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DA1 : null,
                Individual_Client_Count_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DA2 != null) ? true : false,
                Individuals_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DA3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DA3 : null,

                HNW_Individuals_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DB1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DB1 : null,
                HNW_Individuals_Count_5__c  = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DB2 != null) ? true : false,
                HNW_Individuals_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DB3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DB3 : null,

                Banking_Institutions_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DC1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DC1 : null,
                Banking_Institutions_Client_Count_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DC2 != null) ? true : false,
                Banking_Institutions_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DC3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DC3 : null,

                Investment_Companies_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DD1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DD1 : null,
                Investment_Companies_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DD3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DD3 : null,

                Business_Development_Co_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DE1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DE1 : null,
                Business_Development_Co_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DE3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DE3 : null,

                Pooled_Investment_Vehicles_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DF1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DF1 : null,
                Pooled_Investment_Vehicles_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DF3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DF3 : null,

                Pension_Profit_Sharing_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DG1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DG1 : null,
                Pension_Profit_Sharing_Client_ct_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DG2 != null) ? true : false,
                Pension_Profit_Sharing_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DG3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DG3 : null,

                Charitable_Organizations_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DH1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DH1 : null,
                Charitable_Organizations_Client_ct_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DH2 != null) ? true : false,
                Charitable_Organizations_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DH3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DH3 : null,

                State_Entities_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DI1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DI1 : null,
                State_Entities_Client_Count_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DI2 != null) ? true : false,
                State_Entities_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DI3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DI3 : null,

                Other_Investment_Advisers_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DJ1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DJ1 : null,
                Other_Investment_Advisers_Client_ct_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DJ2 != null) ? true : false,
                Other_Investment_Advisers_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DJ3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DJ3 : null,

                Insurance_Companies_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DK1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DK1 : null,
                Insurance_Companies_Client_Count_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DK2 != null) ? true : false,
                Insurance_Companies_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DK3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DK3 : null,

                Sovereign_Wealth_Inst_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DL1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DL1 : null,
                Sovereign_Wealth_Inst_Client_Count_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DL2 != null) ? true : false,
                Sovereign_Wealth_Inst_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DL3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DL3 : null,

                Other_Businesses_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DM1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DM1 : null,
                Other_Businesses_Client_Count_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DM2 != null) ? true : false,
                Other_Businesses_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DM3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DM3 : null,

                Other_Client_Count__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DN1 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DN1 : null,
                Other_Client_Count_5__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DN2 != null) ? true : false,
                Other_AUM__c = (result.filings[i]?.FormInfo?.Part1A?.Item5D != null && result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DN3 != null) ? result.filings[i]?.FormInfo?.Part1A?.Item5D.Q5DN3 : null,

                Discretionary_Amount__c = result.filings[i]?.FormInfo?.Part1A?.Item5F != null ? result.filings[i].FormInfo.Part1A.Item5F?.Q5F2A : null,
                Non_Discretionary_Amount__c = result.filings[i]?.FormInfo?.Part1A?.Item5F != null ? result.filings[i].FormInfo.Part1A.Item5F?.Q5F2B : null,
                Total_Amount__c = result.filings[i]?.FormInfo?.Part1A?.Item5F != null ? result.filings[i].FormInfo.Part1A.Item5F?.Q5F2C : null,
                Discretionary_Accounts__c = result.filings[i]?.FormInfo?.Part1A?.Item5F != null ? result.filings[i].FormInfo.Part1A.Item5F?.Q5F2D : null,
                Non_Discretionary_Accounts__c = result.filings[i]?.FormInfo?.Part1A?.Item5F != null ? result.filings[i].FormInfo.Part1A.Item5F?.Q5F2E : null,
                Total_Accounts__c = result.filings[i]?.FormInfo?.Part1A?.Item5F != null ? result.filings[i].FormInfo.Part1A.Item5F?.Q5F2F : null,
                Non_United_States_Persons_Amount__c = result.filings[i]?.FormInfo?.Part1A?.Item5F != null ? result.filings[i].FormInfo.Part1A.Item5F?.Q5F3 : null,

                Financial_Planning_Services__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G1) : null, 
                Portfolio_Management_for_Individuals__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G2) : null, 
                Portfolio_Management_for_Investment_Comp__c  =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G3) : null, 
                Portfolio_Mgmt_for_Pooled_Invest_Vehicle__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G4) : null, 
                Portfolio_Mgmt_for_Businesses__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G5) : null, 
                Pension_Consulting_Services__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G6) : null, 
                Selection_of_other_Advisers__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G7) : null, 
                Publication_of_Periodicals_or_Newsletter__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G8) : null, 
                Security_Ratings_or_Pricing_Services__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G9) : null, 
                Market_Timing_Services__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G10) : null, 
                Educational_Seminars_Workshops__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G11) : null, 
                Other_Advisory_Services__c =  result.filings[i]?.FormInfo?.Part1A?.Item5G != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5G?.Q5G12) : null, 
                Name_of_Other_Advisory_Service__c =  (result.filings[i]?.FormInfo?.Part1A?.Item5G != null && result.filings[i].FormInfo.Part1A.Item5G?.Q5G12=='Y' ) ? result.filings[i].FormInfo.Part1A.Item5G?.Q5G12Oth : null,

                Number_of_Clients__c = result.filings[i]?.FormInfo?.Part1A?.Item5H != null ? result.filings[i].FormInfo.Part1A.Item5H?.Q5H : null,
                More_than_500_Clients__c =  (result.filings[i]?.FormInfo?.Part1A?.Item5H != null && result.filings[i].FormInfo.Part1A.Item5H?.Q5H=='More than 500' ) ? result.filings[i].FormInfo.Part1A.Item5H?.Q5HMT500 : null,

                Sponsor_Wrap_Fee_Program__c =  result.filings[i]?.FormInfo?.Part1A?.Item5I != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5I?.Q5I1) : null,
                Sponsor_Amount__c = (result.filings[i]?.FormInfo?.Part1A?.Item5I != null && result.filings[i].FormInfo.Part1A.Item5I?.Q5I1=='Y') ? result.filings[i].FormInfo.Part1A.Item5I?.Q5I2A : null,
                Portfolio_Manager_Amount__c = (result.filings[i]?.FormInfo?.Part1A?.Item5I != null && result.filings[i].FormInfo.Part1A.Item5I?.Q5I1=='Y') ? result.filings[i].FormInfo.Part1A.Item5I?.Q5I2B : null,
                Sponsor_Portfolio_Manager_Amount__c = (result.filings[i]?.FormInfo?.Part1A?.Item5I != null && result.filings[i].FormInfo.Part1A.Item5I?.Q5I1=='Y') ? result.filings[i].FormInfo.Part1A.Item5I?.Q5I2C : null,
                
                Investment_Advice_Limitation_Indication__c = result.filings[i]?.FormInfo?.Part1A?.Item5J != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5J?.Q5J1) : null,
                Different_Asset_Calculation_Indication__c = result.filings[i]?.FormInfo?.Part1A?.Item5J != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5J?.Q5J2) : null,

                Atypical_Regulatory_AUM_Clients__c = result.filings[i]?.FormInfo?.Part1A?.Item5K != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5K?.Q5K1) : null,
                Borrowing_Transactions_Engagement__c = result.filings[i]?.FormInfo?.Part1A?.Item5K != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5K?.Q5K2) : null,
                Derivative_Transactions_Engagement__c = result.filings[i]?.FormInfo?.Part1A?.Item5K != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5K?.Q5K3) : null,
                Custodian_Share_of_Regulatory_Asset__c = result.filings[i]?.FormInfo?.Part1A?.Item5K != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5K?.Q5K4) : null,

                Ad_Performance_Results_Included__c = result.filings[i]?.FormInfo?.Part1A?.Item5L != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5L?.Q5L1A) : null,
                Ad_Reference_to_Investment_Advice__c = result.filings[i]?.FormInfo?.Part1A?.Item5L != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5L?.Q5L1B) : null,
                Ad_Testimonials_Inclusion__c = result.filings[i]?.FormInfo?.Part1A?.Item5L != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5L?.Q5L1C) : null,
                Ad_Endorsements_Inclusion__c = result.filings[i]?.FormInfo?.Part1A?.Item5L != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5L?.Q5L1D) : null,
                Ad_Third_Party_Ratings_Inclusion__c = result.filings[i]?.FormInfo?.Part1A?.Item5L != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5L?.Q5L1E) : null,
                Compensation_for_Promotions__c = result.filings[i]?.FormInfo?.Part1A?.Item5L != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5L?.Q5L2) : null,
                Ad_Hypothetical_Performance_Inclusion__c = result.filings[i]?.FormInfo?.Part1A?.Item5L != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5L?.Q5L3) : null,
                Ad_Predecessor_Performance_Inclusion__c = result.filings[i]?.FormInfo?.Part1A?.Item5L != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item5L?.Q5L4) : null,


                Custody_of_Cash__c = result.filings[i]?.FormInfo?.Part1A?.Item9A != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9A?.Q9A1A) : null,
                Custody_of_Securities__c  = result.filings[i]?.FormInfo?.Part1A?.Item9A != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9A?.Q9A1B) : null,
                Funds_Securities_Amount__c  = result.filings[i]?.FormInfo?.Part1A?.Item9A != null ? result.filings[i].FormInfo.Part1A.Item9A?.Q9A2A : null,
                Total_No_of_Clients__c  = result.filings[i]?.FormInfo?.Part1A?.Item9A != null ? result.filings[i].FormInfo.Part1A.Item9A?.Q9A2B : null,

                Related_Person_Custody_of_Cash__c = result.filings[i]?.FormInfo?.Part1A?.Item9B != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9B?.Q9B1A) : null,
                Related_Person_Custody_of_Securities__c = result.filings[i]?.FormInfo?.Part1A?.Item9B != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9B?.Q9B1B) : null,
                Related_Person_Funds_Securities_Amount__c  = result.filings[i]?.FormInfo?.Part1A?.Item9B != null ? result.filings[i].FormInfo.Part1A.Item9B?.Q9B2A : null,
                Related_Person_Total_No_of_Cliens__c = result.filings[i]?.FormInfo?.Part1A?.Item9B != null ? result.filings[i].FormInfo.Part1A.Item9B?.Q9B2B : null,

                Quarterly_Investor_Statements__c = result.filings[i]?.FormInfo?.Part1A?.Item9C != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9C?.Q9C1) : null, 
                Audited_Annual_Financial_Statements__c = result.filings[i]?.FormInfo?.Part1A?.Item9C != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9C?.Q9C2) : null,
                Annual_Surprise_Examination_of_Funds__c = result.filings[i]?.FormInfo?.Part1A?.Item9C != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9C?.Q9C3) : null,
                Custodial_Internal_Control_Report__c = result.filings[i]?.FormInfo?.Part1A?.Item9C != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9C?.Q9C4) : null,

                is_Qualified_Custodian__c = result.filings[i]?.FormInfo?.Part1A?.Item9D != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9D?.Q9D1) : null,
                Related_Person_as_Qualified_Custodian__c = result.filings[i]?.FormInfo?.Part1A?.Item9D != null ? checkBoolean(result.filings[i].FormInfo.Part1A.Item9D?.Q9D2) : null,

                Last_Surprise_Examination_Date__c = result.filings[i]?.FormInfo?.Part1A?.Item9E != null ? result.filings[i].FormInfo.Part1A.Item9E?.Q9E : null,

                Qualified_Custodians_Count__c = result.filings[i]?.FormInfo?.Part1A?.Item9F != null ? result.filings[i].FormInfo.Part1A.Item9F?.Q9F : null,

                form_ADV_Sep_Managed_Accounts_Flag__c = false,
                form_ADV_Private_Fund_Flag__c = false,
                form_ADV_Owners_Flag__c = false
            );
            formADVList.add(firm);
        }
    }

    public static List<Object> getFinancialIndustryAffiliations(String crdNumber) {
        String endpointUrl = System.Label.Form_ADV_API_End_Point +'schedule-d-7-a/' + crdNumber + '?token='+System.Label.Form_D_Authorization_Url;
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpointUrl);
        request.setMethod('GET');
        HttpResponse response = new Http().send(request);
        if (response.getStatusCode() == 200 && !String.isBlank(response.getBody())) {
            List<Object> responseData = (List<Object>)JSON.deserializeUntyped(response.getBody());

            if (!responseData.isEmpty()) {
                Map<String, Object> responseDataMap = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(responseData[0]));
                return (List<Object>)responseDataMap.get('4b-cikNumbers');
            }
        } else {
            System.debug('Error: ' + response.getStatusCode() + ' - ' + response.getBody());
        }
        return null;
    }
}