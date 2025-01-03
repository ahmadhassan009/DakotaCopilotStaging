public with sharing class DakotaCopolitController {
    
    @AuraEnabled
    public static Map<String, Object> processQuery(String query, String threadId, string requestType) {
        HttpResponse response = sendQueryToServer(query, threadId, requestType);
        system.debug('line 6: ' + query);
        if (response != Null && response.getStatusCode() == 200) {
            String body = response.getBody();
            if(body != Null && body !='' && body!='Null') {
                Map<String, Object> dataMap = (Map<String, Object>) JSON.deserializeUntyped(body);
                // return handleServerResponse(dataMap);
                system.debug('line 11: ' + dataMap);
                return dataMap;
            }else
            {	
                system.debug('line 15 : else part');
                String error ='The answer is missing or empty. Could you please rephrase your question?';
                return new Map<String, Object>{'error' => error};
            }
        } 
        else if(response == Null) {
            system.debug('line 20: null response');
        throw new AuraHandledException('Blank value is not allowed, please provide valid input.');
        }
        else{
            throw new AuraHandledException('Input cannot be processed right now at Azure');
            // throw new AuraHandledException('Message received from Server: ' + response.getStatus());
        }
    }
     
    public static HttpResponse sendQueryToServer(String query, String threadId, String requestType) {
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
            Map<String, Object> requestBody = constructRequestBody(query, threadId, requestType, userId, orgId, isAdmin);

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
    private static Map<String, Object> constructRequestBody(String query, String threadId, String requestType, String userId, String orgId, Boolean isAdmin) {
        Map<String, Object> requestBody = new Map<String, Object>();

        // Common Data for both types of requests
        requestBody.put('userId', userId);
        requestBody.put('orgId', orgId);
        requestBody.put('isAdmin', isAdmin);


        // Handle Different Request Types
        if (requestType == 'Prompt Request' && query != null && query != '') {
            requestBody.put('data', query);
            requestBody.put('threadId', threadId);
        } else if (requestType == 'History Request' && (query == null || query == '')) {
            requestBody.put('data', '');
        }else if (requestType == 'Chat History Request' && (query == null || query == '')) {
            requestBody.put('threadId', threadId);
        }else {
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

    // Helper Method to Get the Endpoint (can be retrieved from Custom Setting or Custom Metadata)
    private static String getEndpoint() {
        return 'http://staging5.rolustech.com:14886/chatcomplete'; // Ideally, use custom settings or metadata
    }

    // Custom Exception class
    public class CustomException extends Exception {}

    /*public static HttpResponse sendQueryToServer(String query, String threadId, string requestType) {
            Boolean isAdmin = false;
            String userId = UserInfo.getUserId();
            String orgId = UserInfo.getOrganizationId();
            String userType = UserInfo.getUserType();
            if (userType == 'Standard') {
                String userProfile = [SELECT Profile.Name FROM User WHERE Id = :userId].Profile.Name;
                if (userProfile == 'System Administrator' || userProfile == 'Administrator') {
                    isAdmin = true;
                }
            }
            
            Map<String, Object> requestBody;
            String requestBodyJson;
            HttpRequest request = new HttpRequest();
            request.setMethod('POST');
            request.setTimeout(120000); // 2 minutes
            request.setHeader('Content-Type', 'application/json');
            String endPoint = 'http://staging5.rolustech.com:14886/chatcomplete';
            request.setEndpoint(endPoint);
            requestBody = new Map<String, Object> {'data' => query, 'userId' => userId, 'isAdmin' => isAdmin, 'orgId' => orgId, 'threadId' => threadId};
            requestBodyJson = JSON.serialize(requestBody);
			request.setBody(requestBodyJson);
			return new Http().send(request);
    }*/
    
    // public static Map<String, Object> handleServerResponse(Map<String, Object> dataMap) {
    //     Map<String, Object> resultResponse = new Map<String, Object>();
    //     try{
    //         Integer flag = (Integer) dataMap.get('flag');
    //         resultResponse.put('flag', flag);
    //         Map<String, Object> sqlQueryResult = (Map<String, Object>) JSON.deserializeUntyped(String.valueOf(dataMap.get('SQL_Query_Result')));
    //         resultResponse.put('SQL_Query_Result', sqlQueryResult);
    //         Map<String, Object> sqlQueryColumns = (Map<String, Object>) JSON.deserializeUntyped(String.valueOf(dataMap.get('SQL_Query_Columns')));
    //         resultResponse.put('SQL_Query_Columns', sqlQueryColumns);
            
            
    //         system.debug('line 70: ' + sqlQueryColumns);
    //         /* String sqlQuery = (String) dataMap.get('SQL_Query');
    //         Map<String, Object> sqlQueryResult = (Map<String, Object>) JSON.deserializeUntyped(String.valueOf(dataMap.get('SQL_Query_Result')));
    //         String answer = (String) dataMap.get('Answer');
    //         String reportFilters = (String) dataMap.get('filter_value');
    //         String error = (String) dataMap.get('error');
    //         Integer flag = (Integer) dataMap.get('flag');
    //         resultResponse.put('flag', flag);
    //         resultResponse.put('answer', answer);
    //         resultResponse.put('error', error);
    //         resultResponse.put('reportFilters', reportFilters);
    //         if(sqlQueryResult != Null && sqlQueryResult.size() > 0) {
    //             String objectName = sqlQueryResult.keySet().iterator().next();
    //             if(objectName!= Null && objectName!= '') {
    //                 List<Object> records = (List<Object>) sqlQueryResult.get(objectName);
    //                 if(records != Null && records.size() > 0) {
    //                     List<Object> columnsAndKeys = generateColumnsList(objectName, (Map<String, Object>) records[0]);
    //                     List<Map<String, Object>> columns = (List<Map<String, Object>>) columnsAndKeys[0];
    //                     Map<String, String> dataTableKeys = (Map<String, String>) columnsAndKeys[1];
    //                     List<Map<String, Object>> dataTable = generateDataTable(records, dataTableKeys);
    //                     resultResponse.put('columns', columns);
    //                     resultResponse.put('dataTable', dataTable);
    //                 }
    //             }
    //         } */
    //     } catch(Exception e) {
    //         resultResponse.put('error', e.getMessage());
    //     }
    //     return resultResponse;
    // }
    
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
}