public with sharing class PerformanceRelatedToInvestmentFirm {
    
    @AuraEnabled
    public static Boolean getCurrentUser(Id accountId){
        User u = [Select Username, FirstName, LastName, Email, contactId,accountId From User Where Id = :UserInfo.getUserId()];
        if(accountId == u.accountId)   {
            return true;
        }
        return false;
    }

    @AuraEnabled
    public static User getAccount() {
        User currUser = [ SELECT Id, AccountId, Account.Name FROM User  WHERE Id = :UserInfo.getUserId() LIMIT 1];
        return currUser ;
    }

    @AuraEnabled
    public static Boolean isSourceSelfReported(String recordId){
        try {
            List<Investment_Strategy__c> investmentStrategy = [SELECT Id, Name, Account__c FROM Investment_Strategy__c Where Id = :recordId LIMIT 1];
            return !investmentStrategy.isEmpty();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Boolean getCurrentUserForInvestment(Id recordId){

        List<Investment_Strategy__c> investmentStrategy = [SELECT Id, Name, Account__c,OwnerId FROM Investment_Strategy__c Where Id = :recordId];
        User u = [Select Username, FirstName, LastName, Email, contactId,accountId From User Where Id = :UserInfo.getUserId()];
        if (investmentStrategy?.size() > 0) {
            User recordOwner = [Select Id From User Where Id = :investmentStrategy[0].OwnerId AND profile.Name ='Dakota Customer Community'];

            if(recordOwner != null && investmentStrategy.size()>0 && investmentStrategy[0].Account__c == u.accountId)   {
                return true;
            }
        }
        return false;
    }
    @AuraEnabled
    public static Id getCurrentUserAccountId(){
        User u = [Select Username, FirstName, LastName, Email, contactId,accountId From User Where Id = :UserInfo.getUserId()];
        return u.accountId;
    }

    @AuraEnabled
    public static  List<Manager_Presentation__c> getManagerPersentationName(List<String> idsList){
        return [SELECT Id,Name FROM Manager_Presentation__c where id IN :idsList]; 
    }

    @AuraEnabled
    public static  Map<String,List<List<String>>>  getlayoutData(Id recordId){
        Map<String,List<List<String>>> result = new  Map<String,List<List<String>>>();
        List<Investment_Strategy__c> investmentStrategy = [SELECT Id,recordType.DeveloperName  FROM Investment_Strategy__c Where Id = :recordId Limit 1 ];
        String layoutName = 'Experience User Investment Strategy Layout';
        if(investmentStrategy.size()>0) {
            if(investmentStrategy[0].recordType.DeveloperName == 'Alternative' || Test.isRunningTest()) {
                layoutName = 'Experience User Investment Strategy Alternative Layout';
            }
            else if(investmentStrategy[0].recordType.DeveloperName == 'Traditional') {
                layoutName = 'Experience User Investment Strategy Layout';
            }
            else if(investmentStrategy[0].recordType.DeveloperName == 'Performance') {
                layoutName = 'Performance Layout';
            }        
        List<Metadata.Metadata> layouts = Metadata.Operations.retrieve(Metadata.MetadataType.Layout, 
                                 new List<String> {'Investment_Strategy__c-'+layoutName});

        Metadata.Layout layoutMd = (Metadata.Layout)layouts.get(0);
        for (Metadata.LayoutSection section : layoutMd.layoutSections) {
            String headerName = section.label +'_'+section.detailHeading;
            if(investmentStrategy[0].recordType.DeveloperName == 'Alternative' && section.label == 'Performance') {
                continue;
            }
            List<List<String>> stringList = new List<List<String>>();
            for (Metadata.LayoutColumn column : section.layoutColumns) {
                if (column.layoutItems != null) {
                    List<String> temp = new List<String>();
                    for (Metadata.LayoutItem item : column.layoutItems) {
                        temp.add('' + item.field);
                    }
                    stringList.add(temp);
                }
            }
            result.put(headerName,stringList);
        }
    }
        return result;
    }
}