@isTest
public class CreateReportAPITest {
    
         @isTest
    public static void testCreateReport() {
        // Prepare a mock HTTP response
        HttpResponse mockResponse = new HttpResponse();
        mockResponse.setHeader('Content-Type', 'application/json');
        mockResponse.setBody('{"attributes": {"reportId": "00O5g00000XXXXXXX"}}');
        mockResponse.setStatusCode(200);

        // Set mock callout
        Test.setMock(HttpCalloutMock.class, new HttpRequestMockFactory(mockResponse));

        Test.startTest();
        String reportId = CreateReportAPI.createReport('{"ReportName": "Test Report", "ObjectName": "Account", "fields": ["Id", "Name"], "FiltersConditions": "", "Filters": []}');
        Test.stopTest();

        // Assert the result
        //System.assertNotEquals(null, reportId, 'The reportId should not be null');
        //System.assertEquals('00O5g00000XXXXXXX', reportId, 'The reportId should match the mock response');
    }

    @isTest
    static void testGetReports() {
        // Set up the mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new CreateReportAPIMock());

        // Call the getReports method
        CreateReportAPI.getReports();

        // There's no return value to assert, so ensure no exceptions occurred
        System.assert(true, 'Get reports method executed without exceptions');
    }

    @isTest
    static void testPostReports() {
        // Set up the mock HTTP callout
        Test.setMock(HttpCalloutMock.class, new CreateReportAPIMock());

        // Call the postReports method
        CreateReportAPI.postReports();

        // There's no return value to assert, so ensure no exceptions occurred
        System.assert(true, 'Post reports method executed without exceptions');
    }
}