public with sharing class DakotaCopolitController {
    @AuraEnabled
    public static Map<String, Object> processQuery(String query, String threadId, string requestType) {
        Map<String, Object> emptyMap = new Map<String, Object>();
        List<Object> emptyFilter = new List<Object>();
        HttpResponse response = sendQueryToServer(query, threadId, requestType, 0, 0, emptyMap, emptyFilter, '','');
        String body;
        Map<String, Object> dataMap;
        if (response != Null && response.getStatusCode() == 200) {
            body = response.getBody();          
            if (String.isEmpty(body)) {
            // Handle empty response body
            body = '{"error":"The server response was empty. Please check your query and try again."}';
        	}
            dataMap = (Map<String, Object>) JSON.deserializeUntyped(body);
            return dataMap;
        } 
        else{
            body = '{"flag":1,"answer":"Oops! We’re having trouble reaching the server."}';
            dataMap = (Map<String, Object>) JSON.deserializeUntyped(body);
            return dataMap;
        }
    }

    @AuraEnabled
    public static Map<String, Object> processQueryAllRecords(String query, string requestType, Integer recordLimit, 
    Integer offset, Map<String, Object> order_by, List<Object> filter) {
        HttpResponse response = sendQueryToServer(query, '', requestType, recordLimit, offset, order_by, filter,'','');
        String body;
        Map<String, Object> dataMap;
        if (response != Null && response.getStatusCode() == 200) {
            body = response.getBody();     
            if (String.isEmpty(body)) {
            // Handle empty response body
            body = '{"error":"The server response was empty. Please check your query and try again."}';
        	}
            dataMap = (Map<String, Object>) JSON.deserializeUntyped(body);
            return dataMap;
        } 
        else{
            body = '{"flag":1,"answer":"Oops! We’re having trouble reaching the server."}';
            dataMap = (Map<String, Object>) JSON.deserializeUntyped(body);
            return dataMap;
        }
    }

    @AuraEnabled
    public static Map<String, Object> saveReports(String query, string requestType, Map<String, Object> order_by, List<Object> filter, string data, string reportName) {
        HttpResponse response = sendQueryToServer(query, '', requestType, 0, 0, order_by, filter, data, reportName);
        System.debug('Request Body: ' + JSON.serializePretty(new Map<String, Object>{
            'query' => query,
            'requestType' => requestType,
            'order_by' => order_by,
            'filter' => filter,
            'data' => data,
            'reportName' => reportName
        }));
    
        String body;
        Map<String, Object> dataMap;
        if (response != Null && response.getStatusCode() == 200) {
            body = response.getBody();     
            if (String.isEmpty(body)) {
            // Handle empty response body
            body = '{"error":"The server response was empty. Please check your query and try again."}';
        	}
            System.debug('Response Body: ' + body);

            dataMap = (Map<String, Object>) JSON.deserializeUntyped(body);
            return dataMap;
        } 
        else{
            body = '{"flag":1,"answer":"Oops! We’re having trouble reaching the server."}';
            System.debug('Error Response Body: ' + body);

            dataMap = (Map<String, Object>) JSON.deserializeUntyped(body);
            return dataMap;
        }
    }
   
    public static HttpResponse sendQueryToServer(String query, String threadId, String requestType, Integer recordLimit, 
    Integer offset, Map<String, Object> order_by, List<Object> filter, string data, string reportName) {
        try {
            // Input Validation
            if (requestType == null || requestType.trim() == '') {
                throw new CustomException('Invalid request type');
            }
            // Determine User and Org Info
            String userId = UserInfo.getUserId();
            String orgId = UserInfo.getOrganizationId();
            Boolean isAdmin = checkIfUserIsAdmin(userId);
            // Create Request Body based on Request Type
            Map<String, Object> requestBody = constructRequestBody(userId, orgId, isAdmin, query, threadId, requestType, recordLimit, offset, order_by, filter, data, reportName);
            // Serialize the Request Body to JSON
            String requestBodyJson = JSON.serialize(requestBody);
            // Send the HTTP Request
            HttpRequest request = createHttpRequest(requestBodyJson);
            Http http = new Http();
            return http.send(request);
        } catch (Exception e) {
            // Log the error and rethrow or return a custom error response
            System.debug('Error occurred while sending query to server: ' + e.getMessage());
            throw new CustomException('Failed to send request to server');
        }
    }

    // Helper Method to Construct the Request Body
    private static Map<String, Object> constructRequestBody(String userId, String orgId, Boolean isAdmin, String query, String threadId, String requestType, 
    Integer recordLimit, Integer offset, Map<String, Object> order_by, List<Object> filter, string data, string reportName) {
        Map<String, Object> requestBody = new Map<String, Object>();
        // Common Data for both types of requests
        requestBody.put('userId', userId);
        requestBody.put('orgId', orgId);
        requestBody.put('isAdmin', isAdmin);
        // Handle Different Request Types
        if(requestType == 'Prompt Request' && query != null && query != ''){
            requestBody.put('data', query);
            requestBody.put('threadId', threadId);
        }
        else if(requestType == 'History Request' && (query == null || query == '')){
        }
        else if(requestType == 'Chat History Request' && (query == null || query == '')){
            requestBody.put('threadId', threadId);
        }
        else if(requestType == 'Regenerate'){
            requestBody.put('query', query);
        }
        else if(requestType == 'View All Data' && offset != null && recordLimit != null){
            requestBody.put('query', query);
            requestBody.put('offset', offset);
            requestBody.put('limit', recordLimit);
            if(!order_by.isEmpty()){
                requestBody.put('order_by', order_by);
            }
            if(!filter.isEmpty()){
                requestBody.put('filter', filter);
            }
        }
        else if(requestType == 'saveReport'){
            requestBody.put('data', data);
            requestBody.put('query', query);
            requestBody.put('order_by', order_by);
            requestBody.put('filter', filter);
            requestBody.put('requestType', requestType);
            requestBody.put('reportName', reportName);

        }
        else {
            throw new CustomException('Invalid query or request type');
        }
        return requestBody;
    }

    // Helper Method to Create the HTTP Request Object
    private static HttpRequest createHttpRequest(String requestBodyJson) {
        HttpRequest request = new HttpRequest();
        request.setMethod('POST');
        request.setEndpoint(getEndpoint());
        request.setHeader('Content-Type', 'application/json');
        request.setTimeout(120000);  // 2-minute timeout
        request.setBody(requestBodyJson);
        return request;
    }

    // Helper Method to Check if User is Admin
    private static Boolean checkIfUserIsAdmin(String userId) {
        String userType = UserInfo.getUserType();
        if (userType == 'Standard') {
            String userProfile = [SELECT Profile.Name FROM User WHERE Id = :userId].Profile.Name;
            return (userProfile == 'System Administrator' || userProfile == 'Administrator');
        }
        return false;
    }

    @AuraEnabled(cacheable=true)
    public static Boolean isDakotaCopilotAccessibleForUser() {
        
        String userId = UserInfo.getUserId();
        PermissionSetAssignment psa = [
            SELECT Id 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :userId 
            AND PermissionSet.Name = 'Enable_Dakota_Bot'
            LIMIT 1
        ];     
        //return (psa != null);
        User currentUser = [SELECT Enable_Dakota_Copilot__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        //return currentUser.Enable_Dakota_Copilot__c;
        return ( (psa != null) && currentUser.Enable_Dakota_Copilot__c) ;
    }   

    // Helper Method to Get the Endpoint (can be retrieved from Custom Setting or Custom Metadata)
    private static String getEndpoint() {
        return DakotaGPT__c.getInstance().DakotaGPT_Endpoint__c;
    }

    // Custom Exception class
    public class CustomException extends Exception {}
    public static List<String> getObjectAndName(String objectName, String objAndField){
        String fieldName;
        if(objAndField.contains('.')){
            List<String> objectAndFieldList = objAndField.split('\\.');
            String currentObjectName = objectAndFieldList[0];
            String currentFieldName = objectAndFieldList[1];
            objectName = currentObjectName;
            fieldName = currentFieldName;
            if(currentFieldName.containsIgnoreCase(' as ')){
                List<String> nameAndAlias = currentFieldName.toLowerCase().split(' as ');
                fieldName = nameAndAlias[0].trim();
                String currentAliasName = nameAndAlias[1].trim().capitalize();  // We can send Alias as fieldName, actual fieldName will be used to get Metadata
                return new List<String>{objectName, fieldName, currentAliasName};
            }
        }else{
            fieldName = objAndField;
        }
        return new List<String>{objectName,fieldName};
    }

    public static List<String> getFieldsMetadata(String objectName, String fieldName){
        Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(objectName)?.getDescribe();
        String label;
        String dataType;
        if(objDescribe != Null) {
            Schema.DescribeFieldResult fieldDescribe = objDescribe.fields.getMap().get(fieldName)?.getDescribe();
            label = fieldDescribe != Null ? fieldDescribe.getLabel() : fieldName.capitalize();
            dataType = fieldDescribe != Null ? String.valueOf(fieldDescribe.getType()).toLowerCase() : Null ;
        }
        label = label == Null ? fieldName : label;
        return new List<String>{label, dataType};
    }

    public static Map<String, Object> generateColumnDefination(String label){
        Map<String, Object> column = new Map<String, Object>();
        column.put('fieldName', label);
        column.put('label', label);
        column.put('sortable', true);
        return column;
    }

    public static List<Object> generateColumnsList(String objectName, Map<String, Object> record) {
        List<Map<String, Object>> myColumns = new List<Map<String, Object>>();
        Map<String, String> dataTableKeys = new Map<String, String>();
        Boolean isSfidPresent = false;
        for(String key: record.keySet()) {
            List<String> objAndFieldList = getObjectAndName(objectName, key);
            String fieldObject = objAndFieldList[0];
            String fieldName = objAndFieldList[1];
            List<String> labelAndDataType = getFieldsMetadata(fieldObject, fieldName);
            String label = labelAndDataType[0];
            String dataType = labelAndDataType[1];
            if(objectName != fieldObject){
                if(objAndFieldList.size() == 3){
                    String fieldAlias = objAndFieldList[2];
                    label = fieldAlias;
                } else{
                    label = objectName.capitalize() + ': ' + label;
                }
            }   
            Map<String, Object> columnDefination = generateColumnDefination(label);
            dataTableKeys.put(key, label);
            if(fieldName == 'sfid'){
                isSfidPresent = true;
                continue;
            }else {
                Map<String,Object> typeAttributes = new Map<String,Object>();
                if((fieldObject == objectName && isSfidPresent) && (fieldName == 'name') || (fieldName == fieldObject + '.' + fieldObject + 'Number' || fieldName == fieldObject + '.' + 'Number')){
                        typeAttributes.put('label', new Map<String,String>{'fieldName' => label});
                        typeAttributes.put('target', '_blank');
                        columnDefination.put('fieldName', 'sfidLink');
                        columnDefination.put('type', 'url');
                        columnDefination.put('typeAttributes',typeAttributes);
                } else if(dataType != Null && dataType == String.valueof(Schema.DisplayType.Currency).toLowerCase()){
                    String orgCurrency = UserInfo.getDefaultCurrency();
                    typeAttributes.put('currencyCode', orgCurrency);
                    columnDefination.put('type', 'currency');
                    columnDefination.put('typeAttributes',typeAttributes);
                }
            }
            myColumns.add(columnDefination);
        }
        return new List<Object>{myColumns, dataTableKeys};
    }

    public static List<Map<String, Object>> generateDataTable(List<Object> records, Map<String, String> keysLabels){
        List<Map<String, Object>> dataTable = new List<Map<String, Object>>();
        Map<String, Object> currentRow;
        for(Object record: records){
            Map<String, Object> currentRecord = (Map<String, Object>) record; // dataType casted from Object dataType
            currentRow = new Map<String, Object>();
            for(String fieldKey: currentRecord.keySet()){
                if(keysLabels.containsKey(fieldKey)){
                    String key = (String) keysLabels.get(fieldKey);
                    if(key == 'sfid'){
                        currentRow.put('sfidLink', '/' + currentRecord.get(fieldKey));  // adding link of Record to be opened saperately as record detail page
                    }
                    currentRow.put(key, currentRecord.get(fieldKey));
                }
                else{
                    currentRow.put(fieldKey, currentRecord.get(fieldKey));
                }
            }
            dataTable.add(currentRow);
        }
        return dataTable;
    }
    @AuraEnabled(cacheable=true)
    public static List<Dakota_GPT_Prompts__mdt> getTopPrompts() {
        return [
            SELECT Frequent_Prompts__c, Prompt_Order__c 
            FROM Dakota_GPT_Prompts__mdt
            ORDER BY Prompt_Order__c ASC 
            LIMIT 5
        ];
    }
    
}