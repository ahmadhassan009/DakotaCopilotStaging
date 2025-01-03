public with sharing class RelatedAccountsMetaController {
    /**
     * Wrapper class for Metro Area Custom Subpanels
     */
    public class MetroAreaCustomSubPanelData implements Comparable
    {
        @AuraEnabled public String Id { get; set; }
        @AuraEnabled public String MasterLabel { get; set; }
        @AuraEnabled public String AccountTypeValues { get; set; }
        @AuraEnabled public String PanelIconInitial { get; set; }
        @AuraEnabled public String PanelIconColor { get; set; }
        @AuraEnabled public Decimal SubPanelSortOrder { get; set; }
        @AuraEnabled public String SubPanelColumns { get; set; }
        @AuraEnabled public String SubAccountTypeValues { get; set; }
        @AuraEnabled public String SectionNumber { get; set; }
        
        public Integer compareTo(Object compareTo) {
            MetroAreaCustomSubPanelData compareToRecords = (MetroAreaCustomSubPanelData)compareTo;
            // The return value of 0 indicates that both elements are equal.
            Integer returnValue = 0;
            if (SubPanelSortOrder > compareToRecords.SubPanelSortOrder) {
                // Set return value to a positive value.
                returnValue = -1;
            } else if (SubPanelSortOrder < compareToRecords.SubPanelSortOrder) {
                // Set return value to a negative value.
                returnValue = 1;
            }
            return returnValue; 
        }
    }
    
    /**
     * @description To get count of Inv Allocator accounts related to metro area
     * Count includes accounts with the specified types and sub-type 
     * AND accounts linked with the metro area via sub metro area
     * Funationality is used in Dakota Talent community
     * @param metroAreaId the current metro area record
     * 
     * @return Integer : count of accounts
     */
    @AuraEnabled(cacheable=true)
    public static Integer getTotalCountOfAccountTypeRecords(String metroAreaId)
    {
        Set<String> accountTypes = new Set<String>();
        Set<String> subAccountTypes = new Set<String>();
        for(Metro_Area_Custom_Sub_Panel__mdt subPanelMeta : [SELECT Id, Account_Type_Values__c,Sub_Account_Type_Values__c
        FROM Metro_Area_Custom_Sub_Panel__mdt
        WHERE Is_Active__c = true AND Is_Enable_for_Everest__c = true])
        {
            if(subPanelMeta.Account_Type_Values__c != null)
            {
                List<String> accountTypesSplited = subPanelMeta.Account_Type_Values__c.split(',');
                accountTypes.addAll(accountTypesSplited);
            }
            if(subPanelMeta.Sub_Account_Type_Values__c != null)
            {
                List<String> subAccountTypesSplited = subPanelMeta.Sub_Account_Type_Values__c.split(',');
                subAccountTypes.addAll(subAccountTypesSplited);
            }
        }
        List<Sub_Metro_Area__c> relatedSubMetroAreas = [Select Id,Account__c from Sub_Metro_Area__c where Metro_Area__c =: metroAreaId];
        Set<Id> accIDsRelatedToSubMetroAreas = new Set<Id>();
        for(Sub_Metro_Area__c sub : relatedSubMetroAreas)
        {
            accIDsRelatedToSubMetroAreas.add(sub.Account__c);
        }
        return [Select Count() from Account where (MetroArea__c =: metroAreaId or Id IN : accIDsRelatedToSubMetroAreas) And (Type In :accountTypes Or Sub_Type__c In :subAccountTypes)];
    }

    /**
     * @description To get count of Inv Firm accounts related to metro area
     * Count includes accounts with the specified Investment focus 
     * Funationality is used in Dakota Talent community
     * @param metroAreaId the current metro area record
     * 
     * @return Integer : count of accounts
     */
    @AuraEnabled(cacheable=true)
    public static Integer getTotalCountOfAccountInvFocusRecords(String metroAreaId)
    {
        Set<String> accountInvFocusValues = new Set<String>();
        for(Metro_Area_Custom_Sub_Panel_Everest__mdt subPanelMeta : [SELECT Id, Account_Type_Values__c
        FROM Metro_Area_Custom_Sub_Panel_Everest__mdt
        WHERE Is_Active__c = true AND Is_Enable_for_Everest__c = true
       ])
        {
            if(subPanelMeta.Account_Type_Values__c != null)
            {
                List<String> accountInvFocusSplited = subPanelMeta.Account_Type_Values__c.split(',');
                accountInvFocusValues.addAll(accountInvFocusSplited);
            }
        }
        return [Select Count() from Account where MetroArea__c = :metroAreaId And Investment_Focus_single__c In :accountInvFocusValues];
    }

    @AuraEnabled(cacheable=true)
    public static List<MetroAreaCustomSubPanelData> getRelatedAccountsMetadata(Boolean isGetForShowingRelatedLists, Id metroAreaId) {
        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaCustomSubPanel = new List<Metro_Area_Custom_Sub_Panel__mdt>();
        List<MetroAreaCustomSubPanelData> metroAreaCustomSubPanelResult = new List<MetroAreaCustomSubPanelData>();
        List<User> currentUser = [Select Portal_State__c,Profile.Name from User where Id=:UserInfo.getUserId()];
        if(currentUser.size() > 0 && (currentUser[0].Profile.Name == System.label.Software_Sales_Profile || currentUser[0].Portal_State__c == 'Marketplace2') && isGetForShowingRelatedLists)
        {
            metroAreaCustomSubPanelResult.addAll(getOrderedMetroAreaMetaDataForDakotaTalent(metroAreaId));
        }
        else if(isGetForShowingRelatedLists)
        {
            metroAreaCustomSubPanelResult.addAll(getOrderedMetroAreaMetaData(metroAreaId));
        }
        else
        {
            metroAreaCustomSubPanel = [SELECT Id,MasterLabel,Section_No__c, Account_Type_Values__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c, Sub_Account_Type_Values__c
                FROM Metro_Area_Custom_Sub_Panel__mdt
                WHERE Is_Active__c = true ORDER BY Sub_Panel_Sort_Order__c ASC
            ];
            metroAreaCustomSubPanelResult.addAll(setMetroAreaCustomSubPanelData(metroAreaCustomSubPanel));
        }
        
        return metroAreaCustomSubPanelResult;
    }

    /**
     *  @description Set data in wrapper object
     * 
     *  @param subpanelMetadata list of metro area subpanel metadata
     * 
     * @return list of custom object (MetroAreaCustomSubPanelData)
     */
    private static List<MetroAreaCustomSubPanelData> setMetroAreaCustomSubPanelData (List<Metro_Area_Custom_Sub_Panel__mdt> subpanelMetadata) {
        List<MetroAreaCustomSubPanelData> metroAreaCustomSubPanelResult = new List<MetroAreaCustomSubPanelData>();
        for(Metro_Area_Custom_Sub_Panel__mdt md : subpanelMetadata) {
            MetroAreaCustomSubPanelData metroAreaPanel = new MetroAreaCustomSubPanelData();
            metroAreaPanel.Id = md.Id;
            metroAreaPanel.MasterLabel = md.MasterLabel;
            metroAreaPanel.AccountTypeValues = md.Account_Type_Values__c;
            metroAreaPanel.PanelIconInitial = md.Panel_Icon_Initial__c;
            metroAreaPanel.PanelIconColor = md.Panel_Icon_Color__c;
            metroAreaPanel.SubPanelSortOrder = md.Sub_Panel_Sort_Order__c;
            metroAreaPanel.SubPanelColumns = md.Sub_Panel_Columns__c;
            metroAreaPanel.SubAccountTypeValues = md.Sub_Account_Type_Values__c;
            metroAreaPanel.SectionNumber = md.Section_No__c;
            metroAreaCustomSubPanelResult.add(metroAreaPanel);
        }
        return metroAreaCustomSubPanelResult;
    }

    /**
     * @description To get Metro areas subpanel metadata section wise (Section 1 & 2)
     * DSC-670 : Metro Area Subpanel Revamp
     * Section 1 shows the account type in metadata and sorted based on verified account record count
     * Section 2 shows account type in metadata sorted alphabetically
     * 
     * @param metroAreaId the current metro area record
     * 
     * @return list of custom object (MetroAreaCustomSubPanelData)
     */
    @testVisible
    private static List<MetroAreaCustomSubPanelData> getOrderedMetroAreaMetaData(Id metroAreaId) {
        Map<String, Integer> typeToVerifiedAccMap = new Map<String, Integer>();
        List<MetroAreaCustomSubPanelData> metroAreaSubPanelOrderedList = new List<MetroAreaCustomSubPanelData>();
        List<MetroAreaCustomSubPanelData> tempmetroAreaSubPanelOrderedList = new List<MetroAreaCustomSubPanelData>();
        Set<Id> accIDsRelatedToSubMetroAreas = new Set<Id>();
        Map<String, Integer> SubtypeToVerifiedAccMap = new Map<String, Integer>();

        List<Sub_Metro_Area__c> relatedSubMetroAreas = [Select id,Account__c from Sub_Metro_Area__c where Metro_Area__c =: metroAreaId];

        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaSection1 = [SELECT Id,MasterLabel, Account_Type_Values__c,Section_No__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c, Sub_Account_Type_Values__c
                                                                    FROM Metro_Area_Custom_Sub_Panel__mdt
                                                                    WHERE Is_Active__c = true AND Section_No__c = '1'
                                                                    ORDER BY Sub_Panel_Sort_Order__c ASC];
        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaSection2 = [SELECT Id,MasterLabel, Account_Type_Values__c,Section_No__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c, Sub_Account_Type_Values__c
                                                                    FROM Metro_Area_Custom_Sub_Panel__mdt
                                                                    WHERE Is_Active__c = true AND Section_No__c = '2'
                                                                    ORDER BY MasterLabel ASC];
        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaAllSections = new List<Metro_Area_Custom_Sub_Panel__mdt>();
        metroAreaAllSections.addAll(metroAreaSection1);
        metroAreaAllSections.addAll(metroAreaSection2);

        //DSC-932 : Create a set of all sub account types, set will be used to filtered aggregate records fetched based on sub account type
        Set<String> allSubAccountTypes = new Set<String>();
        for(Metro_Area_Custom_Sub_Panel__mdt md : metroAreaAllSections)
        {
            if(md.Sub_Account_Type_Values__c != null)
            {
                List<String> subAccountTypes = md.Sub_Account_Type_Values__c.split(',');
                allSubAccountTypes.addAll(subAccountTypes);
            }
        }

        for(Sub_Metro_Area__c sub : relatedSubMetroAreas)
        {
            accIDsRelatedToSubMetroAreas.add(sub.Account__c);
        }
        // to get verified account record count grouped on type
        for (AggregateResult aggRes : [Select Count(Id) numofInvestmentAccounts, Type from Account where RecordType.DeveloperName = 'Dakota_Investments_Account' 
                                        and X100_Marketplace__c = true and (MetroArea__c =: metroAreaId or Id IN : accIDsRelatedToSubMetroAreas)  Group by Type ORDER BY Count(Id) DESC]) {
            typeToVerifiedAccMap.put((String)aggRes.get('Type'), (Integer)aggRes.get('numofInvestmentAccounts'));
        }

        for (AggregateResult aggRes : [Select Count(Id) numofInvestmentAccounts, Sub_Type__c from Account where RecordType.DeveloperName = 'Dakota_Investments_Account' 
                                        and X100_Marketplace__c = true and (MetroArea__c =: metroAreaId or Id IN : accIDsRelatedToSubMetroAreas)  Group by Sub_Type__c ORDER BY Count(Id) DESC]) {
            SubtypeToVerifiedAccMap.put((String)aggRes.get('Sub_Type__c'), (Integer)aggRes.get('numofInvestmentAccounts'));
        }

        Map<String, Integer> mainMap = new Map<String, Integer>();
        for(String key : SubtypeToVerifiedAccMap.keyset() ) {
            if(allSubAccountTypes.contains(key)) {
                if(key != null && !typeToVerifiedAccMap.containsKey(key)) {
                    mainMap.put(key,SubtypeToVerifiedAccMap.get(key));
                } else if (key != null){
                    mainMap.put(key, typeToVerifiedAccMap.get(key) + SubtypeToVerifiedAccMap.get(key));
                }
            }
        }
        for(String key : typeToVerifiedAccMap.keyset()){
            if (!mainMap.containsKey(key)) {
                mainMap.put(key,typeToVerifiedAccMap.get(key));
            }
        }
        typeToVerifiedAccMap = mainMap;


        for (Metro_Area_Custom_Sub_Panel__mdt md : metroAreaSection1) {
            List<String> accountTypes = new List<String>();
            accountTypes = md.Account_Type_Values__c.split(',');
            if(accountTypes.size() > 1) {
                md.Sub_Panel_Sort_Order__c = 0;
                for(String accType : accountTypes) {
                    if(typeToVerifiedAccMap.containsKey(accType)) {
                        md.Sub_Panel_Sort_Order__c += typeToVerifiedAccMap.get(accType);
                    } else {
                        md.Sub_Panel_Sort_Order__c += 0;
                    }
                }
            } else {
                if(typeToVerifiedAccMap.containsKey(accountTypes[0])) {
                    md.Sub_Panel_Sort_Order__c = typeToVerifiedAccMap.get(accountTypes[0]);
                } else {
                    md.Sub_Panel_Sort_Order__c = 0;
                }
            }
        }
        metroAreaSubPanelOrderedList.addAll(setMetroAreaCustomSubPanelData(metroAreaSection1));

        for (Metro_Area_Custom_Sub_Panel__mdt md : metroAreaSection2) {
            List<String> accountTypes = new List<String>();
            accountTypes = md.Account_Type_Values__c.split(',');
            if(accountTypes.size() > 1) {
                md.Sub_Panel_Sort_Order__c = 0;
                for(String accType : accountTypes) {
                    if(typeToVerifiedAccMap.containsKey(accType)) {
                        md.Sub_Panel_Sort_Order__c += typeToVerifiedAccMap.get(accType);
                    } else {
                        md.Sub_Panel_Sort_Order__c += 0;
                    }
                }
            } else {
                if(typeToVerifiedAccMap.containsKey(accountTypes[0])) {
                    md.Sub_Panel_Sort_Order__c = typeToVerifiedAccMap.get(accountTypes[0]);
                } else {
                    md.Sub_Panel_Sort_Order__c = 0;
                }
            }
        }
        tempmetroAreaSubPanelOrderedList.addAll(setMetroAreaCustomSubPanelData(metroAreaSection2));
        tempmetroAreaSubPanelOrderedList.sort();
        metroAreaSubPanelOrderedList.addAll(tempmetroAreaSubPanelOrderedList);
        return metroAreaSubPanelOrderedList;
    }

    @testVisible
    private static List<MetroAreaCustomSubPanelData> getOrderedMetroAreaMetaDataForDakotaTalent(Id metroAreaId) {
        Map<String, Integer> typeToVerifiedAccMap = new Map<String, Integer>();
        List<MetroAreaCustomSubPanelData> metroAreaSubPanelOrderedList = new List<MetroAreaCustomSubPanelData>();
        List<MetroAreaCustomSubPanelData> tempmetroAreaSubPanelOrderedList = new List<MetroAreaCustomSubPanelData>();
        Set<Id> accIDsRelatedToSubMetroAreas = new Set<Id>();
        Map<String, Integer> SubtypeToVerifiedAccMap = new Map<String, Integer>();

        List<Sub_Metro_Area__c> relatedSubMetroAreas = [Select id,Account__c from Sub_Metro_Area__c where Metro_Area__c =: metroAreaId];

        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaSection1 = [SELECT Id,MasterLabel, Account_Type_Values__c,Section_No__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c, Sub_Account_Type_Values__c
                                                                    FROM Metro_Area_Custom_Sub_Panel__mdt
                                                                    WHERE Is_Active__c = true AND Is_Enable_for_Everest__c = true AND Section_No__c = '1'
                                                                    ORDER BY Sub_Panel_Sort_Order__c ASC];
        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaSection2 = [SELECT Id,MasterLabel, Account_Type_Values__c,Section_No__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c, Sub_Account_Type_Values__c
                                                                    FROM Metro_Area_Custom_Sub_Panel__mdt
                                                                    WHERE Is_Active__c = true AND Is_Enable_for_Everest__c = true AND Section_No__c = '2'
                                                                    ORDER BY MasterLabel ASC];
        List<Metro_Area_Custom_Sub_Panel__mdt> metroAreaAllSections = new List<Metro_Area_Custom_Sub_Panel__mdt>();
        metroAreaAllSections.addAll(metroAreaSection1);
        metroAreaAllSections.addAll(metroAreaSection2);

        //DSC-932 : Create a set of all sub account types, set will be used to filtered aggregate records fetched based on sub account type
        Set<String> allSubAccountTypes = new Set<String>();
        for(Metro_Area_Custom_Sub_Panel__mdt md : metroAreaAllSections)
        {
            if(md.Sub_Account_Type_Values__c != null)
            {
                List<String> subAccountTypes = md.Sub_Account_Type_Values__c.split(',');
                allSubAccountTypes.addAll(subAccountTypes);
            }
        }

        for(Sub_Metro_Area__c sub : relatedSubMetroAreas)
        {
            accIDsRelatedToSubMetroAreas.add(sub.Account__c);
        }
        // to get verified account record count grouped on type
        for (AggregateResult aggRes : [Select Count(Id) numofInvestmentAccounts, Type from Account where
                                         (MetroArea__c =: metroAreaId or Id IN : accIDsRelatedToSubMetroAreas)  Group by Type ORDER BY Count(Id) DESC]) {
                                         typeToVerifiedAccMap.put((String)aggRes.get('Type'), (Integer)aggRes.get('numofInvestmentAccounts'));
        }

        for (AggregateResult aggRes : [Select Count(Id) numofInvestmentAccounts, Sub_Type__c from Account where 
                                         (MetroArea__c =: metroAreaId or Id IN : accIDsRelatedToSubMetroAreas)  Group by Sub_Type__c ORDER BY Count(Id) DESC]) {
                                         SubtypeToVerifiedAccMap.put((String)aggRes.get('Sub_Type__c'), (Integer)aggRes.get('numofInvestmentAccounts'));
        }

        Map<String, Integer> mainMap = new Map<String, Integer>();
        for(String key : SubtypeToVerifiedAccMap.keyset() ) {
            if(allSubAccountTypes.contains(key)) {
                if(key != null && !typeToVerifiedAccMap.containsKey(key)) {
                    mainMap.put(key,SubtypeToVerifiedAccMap.get(key));
                } else if (key != null){
                    mainMap.put(key, typeToVerifiedAccMap.get(key) + SubtypeToVerifiedAccMap.get(key));
                }
            }
        }
        for(String key : typeToVerifiedAccMap.keyset()){
            if (!mainMap.containsKey(key)) {
                mainMap.put(key,typeToVerifiedAccMap.get(key));
            }
        }
        typeToVerifiedAccMap = mainMap;


        for (Metro_Area_Custom_Sub_Panel__mdt md : metroAreaSection1) {
            List<String> accountTypes = new List<String>();
            accountTypes = md.Account_Type_Values__c.split(',');
            if(accountTypes.size() > 1) {
                md.Sub_Panel_Sort_Order__c = 0;
                for(String accType : accountTypes) {
                    if(typeToVerifiedAccMap.containsKey(accType)) {
                        md.Sub_Panel_Sort_Order__c += typeToVerifiedAccMap.get(accType);
                    } else {
                        md.Sub_Panel_Sort_Order__c += 0;
                    }
                }
            } else {
                if(typeToVerifiedAccMap.containsKey(accountTypes[0])) {
                    md.Sub_Panel_Sort_Order__c = typeToVerifiedAccMap.get(accountTypes[0]);
                } else {
                    md.Sub_Panel_Sort_Order__c = 0;
                }
            }
        }
        metroAreaSubPanelOrderedList.addAll(setMetroAreaCustomSubPanelData(metroAreaSection1));

        for (Metro_Area_Custom_Sub_Panel__mdt md : metroAreaSection2) {
            List<String> accountTypes = new List<String>();
            accountTypes = md.Account_Type_Values__c.split(',');
            if(accountTypes.size() > 1) {
                md.Sub_Panel_Sort_Order__c = 0;
                for(String accType : accountTypes) {
                    if(typeToVerifiedAccMap.containsKey(accType)) {
                        md.Sub_Panel_Sort_Order__c += typeToVerifiedAccMap.get(accType);
                    } else {
                        md.Sub_Panel_Sort_Order__c += 0;
                    }
                }
            } else {
                if(typeToVerifiedAccMap.containsKey(accountTypes[0])) {
                    md.Sub_Panel_Sort_Order__c = typeToVerifiedAccMap.get(accountTypes[0]);
                } else {
                    md.Sub_Panel_Sort_Order__c = 0;
                }
            }
        }
        tempmetroAreaSubPanelOrderedList.addAll(setMetroAreaCustomSubPanelData(metroAreaSection2));
        tempmetroAreaSubPanelOrderedList.sort();
        metroAreaSubPanelOrderedList.addAll(tempmetroAreaSubPanelOrderedList);
        return metroAreaSubPanelOrderedList;
    }

    /**
     * @description To get metro area subpanel for Everest community based on asset
     * 
     * @return list of custom object (MetroAreaCustomSubPanelData)
     */
    @AuraEnabled(cacheable=true)
    public static List<MetroAreaCustomSubPanelData> getRelatedAccountsAssetMetadata() {
        List<MetroAreaCustomSubPanelData> metroAreaAssetSubPanelResult = new List<MetroAreaCustomSubPanelData>();
        List<Metro_Area_Custom_Sub_Panel_Everest__mdt> metroAreaCustomSubPanel = [SELECT Id,MasterLabel, Account_Type_Values__c, Panel_Icon_Initial__c, Panel_Icon_Color__c, Sub_Panel_Sort_Order__c, Sub_Panel_Columns__c
                                                                                    FROM Metro_Area_Custom_Sub_Panel_Everest__mdt
                                                                                    WHERE Is_Active__c = true AND Is_Enable_for_Everest__c = true
                                                                                    ORDER BY Sub_Panel_Sort_Order__c ASC
                                                                                ];
        
        for(Metro_Area_Custom_Sub_Panel_Everest__mdt macs : metroAreaCustomSubPanel)
        {
            MetroAreaCustomSubPanelData metroAreaPanel = new MetroAreaCustomSubPanelData();
            metroAreaPanel.Id = macs.Id;
            metroAreaPanel.MasterLabel = macs.MasterLabel;
            metroAreaPanel.AccountTypeValues = 'InvestmentFocus-' + macs.Account_Type_Values__c;
            metroAreaPanel.PanelIconInitial = macs.Panel_Icon_Initial__c;
            metroAreaPanel.PanelIconColor = macs.Panel_Icon_Color__c;
            metroAreaPanel.SubPanelSortOrder = macs.Sub_Panel_Sort_Order__c;
            metroAreaPanel.SubPanelColumns = macs.Sub_Panel_Columns__c;
            metroAreaAssetSubPanelResult.add(metroAreaPanel);
        }
        return metroAreaAssetSubPanelResult;
    }
    
    @AuraEnabled
    public static Metro_Area__c getDefaultValueOfMarker(String metroAreaId)
    {
        List<Metro_Area__c> metroArea = [SELECT Id, Name,Zoom_Level__c, Location__Latitude__s, Location__Longitude__s,Description__c,Everest_Description__c
                                        FROM Metro_Area__c
                                        WHERE Id =: metroAreaId];

        if(metroArea.size() != 0)
        {
            return metroArea[0];
        }    
        else {
            return null;
        }
    }
    
    /**
     * Get profile of Internal User
    */
    @AuraEnabled
    public static String getProfileName()
    {
        Id profileId = Userinfo.getProfileId();
        return [Select Name from Profile where Id = :profileId].Name;
    }
}