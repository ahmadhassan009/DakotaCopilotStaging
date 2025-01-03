global class ScheduledToCloneInvestment13FData  implements Schedulable,Database.AllowsCallouts {

    global void execute(SchedulableContext sc) {
        List<Investment__c> invList = [SELECT Account__c,
        Annual_Report__c,
        Asset_Class_picklist__c,
        CIK__c,
        CreatedDateTime__c,
        Filing_Date__c,
        Form_Type__c,
        Fund_Balance__c,
        Funding_Year_Number__c,
        Heroku_Synced__c,
        Investment_ID_Case_Safe__c,
        Name,
        Investment_Strategy__c,
        Investment_Type__c,
        Last_Modified_Date__c,
        LastModifiedDateTime__c,
        Number_of_Shares__c,
        Period_of_Report__c,
        IC_Note__c,
        Reported_Fee__c,
        SEC_API_ID__c,
        Source__c,
        Sub_Asset_Class_Picklist__c,
        Termination_Date__c,
        Ticker__c,
        Total_Fee__c,
        isRecordCloned__c,
        URL__c        
        FROM Investment__c where recordtype.name = '13F Filings' and Product_Structure__c ='Common Stock' and isRecordCloned__c=false limit 500];

        List<Common_Stock_Holdings__c> comStockHoldingList = new List<Common_Stock_Holdings__c>();
        for(Investment__c inv : invList){
            Common_Stock_Holdings__c comStockHold = new Common_Stock_Holdings__c(
                Account__c = inv.Account__c,
                Annual_Report__c = inv.Annual_Report__c,
                Asset_Class_picklist__c = inv.Asset_Class_picklist__c,
                CIK__c = inv.CIK__c,
                CreatedDateTime__c = inv.CreatedDateTime__c,
                Filing_Date__c = inv.Filing_Date__c,
                Form_Type__c = inv.Form_Type__c,
                Fund_Balance__c = inv.Fund_Balance__c,
                Funding_Year_Number__c = inv.Funding_Year_Number__c,
                Heroku_Synced__c = inv.Heroku_Synced__c,
                Investment_ID_Case_Safe__c = inv.Investment_ID_Case_Safe__c,
                Name = inv.Name,
                Investment_Strategy__c = inv.Investment_Strategy__c,
                Investment_Type__c = inv.Investment_Type__c,
                Last_Modified_Date__c = inv.Last_Modified_Date__c,
                LastModifiedDateTime__c = inv.LastModifiedDateTime__c,
                Number_of_Shares__c = inv.Number_of_Shares__c,
                Period_of_Report__c = inv.Period_of_Report__c,
                IC_Note__c = inv.IC_Note__c,
                Reported_Fee__c = inv.Reported_Fee__c,
                SEC_API_ID__c = inv.SEC_API_ID__c,
                Source__c = inv.Source__c,
                Sub_Asset_Class_Picklist__c = inv.Sub_Asset_Class_Picklist__c,
                Termination_Date__c = inv.Termination_Date__c,
                Total_Fee__c = inv.Total_Fee__c,
                URL__c = inv.URL__c
                        );

            comStockHoldingList.add(comStockHold); 
            inv.isRecordCloned__c=true;
        }


        if(comStockHoldingList.size()>0) {
            try {
                insert comStockHoldingList;
                update invList;
            } catch(Exception ex) {
                System.debug(ex.getMessage());
            } 
        }
    } 
}