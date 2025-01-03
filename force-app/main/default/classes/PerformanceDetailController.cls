public with sharing class PerformanceDetailController {
    @AuraEnabled
    public static Boolean isSourceSelfReported(String recordId){
        try {
            List<Performance__c> performance = [SELECT Id, Name, Account__c, Source_Type__c FROM Performance__c Where Id = :recordId AND Investment_Strategy__r.Investment_Strategy_Verified__c = true AND Source_Type__c = 'Self Reported' LIMIT 1];
            return !performance.isEmpty();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static  Map<String,List<List<String>>>  getLayoutData(Id recordId){
        try {
            Map<String,List<List<String>>> result = new  Map<String,List<List<String>>>();
            List<Performance__c> performances = [ SELECT Id, Called__c, Capital_Drawn__c,Investment_Strategy__r.Investment_Strategy_Verified__c  FROM Performance__c Where Id = :recordId Limit 1 ];
            String layoutName = 'Experience User Performance Layout';
            if (performances.size()>0) {
    
                List<Metadata.Metadata> layouts = Metadata.Operations.retrieve(Metadata.MetadataType.Layout, new List<String> {'Performance__c-'+layoutName});

                Metadata.Layout layoutMd = (Metadata.Layout)layouts.get(0);
                for (Metadata.LayoutSection section : layoutMd.layoutSections) {
                    if (performances[0].Investment_Strategy__r?.Investment_Strategy_Verified__c && section.label == 'Alternative') {
                        section.label = 'Strategy Details';
                    }
                    String headerName = section.label + '_' + section.detailHeading;
                    List<List<String>> stringList = new List<List<String>>();
                    for (Metadata.LayoutColumn column : section.layoutColumns) {
                        if (column.layoutItems != null) {
                            List<String> temp = new List<String>();
                            for (Metadata.LayoutItem item : column.layoutItems) {
                                String tempVal = '' + item.field;
                                if (tempVal == 'Called__c' || tempVal == 'Capital_Drawn__c') {
                                    if ((tempVal == 'Called__c' && performances[0].Called__c !=null) || (tempVal == 'Capital_Drawn__c' && performances[0].Capital_Drawn__c !=null) ) {
                                        temp.add(''+item.field);
                                    }
                                } else {
                                    temp.add(''+item.field);
                                }
                            }
                            stringList.add(temp);
                        }
                    }
                    result.put(headerName, stringList);
                }
            }
            return result;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}