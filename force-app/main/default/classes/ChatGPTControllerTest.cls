@isTest
public class ChatGPTControllerTest {

    @testSetup
    static void setupData() {
        // Setup data if needed
    }

    // Test successful response from the external server
    @isTest
    static void testProcessQuerySuccess() {
        // Create mock response
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setBody('{"flag": 1, "SQL_Query_Result": {}, "SQL_Query_Columns": {}}');
        mockResponse.setStatusCode(200);

        // Set mock response in the test environment
        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);

        // Call the method being tested
        Test.startTest();
        Map<String, Object> result = ChatGPTController.processQuery('SELECT * FROM Account', '', 'Prompt Request');
        Test.stopTest();

        // Validate the response
        System.assertEquals(1, result.get('flag'), 'Flag should be 1');
    }

    // Test empty body response
    @isTest
    static void testProcessQueryEmptyResponse() {
        // Create mock response with empty body
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setBody('');
        mockResponse.setStatusCode(200);

        // Set mock response in the test environment
        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);

        // Call the method being tested
        Test.startTest();
        Map<String, Object> result = ChatGPTController.processQuery('SELECT * FROM Account', '', 'Prompt Request');
        Test.stopTest();

        // Validate the response
        System.assert(result.containsKey('error'), 'Error key should be present');
        System.assertEquals('The answer is missing or empty. Could you please rephrase your question?', result.get('error'));
    }
    
    @isTest
    static void testGetObjectAndName() {
        // Scenario 1: objAndField contains a dot and 'as' for alias
        List<String> result = ChatGPTController.getObjectAndName('Account', 'Account.Name as accName');
        System.assertEquals(3, result.size(), 'Expected 3 elements in result');
        System.assertEquals('Account', result[0], 'The object name should be "Account"');
        System.assertEquals('name', result[1], 'The field name should be "Name"');
        System.assertEquals('Accname', result[2], 'The alias should be "Accname"');

        // Scenario 2: objAndField contains a dot but no alias
        result = ChatGPTController.getObjectAndName('Contact', 'Contact.Email');
        System.assertEquals(2, result.size(), 'Expected 2 elements in result');
        System.assertEquals('Contact', result[0], 'The object name should be "Contact"');
        System.assertEquals('Email', result[1], 'The field name should be "Email"');

        // Scenario 3: objAndField without dot
        result = ChatGPTController.getObjectAndName('Account', 'Phone');
        System.assertEquals(2, result.size(), 'Expected 2 elements in result');
        System.assertEquals('Account', result[0], 'The object name should be "Account"');
        System.assertEquals('Phone', result[1], 'The field name should be "Phone"');

        // Scenario 4: objAndField with alias but no dot
        result = ChatGPTController.getObjectAndName('Opportunity', 'StageName as stage');
        System.assertEquals(2, result.size(), 'Expected 2 elements in result');
        System.assertEquals('Opportunity', result[0], 'The object name should be "Opportunity"');
        System.assertEquals('StageName as stage', result[1], 'The field name should be "Stagename"');

        // Scenario 5: Mixed case 'AS' keyword
        result = ChatGPTController.getObjectAndName('Lead', 'Lead.Status AS leadStatus');
        System.assertEquals(3, result.size(), 'Expected 3 elements in result');
        System.assertEquals('Lead', result[0], 'The object name should be "Lead"');
        System.assertEquals('status', result[1], 'The field name should be "Status"');
        System.assertEquals('Leadstatus', result[2], 'The alias should be "Leadstatus"');
    }
    
     @isTest
    static void testGetFieldsMetadata() {
        // Scenario 1: Valid object and field
        List<String> result = ChatGPTController.getFieldsMetadata('Account', 'Name');
        System.assertEquals(2, result.size(), 'Expected 2 elements in result');
        System.assertEquals('Account Name', result[0], 'The label for the Account Name field should be "Account Name"');
        System.assertEquals('string', result[1], 'The data type for the Account Name field should be "string"');

        // Scenario 2: Valid object, non-existent field
        result = ChatGPTController.getFieldsMetadata('Account', 'NonExistentField');
        System.assertEquals(2, result.size(), 'Expected 2 elements in result');
        System.assertEquals('NonExistentField', result[0], 'The label for a non-existent field should default to the field name capitalized');
        System.assertEquals(null, result[1], 'The data type for a non-existent field should be null');

        // Scenario 3: Non-existent object
        result = ChatGPTController.getFieldsMetadata('NonExistentObject', 'Name');
        System.assertEquals(2, result.size(), 'Expected 2 elements in result');
        System.assertEquals('Name', result[0], 'For a non-existent object, the label should be the field name');
        System.assertEquals(null, result[1], 'For a non-existent object, the data type should be null');
    }
    
    @isTest
    static void testGenerateColumnDefination() {
        // Scenario: Generate column definition for a valid label
        String label = 'TestField';
        
        // Call the method
        Map<String, Object> result = ChatGPTController.generateColumnDefination(label);

        // Validate the result
        System.assert(result != null, 'The result should not be null.');
        System.assert(result.containsKey('fieldName'), 'The result should contain the fieldName key.');
        System.assert(result.containsKey('label'), 'The result should contain the label key.');
        System.assert(result.containsKey('sortable'), 'The result should contain the sortable key.');

        // Check that the values are as expected
        System.assertEquals(label, result.get('fieldName'), 'The fieldName should match the provided label.');
        System.assertEquals(label, result.get('label'), 'The label should match the provided label.');
        System.assertEquals(true, result.get('sortable'), 'The sortable value should be true.');
    }
    
    @isTest
    static void testGenerateColumnsList() {
        // Scenario: Generating columns for a mock object and record data

        // Mock object name
        String objectName = 'Account';

        // Mock record data - simulating an Account object with different field keys and values
        Map<String, Object> mockRecord = new Map<String, Object>{
            'Name' => 'Test Account',
            'BillingCity' => 'San Francisco',
            'AnnualRevenue' => 1000000,
            'sfid' => '001XXXXXXXXXXXXXXX'
        };

        // Call the method
        List<Object> result = ChatGPTController.generateColumnsList(objectName, mockRecord);

        // Validate that result contains two lists - one for columns and one for keysLabels
        System.assert(result != null, 'The result should not be null.');
        System.assert(result.size() == 2, 'The result should contain two lists.');

        // Validate the columns generated
        List<Map<String, Object>> columns = (List<Map<String, Object>>) result[0];
        System.assert(columns.size() == 3, 'There should be 3 columns generated (sfid column is skipped).');

        // Validate that the column definitions contain the expected fields
        Map<String, Object> nameColumn = columns[0];
        System.assert(nameColumn.get('fieldName') == 'Account Name', 'The fieldName should be "Name".');
        System.assert(nameColumn.get('label') == 'Account Name', 'The label should be "Name".');
        System.assert(nameColumn.get('sortable') == true, 'The sortable should be true.');

        Map<String, Object> billingCityColumn = columns[1];
        System.assert(billingCityColumn.get('fieldName') == 'Billing City', 'The fieldName should be "BillingCity".');
        System.assert(billingCityColumn.get('label') == 'Billing City', 'The label should be "Billing City".');

        Map<String, Object> revenueColumn = columns[2];
        System.assert(revenueColumn.get('fieldName') == 'Annual Revenue', 'The fieldName should be "AnnualRevenue".');
        System.assert(revenueColumn.get('label') == 'Annual Revenue', 'The label should be "Annual Revenue".');
        System.assert(revenueColumn.get('type') == 'currency', 'The AnnualRevenue field should be of type currency.');

        // Validate the dataTableKeys generated
        Map<String, String> keysLabels = (Map<String, String>) result[1];
        System.assert(keysLabels.get('Name') == 'Account Name', 'The key "Name" should map to label "Name".');
        System.assert(keysLabels.get('BillingCity') == 'Billing City', 'The key "BillingCity" should map to label "Billing City".');
        System.assert(keysLabels.get('AnnualRevenue') == 'Annual Revenue', 'The key "AnnualRevenue" should map to label "Annual Revenue".');
    }
    
     @isTest
    static void testGenerateDataTable() {
        // Mock records (as List<Object>)
        List<Object> mockRecords = new List<Object>();
        
        // Mock Record 1 - Account object fields
        Map<String, Object> record1 = new Map<String, Object>{
            'sfid' => '001XXXXXXXXXXXXXXX',
            'Name' => 'Test Account 1',
            'BillingCity' => 'San Francisco',
            'AnnualRevenue' => 5000000
        };
        mockRecords.add(record1);
        
        // Mock Record 2 - Account object fields
        Map<String, Object> record2 = new Map<String, Object>{
            'sfid' => '001XXXXXXXXXXXXXXY',
            'Name' => 'Test Account 2',
            'BillingCity' => 'Los Angeles',
            'AnnualRevenue' => 10000000
        };
        mockRecords.add(record2);
        
        // Mock keysLabels (mapping field keys to display labels)
        Map<String, String> mockKeysLabels = new Map<String, String>{
            'sfid' => 'sfidLink',
            'Name' => 'Account Name',
            'BillingCity' => 'City',
            'AnnualRevenue' => 'Revenue'
        };
        
        // Call the method
        List<Map<String, Object>> dataTable = ChatGPTController.generateDataTable(mockRecords, mockKeysLabels);
        
        // Assertions
        System.assert(dataTable != null, 'DataTable should not be null.');
        System.assertEquals(2, dataTable.size(), 'DataTable should have 2 rows.');

        // Validate first record (row 1)
        Map<String, Object> firstRow = dataTable[0];
        System.assertEquals('001XXXXXXXXXXXXXXX', firstRow.get('sfidLink'), 'The sfidLink should be generated correctly for record 1.');
        System.assertEquals('Test Account 1', firstRow.get('Account Name'), 'The Account Name should be "Test Account 1".');
        System.assertEquals('San Francisco', firstRow.get('City'), 'The City should be "San Francisco".');
        System.assertEquals(5000000, firstRow.get('Revenue'), 'The Revenue should be 5000000.');

        // Validate second record (row 2)
        Map<String, Object> secondRow = dataTable[1];
        System.assertEquals('001XXXXXXXXXXXXXXY', secondRow.get('sfidLink'), 'The sfidLink should be generated correctly for record 2.');
        System.assertEquals('Test Account 2', secondRow.get('Account Name'), 'The Account Name should be "Test Account 2".');
        System.assertEquals('Los Angeles', secondRow.get('City'), 'The City should be "Los Angeles".');
        System.assertEquals(10000000, secondRow.get('Revenue'), 'The Revenue should be 10000000.');
    }
    
 	@isTest
    static void testHandleServerResponse() {
        // Test handleServerResponse method
        Map<String, Object> mockDataMap = new Map<String, Object> {
            'flag' => 1,
            'SQL_Query_Result' => '{"Id":"001XXXXXXXXXXXXXXX","Name":"Test Account"}',
            'SQL_Query_Columns' => '{"Name":"Account Name","Id":"Account ID"}'
        };
            
        /*HttpResponse mockResponse = new HttpResponse();
        mockResponse.setBody('{"flag": 1, "SQL_Query_Result": {}, "SQL_Query_Columns": {}}');
        mockResponse.setStatusCode(200);

        // Set mock response in the test environment
        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);*/
            
            
        String jsonData = JSON.serialize(mockDataMap);
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setBody(jsonData);
        mockResponse.setStatusCode(200);
        
        // Set mock response in the test environment
        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);
        HttpResponse resultResponse = ChatGPTController.sendQueryToServer(jsonData, '', 'Prompt Request');
        System.assert(resultResponse != null, 'Response should not be null.');
        System.assertEquals(200, resultResponse.getStatusCode(), 'Status code should be 200.');
    }

}