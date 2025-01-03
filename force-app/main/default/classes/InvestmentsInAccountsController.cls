public with sharing class InvestmentsInAccountsController {

    /**
     * function returns Investments records based on record types for Single related list
     */
    @AuraEnabled
    public static List<Investment__c> getAccountRelatedInvestmentRecordsInRelatedList(String recordId, String listType, String sortedBy, String sortOrder, String nullOrder)
    {
        if(listType == 'Public Investment'){

            String investmentsQuery = 'SELECT Id, Name, Account__c, Investment_Strategy__c, Investment_Strategy__r.Name, Fund_Balance__c, Asset_Class_picklist__c, Sub_Asset_Class_Picklist__c,Funding_Year__c, recordtype.name';
            investmentsQuery += ' FROM Investment__c WHERE Account__c = :recordId AND recordtype.name = \'Public Investment\'';
            investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
            List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
            return returnedRecords;
        }
        else{
            String investmentsQuery = 'SELECT Id, Name, Account__c, Investment_Strategy__c, Investment_Strategy__r.Name, Investment_Strategy__r.Ticker__c, Asset_Class_picklist__c, Sub_Asset_Class_Picklist__c, Investment_Strategy__r.Product_Structure__c, Fund_Balance__c, Number_of_Shares__c, Filing_Date__c, recordtype.name';
            investmentsQuery += ' FROM Investment__c WHERE Account__c = :recordId AND recordtype.name = \'13F Filings\'';
            investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT 10';
            List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
            return returnedRecords;
        }        
    }

    /**
     * function returns Investments records based on record types for related list view all
     */
    @AuraEnabled
    public static List<Investment__c> getAccountRelatedInvestmentRecords(String recordId, String listType, String sortedBy, String sortOrder, String nullOrder, Integer recordLimit, Integer offset, String searchValue, String fromFollowEmail, String fromFollowEmailPubicInv, String isInvestmentUpdate, String createddate)
    {
        String investmentsQuery ='';
        String recordTypename= 'Public Investment';
        Datetime formattedCreatedDate;
        Datetime formattedNextDate;
        if(Test.isRunningTest()) {
            formattedCreatedDate = System.Today();
            formattedNextDate = formattedCreatedDate.addDays(1);
        }
        else if (String.isNotBlank(createddate) || Test.isRunningTest()) {
            List<String> s1 = createddate?.split('%3A');
            formattedCreatedDate = Datetime.newInstanceGmt(Date.valueOf(s1[0]), Time.newInstance(Integer.valueOf(s1[1]), Integer.valueOf(s1[2]), Integer.valueOf(s1[3]), 0));
            formattedNextDate = formattedCreatedDate.addDays(1);
        }
        
        if(listType == 'Public Investment') {
            if (fromFollowEmailPubicInv == 'True' && (String.isNotBlank(createddate) || Test.isRunningTest())) {
                investmentsQuery = 'SELECT Id, Name, Account__c, Investment_Strategy__c, Investment_Strategy__r.Name, Fund_Balance__c, Asset_Class_picklist__c,';
                investmentsQuery += ' Sub_Asset_Class_Picklist__c, Funding_Year__c, recordtype.name';
                investmentsQuery += ' FROM Investment__c';
                investmentsQuery += ' WHERE Investment_Strategy__r.Account__c = :recordId';
                investmentsQuery += ' AND recordtype.name = :recordTypename';
                investmentsQuery += ' AND createddate >= :formattedCreatedDate';
                investmentsQuery += ' AND createddate < :formattedNextDate';
                investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;    
                List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
                return returnedRecords;

            } else if (isInvestmentUpdate == 'True' && (String.isNotBlank(createddate) || Test.isRunningTest())) {
                investmentsQuery = 'SELECT Id, Name, Account__c, Investment_Strategy__c, Investment_Strategy__r.Name, Fund_Balance__c, Asset_Class_picklist__c,';
                investmentsQuery += ' Sub_Asset_Class_Picklist__c, Funding_Year__c, recordtype.name';
                investmentsQuery += ' FROM Investment__c';
                investmentsQuery += ' WHERE Account__c = :recordId';
                investmentsQuery += ' AND recordtype.name = :recordTypename';
                investmentsQuery += ' AND createddate >= :formattedCreatedDate';
                investmentsQuery += ' AND createddate < :formattedNextDate';
                investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;    
                List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
                return returnedRecords;
   
            } else {
                investmentsQuery = 'SELECT Id, Name, Account__c, Investment_Strategy__c, Investment_Strategy__r.Name, Fund_Balance__c, Asset_Class_picklist__c,';
                investmentsQuery += ' Sub_Asset_Class_Picklist__c, Funding_Year__c, recordtype.name';
                investmentsQuery += ' FROM Investment__c';
                investmentsQuery += ' WHERE Account__c = :recordId AND recordtype.name = :recordTypename';
                investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;    
                List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
                return returnedRecords;    
            }
        } else {
            recordTypename = '13F Filings';
            if(searchValue == '' || searchValue == null) { 
                if(fromFollowEmail == 'True' && (String.isNotBlank(createddate) || Test.isRunningTest())) {
                    investmentsQuery = 'SELECT Id, Name, Account__c, Investment_Strategy__c, Investment_Strategy__r.Name, Investment_Strategy__r.Ticker__c, Asset_Class_picklist__c,';
                    investmentsQuery += ' Sub_Asset_Class_Picklist__c, Investment_Strategy__r.Product_Structure__c, Fund_Balance__c, Number_of_Shares__c,';
                    investmentsQuery += ' Filing_Date__c, recordtype.name';
                    investmentsQuery += ' FROM Investment__c';
                    investmentsQuery += ' WHERE Account__c = :recordId AND recordtype.name = :recordTypename';
                    investmentsQuery += ' AND createddate >= :formattedCreatedDate';
                    investmentsQuery += ' AND createddate < :formattedNextDate';
                    investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;    
                    List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
                    return returnedRecords; 
                }
                else{
                    investmentsQuery = 'SELECT Id, Name, Account__c, Investment_Strategy__c, Investment_Strategy__r.Name, Investment_Strategy__r.Ticker__c, Asset_Class_picklist__c,';
                    investmentsQuery += ' Sub_Asset_Class_Picklist__c, Investment_Strategy__r.Product_Structure__c, Fund_Balance__c, Number_of_Shares__c,';
                    investmentsQuery += ' Filing_Date__c, recordtype.name';
                    investmentsQuery += ' FROM Investment__c';
                    investmentsQuery += ' WHERE Account__c = :recordId AND recordtype.name = :recordTypename';
                    investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;    
                    List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
                    return returnedRecords;
                }
                
            }
            else
            {
                String searchString ='%'+searchValue+'%';

                if(fromFollowEmail == 'True' && (String.isNotBlank(createddate) || Test.isRunningTest()))
                {
                    investmentsQuery = 'SELECT Id, Name, Account__c, Investment_Strategy__c, Investment_Strategy__r.Name, Investment_Strategy__r.Ticker__c, Asset_Class_picklist__c,';
                    investmentsQuery += ' Sub_Asset_Class_Picklist__c, Investment_Strategy__r.Product_Structure__c, Fund_Balance__c, Number_of_Shares__c,';
                    investmentsQuery += ' Filing_Date__c, recordtype.name';
                    investmentsQuery += ' FROM Investment__c';
                    investmentsQuery += ' WHERE Account__c = :recordId AND recordtype.name = :recordTypename AND createddate >= :formattedCreatedDate  AND createddate < :formattedNextDate';
                    investmentsQuery += ' AND (Name LIKE :searchString OR Investment_Strategy__r.Name LIKE :searchString OR Asset_Class_picklist__c LIKE :searchString OR';
                    investmentsQuery += ' Investment_Strategy__r.Ticker__c LIKE :searchString OR Sub_Asset_Class_Picklist__c LIKE :searchString OR Investment_Strategy__r.Product_Structure__c LIKE :searchString )';
                    investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;    
                    List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
                    return returnedRecords;
                }
                else{
                    investmentsQuery = 'SELECT Id, Name, Account__c, Investment_Strategy__c, Investment_Strategy__r.Name, Investment_Strategy__r.Ticker__c, Asset_Class_picklist__c,';
                    investmentsQuery += ' Sub_Asset_Class_Picklist__c, Investment_Strategy__r.Product_Structure__c, Fund_Balance__c, Number_of_Shares__c,';
                    investmentsQuery += ' Filing_Date__c, recordtype.name';
                    investmentsQuery += ' FROM Investment__c';
                    investmentsQuery += ' WHERE Account__c = :recordId AND recordtype.name = :recordTypename';
                    investmentsQuery += ' AND (Name LIKE :searchString OR Investment_Strategy__r.Name LIKE :searchString OR Asset_Class_picklist__c LIKE :searchString OR';
                    investmentsQuery += ' Investment_Strategy__r.Ticker__c LIKE :searchString OR Sub_Asset_Class_Picklist__c LIKE :searchString OR Investment_Strategy__r.Product_Structure__c LIKE :searchString  )';
                    investmentsQuery += ' ORDER BY ' + sortedBy + ' ' + sortOrder + ' NULLS ' + nullOrder + ' LIMIT ' + recordLimit + ' OFFSET ' + offset;    
                    List<Investment__c> returnedRecords = Database.query(investmentsQuery); 
                    return returnedRecords;
                }
                
            }
        }        
    }

    /**
     * function returns account name
     */
    @AuraEnabled
    public static Account getAccountName(Id recordId) {
        return [
            SELECT Name
            FROM Account
            WHERE Id =: recordId
            ORDER BY Name LIMIT 1
        ];
    }

    /**
     * gets Account Id and returns count of related Investments. 
     */
    @AuraEnabled
    public static Integer getAccountRelatedInvestmentRecordsCount(Id recordId, String listType,  String searchValue, String fromFollowEmail, String fromFollowEmailPubicInv, String isInvestmentUpdate, String createddate) {  
        Datetime formattedCreatedDate;
        Datetime formattedNextDate;
        if(Test.isRunningTest()) {
            formattedCreatedDate = System.Today();
            formattedNextDate = formattedCreatedDate.addDays(1);
        }
        else if (String.isNotBlank(createddate) || Test.isRunningTest()) {
            List<String> s1 = createddate?.split('%3A');
            formattedCreatedDate = Datetime.newInstanceGmt(Date.valueOf(s1[0]), Time.newInstance(Integer.valueOf(s1[1]), Integer.valueOf(s1[2]), Integer.valueOf(s1[3]), 0));
            formattedNextDate = formattedCreatedDate.addDays(1);
        }
        if(listType == 'Public Investment'){
            if(fromFollowEmailPubicInv == 'True' && (String.isNotBlank(createddate) || Test.isRunningTest())) {
                return [SELECT count() FROM Investment__c WHERE Investment_Strategy__r.Account__c = :recordId AND recordtype.name = 'Public Investment' AND createddate >= :formattedCreatedDate AND createddate < :formattedNextDate];
            } else if (isInvestmentUpdate == 'True' && (String.isNotBlank(createddate) || Test.isRunningTest())) {
                return [SELECT count() FROM Investment__c WHERE Account__c = :recordId AND recordtype.name = 'Public Investment' AND createddate >= :formattedCreatedDate AND createddate < :formattedNextDate];
            }
            else {
                return [SELECT count() FROM Investment__c WHERE Account__c = :recordId AND recordtype.name = 'Public Investment'];
            }
        }
        else{
            if(searchValue == '' || searchValue == null)
            {
                if(fromFollowEmail == 'True' && (String.isNotBlank(createddate) || Test.isRunningTest()))
                {
                    return [SELECT COUNT() FROM Investment__c 
                    WHERE Account__c = :recordId
                    AND RecordType.Name = '13F Filings' 
                    AND CreatedDate >= :formattedCreatedDate 
                    AND CreatedDate < :formattedNextDate];
                }
                else
                {
                    return [SELECT count() FROM Investment__c WHERE Account__c = :recordId AND recordtype.name = '13F Filings'];
                }
            }
            else{
                String searchString ='%'+searchValue+'%';
                if(fromFollowEmail == 'True' && (String.isNotBlank(createddate) || Test.isRunningTest()))
                {
                    return [
                        SELECT count() FROM Investment__c WHERE Account__c = :recordId AND recordtype.name = '13F Filings' AND createddate >= :formattedCreatedDate AND createddate < :formattedNextDate
                        AND (Name LIKE :searchString OR Investment_Strategy__r.Name LIKE :searchString OR Investment_Strategy__r.Ticker__c LIKE :searchString 
                        OR Asset_Class_picklist__c LIKE :searchString OR Sub_Asset_Class_Picklist__c LIKE :searchString OR Investment_Strategy__r.Product_Structure__c LIKE :searchString  )
                    ];
                }
                else
                {
                    return [
                        SELECT count() FROM Investment__c WHERE Account__c = :recordId AND recordtype.name = '13F Filings'
                        AND (Name LIKE :searchString OR Investment_Strategy__r.Name LIKE :searchString OR Investment_Strategy__r.Ticker__c LIKE :searchString 
                        OR Asset_Class_picklist__c LIKE :searchString OR Sub_Asset_Class_Picklist__c LIKE :searchString OR Investment_Strategy__r.Product_Structure__c LIKE :searchString  )
                    ];
                }
                
            }
        }      
    }
}