@isTest
public class APIResponseParserTest {
    @isTest
    static void testAPIResponseParser() {
        // Test data setup
        String sampleJson = '{'+
            '"sqlQuery":"SELECT * FROM Account",'+
            '"sqlQueryResult":"Result data",'+
            '"answer":"Query executed successfully",'+
            '"filterValue":{'+
                '"ReportName":"Sample Report",'+
                '"ObjectName":"Account",'+
                '"Fields":["Name","Industry","AnnualRevenue"],'+
                '"FiltersConditions":"AND",'+
                '"Filters":['+
                    '{"Column":"Industry","Operator":"=","Value":"Technology"},'+
                    '{"Column":"AnnualRevenue","Operator":">","Value":"1000000"}'+
                ']'+
            '}'+
        '}';

        // Test parse method
        APIResponseParser parsedResponse = APIResponseParser.parse(sampleJson);
        System.assertNotEquals(null, parsedResponse, 'Parsed response should not be null.');
        System.assertEquals('SELECT * FROM Account', parsedResponse.sqlQuery, 'SQL query should match.');
        System.assertEquals('Query executed successfully', parsedResponse.answer, 'Answer should match.');
        System.assertNotEquals(null, parsedResponse.filterValue, 'FilterValue should not be null.');
        System.assertEquals('Sample Report', parsedResponse.filterValue.ReportName, 'Report name should match.');
        System.assertEquals(2, parsedResponse.filterValue.Filters.size(), 'Filter list size should match.');

        // Test parseToJson method
        String serializedJson = APIResponseParser.parseToJson(parsedResponse);
        System.assertNotEquals(null, serializedJson, 'Serialized JSON should not be null.');
        System.assert(serializedJson.contains('SELECT * FROM Account'), 'Serialized JSON should contain the SQL query.');

        // Test parseReportFilter
        String filterJson = '{'+
            '"ReportName":"Sample Report",'+
            '"ObjectName":"Account",'+
            '"Fields":["Name","Industry","AnnualRevenue"],'+
            '"FiltersConditions":"AND",'+
            '"Filters":['+
                '{"Column":"Industry","Operator":"=","Value":"Technology"},'+
                '{"Column":"AnnualRevenue","Operator":">","Value":"1000000"}'+
            ']'+
        '}';
        APIResponseParser.FilterValue filterValue = APIResponseParser.parseReportFilter(filterJson);
        System.assertNotEquals(null, filterValue, 'Parsed filter value should not be null.');
        System.assertEquals('Sample Report', filterValue.ReportName, 'Filter report name should match.');
        System.assertEquals(2, filterValue.Filters.size(), 'Number of filters should match.');

        // Test convertToMap
        List<APIResponseParser.Filter> filters = new List<APIResponseParser.Filter>();
        APIResponseParser.Filter filter1 = new APIResponseParser.Filter();
        filter1.Column = 'Industry';
        filter1.Operator = '=';
        filter1.Value = 'Technology';

        APIResponseParser.Filter filter2 = new APIResponseParser.Filter();
        filter2.Column = 'AnnualRevenue';
        filter2.Operator = '>';
        filter2.Value = '1000000';

        filters.add(filter1);
        filters.add(filter2);

        List<Map<String, String>> filtersMap = APIResponseParser.convertToMap(filters);
        System.assertEquals(2, filtersMap.size(), 'Filters map size should match.');
        System.assertEquals('Industry', filtersMap[0].get('column'), 'First filter column should match.');
        System.assertEquals('technology', filtersMap[0].get('value').toLowerCase(), 'First filter value should match.');
    }
}