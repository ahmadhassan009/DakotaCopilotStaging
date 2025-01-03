public with sharing class NewObjectHomePageController {


    @AuraEnabled
    public static List<Investment__c> getNewInvestmentsRecord(Integer offSet, String sortOrder, String nullOrder,String sortedBy, Integer recordLimit, String recordTypeName) 
    {
        String investmentsQuery = 'SELECT Id, Name,Sub_Asset_Class_Picklist__c,Asset_Class_picklist__c,Account_Name__c, Account__c,Account__r.Name, Investment_Strategy__c, Investment_Strategy__r.Name,Funding_Year_Number__c,Ticker__c, Fund_Balance__c, CreatedDate';
        if (recordTypeName ==  'Public_Investment ') {            
            investmentsQuery += ' FROM Investment__c WHERE  RecordType.DeveloperName = :recordTypeName';            
        } else {
            investmentsQuery += ' FROM Investment__c WHERE  RecordType.DeveloperName = :recordTypeName AND Createddate > 2023-10-01T00:00:00Z ';
        }
        investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT '+recordLimit + ' OFFSET ' + offset;
        List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
        return returnedRecords;
    }

    @AuraEnabled
    public static Integer getNewInvestmentsCount(string recTypeName) {
        Investment_Counts__c investCount = Investment_Counts__c.getInstance('Investment Record Counts');
        return recTypeName == 'Public_Investment' ? integer.valueof(investCount.Public_Investment_Count__c) : integer.valueof(investCount.X13F_Fillings_Investment_Count__c);
    }

    @AuraEnabled
    public static Integer getNewAccountCount() {
        return [SELECT count() FROM Account WHERE recordType.Name <> 'Investment Firm' ];
    }

    @AuraEnabled
    public static List<Account> getNewAccountRecord(Integer offSet, String sortOrder, String nullOrder,String sortedBy, Integer recordLimit) 
    {
        String accountQuery = 'SELECT Id, Name, AUM__c,MetroArea__c,MetroArea__r.Name, CreatedDate,toLabel(Type)';
        accountQuery += ' FROM Account WHERE recordType.Name <> \'Investment Firm\'';
        accountQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT '+recordLimit + ' OFFSET ' + offset;
        List<Account> returnedRecords = Database.query(accountQuery); 
        return returnedRecords;
    }

    @AuraEnabled
    public static List<Form_D_Offering__c> getNewFormdRecord(Integer offSet, String sortOrder, String nullOrder,String sortedBy, Integer recordLimit) 
    {
        String formdQuery = 'SELECT Filed_On__c,Filed_At__c, Name_Issuer__c,Industry_Group__c ,Industry_Group_Fund_Type__c, Name, Account__c, Account__r.Name, Asset_Class__c, Sub_Asset_Class__c, Date_of_First_Sale__c, Total_Amount_Sold__c, Total_Number_Already_Invested__c, Recipient_Address__City__s,Recipient_Address__CountryCode__s FROM Form_D_Offering__c where Marketplace_verified__c=true';
        formdQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT '+recordLimit + ' OFFSET ' + offset;
        List<Form_D_Offering__c> returnedRecords = Database.query(formdQuery); 
        return returnedRecords;
    }
    @AuraEnabled
    public static Integer getNewFormdCount() 
    {
        return [SELECT count() FROM Form_D_Offering__c where Marketplace_verified__c=true ];
    
    }

    @AuraEnabled
    public static Integer getNewContactCount() {
        return [SELECT count() FROM Contact ];
    }

    @AuraEnabled
    public static List<Contact> getNewContactRecord(Integer offSet, String sortOrder, String nullOrder,String sortedBy, Integer recordLimit) 
    {
        String accountQuery = 'SELECT Id, Name,AccountId,Account_Name__c,Title, CreatedDate';
        accountQuery += ' FROM Contact ';
        accountQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT '+recordLimit + ' OFFSET ' + offset;
        List<Contact> returnedRecords = Database.query(accountQuery); 
        return returnedRecords;
    }
}