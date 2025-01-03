public with sharing class ExportRecordsMainController {
   
    /**
     * Check if the current user is trial user or not
     **/
    @AuraEnabled
    public static Boolean isTrialUser()
    {
        Id currentUserId = UserInfo.getUserId();
        List<User> usr = [SELECT Id from User where Id =:currentUserId AND ((Account.Active_Draft_Trial__c = true AND Account.Trial_Start_Date__c != null) OR (Allow_Account_and_Contacts_Export__c = false)) ];
        return usr.size() > 0 ? true : false;
    }

    @AuraEnabled
    public static Integer getInitialExportCount() 
    {
        Id currentUserId = UserInfo.getUserId();
        List<User> usr = [SELECT Id,Export_Batch_Limit__c from User where Id =:currentUserId AND Allow_Account_and_Contacts_Export__c = true];
        return usr.size() > 0 ? (Integer)usr[0].Export_Batch_Limit__c : 0;
    }

    @AuraEnabled
    public static Integer updateExportCount(Integer exportCount) 
    {
        Id currentUserId = UserInfo.getUserId();
        List<User> usr = [SELECT Id,Export_Batch_Limit__c from User where Id =:currentUserId AND Allow_Account_and_Contacts_Export__c = true];
        if(usr.size() > 0) 
        {
            usr[0].Export_Batch_Limit__c = exportCount;
            update usr;
            return (Integer)usr[0].Export_Batch_Limit__c;
        }
        return 0 ;
    }
    
    /**
     * Helper method to create unique keys for custom filter logic
     * Example: 1 in custom filter logic will be @&#__1__#&@
    **/
    private static Map<String,String> getFilterKeyMap(List<String> allFilters) 
    {
        Map<String,String> filterMap = new Map<String,String>();
        for(integer i = 0;i<allFilters.size();i++) 
        {
            filterMap.put(String.valueOf(i+1),'@&#__'+(i+1)+'__#&@');
        }
        return filterMap;
    }

    /**
     * Helper method to replace filter number with unique keys in custom filter logic
     * Example: 1 in custom filter logic will be replaced with @&#__1__#&@
    **/
    private static String replaceFilterLogicKeys(List<String> allFilters,Map<String,String> filterMap,String customLogic)
    {
        for(integer i = 0;i<allFilters.size();i++)
        {
            customLogic = customLogic.replaceAll(String.valueOf(i+1), filterMap.get(String.valueOf(i+1)));
        }
        return customLogic;
    }
      
    /**
     * Method to fetch records (Account/Contact)
     * Method to fetch records with respect to pagination
     * Method to fetch records with respect to applied filters & custom filter logic
    **/
    @AuraEnabled
    public static SObjectData fetchPaginatedRecords(String objectName, List<String> fieldsToBeDisplayed,Boolean previous,Boolean next,String firstId,String lastPagefirstId,String lastId,String filters,String customLogic)
    {
        if(!(fieldsToBeDisplayed.contains('Id')))
        {
            fieldsToBeDisplayed.add('Id');
        }
        
        String whereCondition = previous == true ? ' Where Id <= :firstId and Id >= :lastPagefirstId' : next == true ? ' Where Id > :lastId' : '';
        String countWhereCondition = '';
        Map<String,String> filterMap = new Map<String,String>();
        if(filters != '[]') 
        {
            List<String> allFilters = parseFilters(filters,objectName);
            whereCondition = whereCondition == '' ? ' Where ' : whereCondition + ' AND ';
            countWhereCondition = ' Where ';
            
            if(customLogic != '' && customLogic != null) {
                filterMap = getFilterKeyMap(allFilters);
                customLogic = replaceFilterLogicKeys(allFilters,filterMap,customLogic);

            }
            
            for(integer i = 0;i<allFilters.size();i++) 
            {
                if(customLogic != '' && customLogic != null) {
                    customLogic = customLogic.replaceAll(filterMap.get(String.valueOf(i+1)), Matcher.quoteReplacement(allFilters[i]));
                } else {
                    whereCondition += allFilters[i] + (i+1 == allFilters.size() ? '' :  ' AND ');
                    countWhereCondition += allFilters[i] + (i+1 == allFilters.size() ? '' :  ' AND ');
                }
            }
            if(customLogic != '' && customLogic != null) {
                whereCondition += '('+ customLogic + ')';
                countWhereCondition += '('+ customLogic + ')';
            }
        }
        
        String query = 'Select ' +  String.join(fieldsToBeDisplayed, ',') + ' From '+objectName + whereCondition +' Order By Id Limit ' +System.Label.Export_Records_Limit;
        SObjectData sObjectData = new SObjectData();
        sObjectData.count = fetchRecordsCount(objectName,countWhereCondition); 
        sObjectData.records = Database.query(query);
        return sObjectData;
    }

     /**
     * Helper method to desearlisze the filters and returned array of filters
    **/
    private static List<String> parseFilters(String filters, String objectName)
    {
        List<Comma_Supported_Fields_for_Custom_Filter__mdt> commaSupportedFields = [ SELECT Id, Supported_Fields__c FROM Comma_Supported_Fields_for_Custom_Filter__mdt ];
        List<String> lstOfCommmaSupportedFields = commaSupportedFields[0]?.Supported_Fields__c?.trim().split(','); 
        List<SingleFilter> returnedFilterArray = (List<SingleFilter>) JSON.deserialize(filters,List<SingleFilter>.class);
        List<String> filtersArray = new List<String>();
        String filterToBeReturned = '';
        String currentFilter = '';
        for(SingleFilter filter : returnedFilterArray)
        {
            String relatedObjectName = '';
            if(filter?.objectName != null && objectName!=filter?.objectName)
            {
                relatedObjectName = filter?.objectName+'.';
            }
            
            if( (filter.type == 'reference' && (filter.field == 'MetroArea__r.Name'|| filter.field == 'Metro_Area__r.Name')) || (filter.type == 'picklist')  ) {
                String filterValue = filter.value;            
                filterValue = String.escapeSingleQuotes(filterValue);                  
                List<String> filterValueTokens = filterValue.split(';');   
                filterValue = '('+ '\''+String.join(filterValueTokens,'\',\'')+'\''+')';
                currentFilter = relatedObjectName + filter.field; 
                if(filter.operator == 'contains' || filter.operator == 'equals')
                {
                    currentFilter += ' IN '+ filterValue;
                }
                else 
                {
                    currentFilter += ' NOT IN '+ filterValue;
                }
            }
            else if(filter.type == 'boolean') {
                Boolean boolValue = filter.value == 'true' ? true : false;
                currentFilter = ' ' + relatedObjectName + filter.field + ' '+setOperator(filter.operator,filter.type)+ ' '+boolValue;
            }
            else if( filter.type == 'datetime' && filter.operator == 'equals') {
                String startDate = setValue(filter.type,filter.value,filter.operator);
                String endDate = filter.value + 'T23:59:59.999+0000';
                currentFilter = ' ('+ relatedObjectName + filter.field + ' >= '+startDate+ ' AND '+filter.field+' <= '+endDate+ ') ';
            }
            else if( filter.type == 'datetime' && filter.operator == 'not equals') {
                String startDate = setValue(filter.type,filter.value,filter.operator);
                String endDate = filter.value + 'T23:59:59.999+0000';
                currentFilter = ' ('+relatedObjectName + filter.field + ' <= '+startDate+ ' OR '+filter.field+' >= '+endDate+ ') ';
            }
            else if(filter.type == 'number') {
                Decimal value = 0.0;
                if(filter.value!='')
                {
                    value = Decimal.valueOf(filter.value)+0.0;
                }
                currentFilter = ' '+ relatedObjectName + filter.field + ' '+setOperator(filter.operator,filter.type)+ ' '+value;
                if (filter.operator == 'equals' && filter.value=='' ) {
                    currentFilter = ' ('+ relatedObjectName + filter.field + ' = NULL )';
                }
                else if (filter.type == 'number' && filter.operator == 'not equal to' && filter.value=='' ) {
                    currentFilter = ' ('+ relatedObjectName + filter.field + ' != NULL )';
                }
            }
            else if (filter.type == 'multipicklist')
            {
                String filterValue = filter.value;
                filterValue = String.escapeSingleQuotes(filterValue);
                List<String> filterValueTokens = filterValue.split(';');
                filterValue = '('+ '\''+String.join(filterValueTokens,'\',\'')+'\''+')';
                currentFilter = '';
                if(filter.operator == 'equals')
                {
                    currentFilter += '(';
                    for(String filterVal :filterValueTokens)
                    {
                        currentFilter +=relatedObjectName+ filter.field +'='+ '\'' +filterVal + '\''+ ' OR ';
                    }
                    
                    currentFilter = currentFilter.substring(0, currentFilter.length() - 3);
                    currentFilter += ')';
                }
                else if(filter.operator == 'includes')
                {
                    currentFilter +=relatedObjectName+ filter.field+ ' includes '+ filterValue;
                }
                else if(filter.operator == 'excludes')
                {
                    currentFilter +=relatedObjectName+ filter.field+ ' excludes '+ filterValue;
                }
                else 
                {
                    currentFilter += '(';
                    for(String filterVal :filterValueTokens)
                    {
                        currentFilter +=relatedObjectName+ filter.field +'!='+ '\'' + filterVal + '\'' + ' AND ';
                    }
                    currentFilter = currentFilter.substring(0, currentFilter.length() - 4);
                    currentFilter += ')';
                }
            }     

            else {
                String value = setValue(filter.type, filter.value, filter.operator);
                String operator = setOperator(filter.operator,filter.type);
                if (lstOfCommmaSupportedFields.contains(filter.field)) {
                    List<String> splittedValues = new List<String>();
                    splittedValues = filter.value?.split(',', -1);
                    String comutedFilter = '';
                    for (String splittedValue: splittedValues) {
                        if (operator == 'NOT LIKE') {
                            comutedFilter = String.isNotBlank(comutedFilter) ? ( comutedFilter + ' AND (NOT ' + relatedObjectName + filter.field + ' LIKE ' + setValue(filter.type, splittedValue?.trim(), filter.operator) + ')') : '(NOT ' + relatedObjectName + filter.field + ' LIKE ' + setValue(filter.type, splittedValue?.trim(), filter.operator) + ')';
                        } else if (filter.operator == 'not equal to') {
                            comutedFilter = String.isNotBlank(comutedFilter) ? ( comutedFilter + ' AND ' + relatedObjectName + filter.field + ' ' + operator + ' ' + setValue(filter.type, splittedValue?.trim(), filter.operator)) : (' ' + relatedObjectName + filter.field + ' ' + operator + ' ' + setValue(filter.type, splittedValue?.trim(), filter.operator));
                        } else {
                            comutedFilter = String.isNotBlank(comutedFilter) ? ( comutedFilter + ' OR ' + relatedObjectName + filter.field + ' ' + operator + ' ' + setValue(filter.type, splittedValue?.trim(), filter.operator)) : (' ' + relatedObjectName + filter.field + ' ' + operator + ' ' + setValue(filter.type, splittedValue?.trim(), filter.operator));
                        }
                    }
                    currentFilter = '(' + comutedFilter + ')';
                } else {
                    if (operator == 'NOT LIKE') {
                        currentFilter = ' (NOT '+ relatedObjectName + filter.field + ' LIKE '+value+')';
                    } else {
                        currentFilter = ' '+relatedObjectName +filter.field + ' '+operator+ ' '+value;
                    }
                }
            }
            filtersArray.add(currentFilter);
        }
        return filtersArray;
    }

    /**
     * Helper method to update the applied filter value, like adding escape quotes before search term
     * or adding time in case of date time field, or creating list of picklist values 
    **/
    private static String setValue(String filterType,String filterValue,String operator)
    {
        if((operator == 'equals' || operator == 'not equal to') && 
           (filterType == 'string' || filterType == 'reference' || filterType == 'picklist' || filterType == 'id'))
        {
            filterValue = String.escapeSingleQuotes(filterValue);
            filterValue = '\''+ filterValue + '\'';
            return filterValue;
        }
        else if((filterType == 'string' || filterType =='reference') && 
                (operator == 'contains' || operator == 'does not contain'))
        {
            filterValue = String.escapeSingleQuotes(filterValue);
            filterValue = '\''+ '%'+ filterValue +'%' + '\'';
            return filterValue;
        }
        else if((filterType == 'picklist') && (operator == 'contains' || operator == 'does not contain'))
        {
            filterValue = String.escapeSingleQuotes(filterValue);
            List<String> filterValueTokens = filterValue.split(',');
            filterValue = '('+ '\''+String.join(filterValueTokens,'\',\'')+'\''+')';
            return filterValue;
        }
        else if(filterType == 'datetime')
        {
            filterValue = filterValue + 'T00:00:00.000+0000';
            return filterValue;
        }
        return filterValue;
    }

     /**
     * Helper method to set operators, basically updating filters with respect to SOQL filters
    **/
    private static String setOperator(String operator,String filterType)
    {
        String convertedOpertor; 
        if(operator =='equals')
        {
           convertedOpertor= '=';
        }
        else if(operator =='not equal to')
        {
            convertedOpertor= '!=';
        }
        else if(operator =='not null')
        {
            convertedOpertor= 'is not null';
        }
        else if(operator =='greater than')
        {
            convertedOpertor= '>';
        }
        else if(operator =='less than')
        {
            convertedOpertor= '<';
        }
        else if(operator =='greater or equal')
        {
            convertedOpertor= '>=';
        }
        else if(operator =='less or equal')
        {
            convertedOpertor= '<=';
        }
        else if(operator =='contains')
        {
            convertedOpertor= filterType == 'picklist'  ? 'IN' : 'LIKE';
        }
        else if(operator =='does not contain')
        {
            convertedOpertor= filterType == 'picklist' ? 'NOT IN' : 'NOT LIKE';
        }
        return convertedOpertor;
    }

      /**
     * Helper method to fetch total number of records with respect to the applied filter
    **/    
    private static Integer fetchRecordsCount(String objectName, String whereCondition)
    {
        String query = 'Select COUNT() From '+ objectName + ' ' +whereCondition;
        return Database.countQuery(query);
    }

     /**
     * Helper method to fetch fields on Account/Contact for display fields option and fitler values
    **/       
    @AuraEnabled
    public static List<SObjectFields> fetchSObjectFields(String objectName)
    {
        Map<String,Schema.SObjectField> mapOfSObjectFields;
        List<SObjectFields> fieldsToBeReturned = new List<SObjectFields>();
        if(objectName == 'Account')
        {
            mapOfSObjectFields = Schema.SObjectType.Account.fields.getMap();
        }
        else if(objectName=='Contact')
        {
            mapOfSObjectFields = Schema.SObjectType.Contact.fields.getMap();
            
        }

        List<Excluded_Fields_From_Custom_Export_View__mdt> excludedFieldsMetaData = [Select Id,Excluded_Fields_of_Account__c,Excluded_Fields_of_Contact__c 
                                                                                      from Excluded_Fields_From_Custom_Export_View__mdt];
        List<String> excludedFields = objectName=='Account'?  excludedFieldsMetaData[0]?.Excluded_Fields_of_Account__c?.trim().split(',') :excludedFieldsMetaData[0]?.Excluded_Fields_of_Contact__c?.trim().split(',');
        for(integer i=0;i<excludedFields.size();i++)
        {
            excludedFields[i] = excludedFields[i].toLowercase();
        }
        for(String fiedName : mapOfSObjectFields.keySet())
        {
            Schema.DescribeFieldResult field = mapOfSObjectFields.get(fiedName).getDescribe();
            if(field.isAccessible() && String.valueOf(field.getType()) != 'address')
            {
				if(excludedFields?.contains(field.getName().toLowerCase()))
                {
                    continue;
                }
                SObjectFields sObjFields = new SObjectFields();
                sObjFields.label = field.getName() =='Phone'? 'Phone': field.getLabel();
                sObjFields.apiName = field.getName();
                sObjFields.fieldType = String.valueOf(field.getType());
                sObjFields.isFilterable = field.isFilterable();
                fieldsToBeReturned.add(sObjFields);
            }
        }
        return fieldsToBeReturned;
    }


       /**
     * Helper method to fetch operators from custom metdata based on the field type.
     * This is used while creating filter on the front end
    **/     
    @AuraEnabled
    public static List<FieldInfoWrapper> getOperators(String fieldType)
    {
        Map<String, Field_Information_for_Custom_Filters__mdt> fieldInfoMap = Field_Information_for_Custom_Filters__mdt.getAll();

        List<FieldInfoWrapper> listOfOperatorsToBeReturned = new List<FieldInfoWrapper>();
        for(String key : fieldInfoMap.keySet())
        {
            FieldInfoWrapper fieldInfo = new FieldInfoWrapper();
            fieldInfo.fieldName = fieldInfoMap.get(key).Label;
            fieldInfo.operators = fieldInfoMap.get(key).Value_Operators__c;
            listOfOperatorsToBeReturned.add(fieldInfo);
        }
        return listOfOperatorsToBeReturned;
    }

    @AuraEnabled
    public static List<PicklistWrapper> getPicklistValues(string objectApiName,List<string> fieldApiNames)
    {     
        List<PicklistWrapper> picklistValuesList = new List<PicklistWrapper>();
        try 
        {
            for(String field : fieldApiNames )
            {
                PicklistWrapper picklistValues=new PicklistWrapper();
                picklistValues.fieldName = field;
                picklistValues.valuesLabelsMap = new Map<string,string>();
                Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
                Schema.DescribeFieldResult fieldDescribe = describeResult.fields.getMap().get(field).getDescribe();
                List<Schema.PicklistEntry> picklistEntries = fieldDescribe.getPicklistValues();
                for (Schema.PicklistEntry entry : picklistEntries) {
                    picklistValues.valuesLabelsMap.put(entry.getValue(), entry.getLabel());
                }
                picklistValuesList.add(picklistValues);
            }
        } 
        catch (Exception e) 
        {
            System.debug('Error: ' + e.getMessage());
        }
        return picklistValuesList;
    }

    @AuraEnabled
    public static List<String> getMetroAreaNames()
    {
        List<String> metroAreaNamesList = new List<String>();
        List<Metro_Area__c> metroAreaList = [SELECT Id, Name FROM Metro_Area__c order by Name];
        for(Metro_Area__c metro : metroAreaList)
        {
            metroAreaNamesList.add(metro.Name);
        }
        return metroAreaNamesList;
    }
    
    public class PicklistWrapper
    {
        @AuraEnabled public String fieldName {get;set;}
        @AuraEnabled public Map<String,String> valuesLabelsMap {get;set;} 
    }

    public class SObjectFields
    {
        @AuraEnabled public String label {get;set;}
        @AuraEnabled public String apiName {get;set;} 
        @AuraEnabled public String fieldType {get;set;}
        @AuraEnabled public Boolean isFilterable {get;set;}
    }

    public class SObjectData
    {
        @AuraEnabled public List<SObject> records {get;set;}
        @AuraEnabled public Integer count {get;set;}
    }


    public class FieldInfoWrapper
    {
        @AuraEnabled public String fieldName {get;set;}
        @AuraEnabled public String operators {get;set;} 
    }
    
    public Class SingleFilter 
    {
        @AuraEnabled public String type {get;set;}
        @AuraEnabled public String label {get;set;} 
        @AuraEnabled public String operator {get;set;} 
        @AuraEnabled public String value {get;set;} 
        @AuraEnabled public String field {get;set;}
        @AuraEnabled public String objectName {get;set;}
    }

}