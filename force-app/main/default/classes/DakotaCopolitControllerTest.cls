@isTest
public class DakotaCopolitControllerTest {

    @testSetup
    static void setupData() {
        // Setup data if needed
    }

    // Test successful response from the external server
    @isTest
    static void testProcessQuerySuccess() {
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setBody('{"flag": 1, "SQL_Query_Result": {}, "SQL_Query_Columns": {}}');
        mockResponse.setStatusCode(200);

        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);

        Test.startTest();
        Map<String, Object> result = DakotaCopolitController.processQuery('SELECT * FROM Account', '', 'Prompt Request');
        Test.stopTest();

        System.assertEquals(1, result.get('flag'), 'Flag should be 1');
    }

    // Test empty body response
    @isTest
    static void testProcessQueryEmptyResponse() {
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setBody('');
        mockResponse.setStatusCode(200);

        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);

        Test.startTest();
        Map<String, Object> result = DakotaCopolitController.processQuery('10 Accounts', '', 'Prompt Request');
        Test.stopTest();

        System.assert(result.containsKey('error'), 'Error key should be present');
        System.assertEquals('The server response was empty. Please check your query and try again.', result.get('error'));
    }

    // Test HTTP error response
    @isTest
    static void testProcessQueryHttpError() {
        // Create a mock response with a non-200 status code
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setStatusCode(500); // Simulate an HTTP error
        mockResponse.setBody('Internal Server Error');

        // Set the mock response in the test environment
        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);

        // Call the method being tested
        Test.startTest();
        Map<String, Object> result = DakotaCopolitController.processQuery('SELECT * FROM Account', '', 'Prompt Request');
        Test.stopTest();

        // Assert the presence of the 'flag' key in case of an error
        System.assert(result.containsKey('flag'), 'Flag key should be present for non-200 HTTP responses.');

        // Assert the presence of the 'answer' key and validate the error message
        System.assert(result.containsKey('answer'), 'Answer key should be present for non-200 HTTP responses.');
        System.assertEquals(
            'Oops! We’re having trouble reaching the server.',
            result.get('answer'),
            'Unexpected error message returned for non-200 HTTP response.'
        );
    }

    @isTest
    static void testProcessQueryInvalidJson() {
        // Create a mock response with invalid JSON (missing a closing brace)
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setBody('{"invalid": "json"');  // Invalid JSON (missing closing brace)
        mockResponse.setStatusCode(200);

        // Set the mock response in the test environment
        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);

        // Call the method being tested
        Test.startTest();
        
        // Expect a JSONException to be thrown
        try {
            Map<String, Object> result = DakotaCopolitController.processQuery('Invalid JSON Response', '', 'Prompt Request');
            // Fail the test if no exception is thrown
            System.assert(false, 'Expected JSONException but none was thrown.');
        } catch (System.JSONException e) {
            // Assert the exception message to check the expected error
            System.assert(e.getMessage().contains('Unexpected end-of-input'), 'Unexpected JSONException message.');
        }
        
        Test.stopTest();
    }



    @isTest
    static void testGetFieldsMetadata() {
        List<String> result = DakotaCopolitController.getFieldsMetadata('Account', 'Name');
        System.assertEquals(2, result.size(), 'Expected 2 elements in result');
        System.assertEquals('Account Name', result[0], 'The label for the Account Name field should be "Account Name"');
        System.assertEquals('string', result[1], 'The data type for the Account Name field should be "string"');
    }

    @isTest
    static void testGenerateColumnDefinition() {
        String label = 'TestField';
        Map<String, Object> result = DakotaCopolitController.generateColumnDefination(label);

        System.assert(result != null, 'The result should not be null.');
        System.assert(result.containsKey('fieldName'), 'The result should contain the fieldName key.');
        System.assert(result.containsKey('label'), 'The result should contain the label key.');
        System.assert(result.containsKey('sortable'), 'The result should contain the sortable key.');

        System.assertEquals(label, result.get('fieldName'), 'The fieldName should match the provided label.');
        System.assertEquals(label, result.get('label'), 'The label should match the provided label.');
        System.assertEquals(true, result.get('sortable'), 'The sortable value should be true.');
    }

    @isTest
    static void testGenerateColumnsList() {
        String objectName = 'Account';
        Map<String, Object> mockRecord = new Map<String, Object>{
            'Name' => 'Test Account',
            'BillingCity' => 'San Francisco',
            'AnnualRevenue' => 1000000,
            'sfid' => '001XXXXXXXXXXXXXXX'
        };

        List<Object> result = DakotaCopolitController.generateColumnsList(objectName, mockRecord);
        System.assertEquals(2, result.size(), 'Result should contain two lists.');
    }

    @isTest
    static void testGenerateDataTable() {
        List<Object> mockRecords = new List<Object>();
        Map<String, Object> record1 = new Map<String, Object> {
            'sfid' => '001XXXXXXXXXXXXXXX',
            'Name' => 'Test Account 1',
            'BillingCity' => 'San Francisco',
            'AnnualRevenue' => 5000000
        };
        mockRecords.add(record1);

        Map<String, String> mockKeysLabels = new Map<String, String> {
            'sfid' => 'sfidLink',
            'Name' => 'Account Name',
            'BillingCity' => 'City',
            'AnnualRevenue' => 'Revenue'
        };

        List<Map<String, Object>> dataTable = DakotaCopolitController.generateDataTable(mockRecords, mockKeysLabels);
        System.assertEquals(1, dataTable.size(), 'DataTable should have one row.');
        System.assertEquals('Test Account 1', dataTable[0].get('Account Name'), 'Account Name should match.');
    }
    
    @isTest 
    public static void testGetObjectAndName() {
        // Test case 1: Simple object and field (without dot notation)
        List<String> result = DakotaCopolitController.getObjectAndName('Account', 'Name');
        System.assertEquals(2, result.size(), 'The result should contain 2 elements.');
        System.assertEquals('Account', result[0], 'The object name should be "Account".');
        System.assert(result[1].toLowerCase() == 'name', 'The field name should be "name" (case insensitive).');

        // Test case 2: Object and field with dot notation (no alias)
        result = DakotaCopolitController.getObjectAndName('Account', 'Account.Name');
        System.assertEquals(2, result.size(), 'The result should contain 2 elements.');
        System.assertEquals('Account', result[0], 'The object name should be "Account".');
        System.assert(result[1].toLowerCase() == 'name', 'The field name should be "name" (case insensitive).');

        // Test case 3: Object and field with dot notation and alias
        result = DakotaCopolitController.getObjectAndName('Account', 'Account.Name as AccountName');
        System.assertEquals(3, result.size(), 'The result should contain 3 elements.');
        System.assertEquals('Account', result[0], 'The object name should be "Account".');
        System.assert(result[1].toLowerCase() == 'name', 'The field name should be "name" (case insensitive).');
        // Ignore alias casing for comparison
        System.assert(result[2].toLowerCase() == 'accountname', 'The alias name should match "accountname" (case insensitive).');

        // Test case 4: Object and field with alias in mixed case
        result = DakotaCopolitController.getObjectAndName('Account', 'Account.Name as accountName');
        System.assertEquals(3, result.size(), 'The result should contain 3 elements.');
        System.assertEquals('Account', result[0], 'The object name should be "Account".');
        System.assert(result[1].toLowerCase() == 'name', 'The field name should be "name" (case insensitive).');
        // Ignore alias casing for comparison
        System.assert(result[2].toLowerCase() == 'accountname', 'The alias name should match "accountname" (case insensitive).');
    }
    
    
    @isTest
    public static void testProcessQueryAllRecords() {
        // Mock the sendQueryToServer method to simulate a response
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setBody('{"flag": 1, "SQL_Query_Result": {}, "SQL_Query_Columns": {}}');
        mockResponse.setStatusCode(200);

        // Mock response generator
        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);

        // Define the input parameters for the method
        String query = 'SELECT * FROM Account';
        String requestType = 'Prompt Request';
        Integer recordLimit = 10;
        Integer offset = 0;
        Map<String, Object> orderBy = new Map<String, Object>{'Name' => 'ASC'};
        List<Object> filter = new List<Object>{'field1', 'field2'};

        Test.startTest();

        // Call the processQueryAllRecords method with the required parameters
        Map<String, Object> result = DakotaCopolitController.processQueryAllRecords(
            query, requestType, recordLimit, offset, orderBy, filter
        );

        Test.stopTest();

        // Assertions to validate the mock response
        System.assertEquals(1, result.get('flag'), 'Flag should be 1');
    }
     @isTest
    public static void testProcessQueryAllRecordsVAD() {

        // Mock the sendQueryToServer method to simulate a response
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setBody('{"flag": 1, "SQL_Query_Result": {}, "SQL_Query_Columns": {}}');
        mockResponse.setStatusCode(200);

        // Mock response generator
        HttpRequestMockFactory mock = new HttpRequestMockFactory(mockResponse);
        Test.setMock(HttpCalloutMock.class, mock);

        // Define the input parameters for the method
        String query = 'SELECT * FROM Account';
        String threadId = 'thread123'; // You can change this value based on your test needs
        String requestType = 'View All Data';
        Integer recordLimit = 10;
        Integer offset = 0;
        Map<String, Object> orderBy = new Map<String, Object>{'Name' => 'ASC'};
        List<Object> filter = new List<Object>{'field1', 'field2'};

        Test.startTest();

        // Call the processQueryAllRecords method with the required parameters
        Map<String, Object> result = DakotaCopolitController.processQueryAllRecords(
            query, requestType, recordLimit, offset, orderBy, filter
        );

        Test.stopTest();

        // Assertions to validate the mock response
        System.assertEquals(1, result.get('flag'), 'Flag should be 1');
    }
    
    @isTest
    static void testIsDakotaCopilotAccessibleForUser() {
        // Step 1: Create a test user
        User testUser = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuser@example.com',
            Username = 'testuser@example.com' + System.currentTimeMillis(),
            Alias = 'tuser',
            ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id,
            TimeZoneSidKey = 'America/New_York',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            Enable_Dakota_Copilot__c = true // Ensure this matches your custom field
        );
        insert testUser;

        // Step 2: Run the method as the test user
        Test.startTest();
        System.runAs(testUser) {
            Boolean isAccessible = DakotaCopolitController.isDakotaCopilotAccessibleForUser();
            System.assertEquals(true, isAccessible, 'The user should have Dakota Copilot access.');
        }
        Test.stopTest();
    }

    // Mock HTTP response generator class
    public class HttpRequestMockFactory implements HttpCalloutMock {
        private HttpResponse mockResponse;

        public HttpRequestMockFactory(HttpResponse response) {
            this.mockResponse = response;
        }

        public HttpResponse respond(HttpRequest req) {
            return mockResponse;
        }
    }
    
    

}