public class CreateReportAPI {
    static String sfdcURL = Url.getOrgDomainURL().toExternalForm(); 
    static String restAPIURL = sfdcURL + '/services/data/v59.0/analytics/reports/';

    @AuraEnabled(cacheable = true)
    public static String createReport(String reportFilters) {
        System.debug(reportFilters);
        //  reportFilters = '{"ReportName": "Opportunity Report", "ObjectName": "Opportunity", "Fields": ["SFID", "Name", "StageName", "Amount", "CloseDate"], "FiltersConditions": "1 OR 2", "Filters": [{"Column": "Amount", "Operator": "greaterThan", "Value": 500}, {"Column": "Stage_Name", "Operator": "notEqual", "Value": "Open, Staging, Review."}]}';
        // reportFilters = '{"ReportName": "Opportunity Report", "ObjectName": "Opportunity", "Fields": ["SFID", "OPPORTUNITY_NAME", "STAGE_NAME", "AMOUNT", "CLOSE_DATE"], "Filters": [{"Column": "AMOUNT", "Operator": "greaterThan", "Value": 500}]}';
        
        // reportFilters = '{"ReportName\": \"Account Report\",\n\"ObjectName\": \"AccountList\",\n\"Fields\": [\"Account_Name\", \"Account_Type\", \"Website\", \"Phone_Number\", \"City\", \"State\", \"Country\"],\n\"FiltersConditions\": \"\",\n\"Filters\": []}';
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
                System.debug(' httpResponse ' + httpResponse.getBody() );
                throw new CalloutException( httpResponse.getBody() );
            }
        } catch( System.Exception e) {
            System.debug('ERROR: '+ e);
            throw e;
        }
        //  System.debug(' ** response ** : ' + response );
        return response;
    }

    private static String createReportBody(String reportFilters){
        System.debug(reportFilters);    // parse this String into Apex classes
		
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

        // only for Opportunities
        /* List<Map<String,String>> standardFilters = new List<Map<String,String>>();
        standardFilters.add(ReportApiParser.addStandardFilter('open','all'));
        report.standardFilters = standardFilters; */

        report.reportBooleanFilter = filtersCondition;
        report.reportFilters = APIResponseParser.convertToMap(filtersOfReport);
        report.detailColumns = columnsNames;

        System.debug(report);

        /* List<Map<String,String>> filters = new List<Map<String,String>>();
        filters.add(ReportApiParser.addFilter('OWNER_TITLE','notEqual', 'Rose Hillman'));
        filters.add(ReportApiParser.addFilter('TYPE','equals', ',Existing Customer - Downgrade,Existing Customer - Replacement,Existing Customer - Upgrade,New Customer'));
        report.reportFilters = filters;

        List<String> columns = new List<String>();
        columns.add('OPPORTUNITY_NAME');
        columns.add('FISCAL_QUARTER');
        columns.add('AMOUNT');
        columns.add('CLOSE_DATE');
        columns.add('TYPE');
        report.detailColumns = columns; */

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