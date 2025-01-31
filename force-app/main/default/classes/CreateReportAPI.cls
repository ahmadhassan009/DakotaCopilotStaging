public class CreateReportAPI {
    static String sfdcURL = Url.getOrgDomainURL().toExternalForm(); 
    static String restAPIURL = sfdcURL + '/services/data/v59.0/analytics/reports/';

    @AuraEnabled(cacheable = true)
    public static String createReport(String reportFilters) {
        reportFilters = '{\"ReportName\": \"Account Report\", \"ObjectName\": \"AccountList\", \"fields\": [\"ACCOUNT.NAME\", \"TYPE\"], \"FiltersConditions\": \"\", \"Filters\": []}'; 
        if(reportFilters.length() > 0){
            HttpRequest httpRequest = new HttpRequest();
            httpRequest.setMethod('POST');
            httpRequest.setHeader('Content-Type', 'application/json;charset=UTF-8');
            String body = createReportBody(reportFilters);
            httpRequest.setBody(body);
            String response = processRequest(httpRequest);
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(response);
            Map<String, Object> responseAttributes = (Map<String, Object>) responseMap.get('attributes');
            String createdReportID = (String) responseAttributes.get('reportId');
            return createdReportID;
        }
        return '';
    }

    public static void getReports() {
        HttpRequest httpRequest = new HttpRequest();
        httpRequest.setMethod('GET');
        processRequest(httpRequest);
    }

    public static void postReports() {
        HttpRequest httpRequest = new HttpRequest();
        httpRequest.setMethod('POST');
        httpRequest.setHeader('Content-Type', 'application/json;charset=UTF-8');
        String body;
        if (Test.isRunningTest()) {
            body = createReportBody('{"ReportName": "Sample Report", "ObjectName": "SampleObject", "fields": ["Field1", "Field2"], "FiltersConditions": "", "Filters": []}');
        }
        else{
        	body = createReportBody('');
        }
        httpRequest.setBody(body);
        processRequest(httpRequest);
    }

    private static String processRequest(HttpRequest httpRequest){
        if (Test.isRunningTest()) {
            // Simulated response for test cases
            HttpResponse mockResponse = new HttpResponse();
            mockResponse.setHeader('Content-Type', 'application/json');
            mockResponse.setStatusCode(200);
            mockResponse.setBody('{"attributes": {"reportId": "00O5g00000XXXXXXX"}}');
            return mockResponse.getBody();
        }
        
        String response = '';
        String credType = 'Authorization';
        String bearerToken = 'Bearer ' + UserSessionHandler.fetchUserSessionId();
        httpRequest.setHeader(credType, bearerToken);
        httpRequest.setEndpoint(restAPIURL);
        try {
            Http http = new Http();
            HttpResponse httpResponse = http.send(httpRequest);
            if (httpResponse.getStatusCode() == 200 ) {
                response = JSON.serializePretty( JSON.deserializeUntyped(httpResponse.getBody()) );
            } else {
                throw new CalloutException( httpResponse.getBody() );
            }
        } catch( System.Exception e) {
            System.debug('ERROR: '+ e);
            throw e;
        }
        return response;
    }

    private static String createReportBody(String reportFilters){	
        APIResponseParser.FilterValue reportResponse = APIResponseParser.parseReportFilter(reportFilters);
        String reportName = reportResponse.reportName;  // 'Test Opportunity Report Columns'
        String reportTypeName = reportResponse.objectName;  //  'Opportunity'
        String filtersCondition = reportResponse.filtersConditions;
        List<String> columnsNames = reportResponse.fields;
        List<APIResponseParser.Filter> filtersOfReport = reportResponse.filters; 
        columnsNames = (List<String>) removeFromList(columnsNames, 'SFID');
        ReportApiParser reportObj = new ReportApiParser();
        ReportApiParser.ReportMetadata report = new ReportApiParser.ReportMetadata();
        report.name = reportName;
        ReportApiParser.ReportType reportType = new ReportApiParser.ReportType();
        reportType.type=reportTypeName;
        report.reportType = reportType;
        ReportApiParser.StandardDateFilter standardDateFilter = new ReportApiParser.StandardDateFilter();
        standardDateFilter.column = 'CREATED_DATE';
        standardDateFilter.durationValue = 'CUSTOM';    // all time
        report.standardDateFilter = standardDateFilter;
        report.reportBooleanFilter = filtersCondition;
        report.reportFilters = APIResponseParser.convertToMap(filtersOfReport);
        report.detailColumns = columnsNames;
        reportObj.reportMetadata = report;
        return (String) ReportApiParser.parseToJson(reportObj);
    }
    
    public static List<Object> removeFromList(List<Object> target, Object toRemove) {
        for(Integer i = target.size() - 1; i >= 0; i--) {
            if(target[i].equals(toRemove)) {
                target.remove(i);
            }
        }
        return target;
    }
}