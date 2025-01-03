public with sharing class AssetAllocationDetailsController {    

    @AuraEnabled(cacheable = true)
    public static List<AssetsData> getChartDetails(String recId, String assetType) {
        List<Asset_Allocation__c> assetAllocations = new List<Asset_Allocation__c>();

        if(Schema.sObjectType.Asset_Allocation__c.isAccessible()) {
            assetAllocations= [ 
                                SELECT Id, Name, As_of_Date__c, Equities__c, Fixed_Income__c,Notes__c, Type__c,
                                    Alternatives__c, Cash__c, Commodities__c, Hedge_Funds__c, 
                                    Private_Equity__c, Real_Estate__c,Private_Credit__c,Real_Assets__c
                                FROM Asset_Allocation__c WHERE Account__c = :recId AND Type__c = :assetType
                                ORDER BY As_of_Date__c DESC NULLS LAST Limit 1
                              ];
        }
        if (assetAllocations != null && assetAllocations.size() > 0) {   
            List<AssetsData> assetDataList = new List<AssetsData>();
            for (Asset_Allocation__c assetAll: assetAllocations) { 
                AssetsData assetData = new AssetsData();
                assetData.chartDetails = new List<Map<String,Decimal >>();
                Map <String, Decimal> chartData = new Map <String, Decimal >();
                if (assetAll.Equities__c != null && assetAll.Equities__c > 0 ) {
                    chartData.put('Equities',assetAll.Equities__c);
                }
                if (assetAll.Fixed_Income__c != null && assetAll.Fixed_Income__c > 0 ) {
                    chartData.put('Fixed Income', assetAll.Fixed_Income__c);
                }
                if (assetAll.Alternatives__c != null && assetAll.Alternatives__c > 0) {
                    chartData.put('Alternatives', assetAll.Alternatives__c);
                }
                if (assetAll.Private_Equity__c != null && assetAll.Private_Equity__c > 0) {
                    chartData.put('Private Equity', assetAll.Private_Equity__c);
                }
                if (assetAll.Private_Credit__c != null && assetAll.Private_Credit__c > 0) {
                    chartData.put('Private Credit', assetAll.Private_Credit__c);
                }
                if (assetAll.Hedge_Funds__c != null && assetAll.Hedge_Funds__c > 0 ) {
                    chartData.put('Hedge Funds', assetAll.Hedge_Funds__c);
                }
                if (assetAll.Real_Estate__c != null && assetAll.Real_Estate__c > 0) {
                    chartData.put('Real Estate', assetAll.Real_Estate__c);
                }
                if (assetAll.Real_Assets__c != null && assetAll.Real_Assets__c > 0) {
                    chartData.put('Real Assets', assetAll.Real_Assets__c);
                }
                if (assetAll.Commodities__c != null && assetAll.Commodities__c > 0 ) {
                    chartData.put('Commodities', assetAll.Commodities__c);
                }
                if (assetAll.Cash__c != null && assetAll.Cash__c > 0) {
                    chartData.put('Cash', assetAll.Cash__c);
                }
                if (assetAll.Notes__c != null) {
                    assetAll.Notes__c = formatRichText(assetAll.Notes__c);
                    assetData.notes = assetAll.Notes__c;
                }
                if (assetAll.Type__c != null) {
                    assetData.type = assetAll.Type__c;
                }
                if (assetAll.As_of_Date__c != null) {
                    assetData.asOfDate = assetAll.As_of_Date__c;
                }
                if (chartData != null && chartData.size() >0 ) {
                    assetData.chartDetails.add(chartData);
                    assetDataList.add(assetData);
                }       
            }
            if (assetDataList != null && assetDataList.size() > 0 ) {	
                return assetDataList;
            }
        }
        return null;
    }

    public class AssetsData {
        @AuraEnabled public List<Map<String,Decimal>> chartDetails { get; set; }
        @AuraEnabled public String notes { get; set; }
        @AuraEnabled public String type { get; set; }
        @AuraEnabled public Date asOfDate { get; set; }
    }

    public static string formatRichText(String fieldValue) {   
        if (!String.isBlank(fieldValue)) {
            if (fieldValue.substring(0,3) == '<p>') {
                fieldValue = fieldValue.replaceFirst('<p>','');
                fieldValue = fieldValue.replaceFirst('</p>','');
            }

            //remove font-size and font family from rich text area value
            fieldValue = fieldValue.replaceAll('font-size:[^;\']*(;)?','');
            fieldValue = fieldValue.replaceAll('font-family:[^;\']*(;)?','');
            return fieldValue;
        } else {
            return null;
        }
    }
}