@isTest
public class ReportApiParserTest {
    @isTest
    static void testReportApiParser() {
        String jsonInput = '{"reportMetadata": {"name": "Test Report", "reportType": {"label": "Opportunity", "type": "Opportunity"}, "detailColumns": ["Column1", "Column2"], "standardDateFilter": {"column": "CLOSE_DATE", "durationValue": "THIS_FISCAL_QUARTER"}, "reportBooleanFilter": "1 AND 2", "reportFilters": [{"column": "Amount", "operator": "greaterThan", "value": "1000"}]}}';

        ReportApiParser reportApiParser = ReportApiParser.parse(jsonInput);
        
        System.assertNotEquals(null, reportApiParser, 'Parsed ReportApiParser should not be null');
        System.assertEquals('Test Report', reportApiParser.reportMetadata.name, 'Report name should match');
        System.assertEquals('Opportunity', reportApiParser.reportMetadata.reportType.type, 'Report type should match');
        System.assertEquals(2, reportApiParser.reportMetadata.detailColumns.size(), 'Detail columns size should be 2');
        System.assertEquals('CLOSE_DATE', reportApiParser.reportMetadata.standardDateFilter.column, 'Standard date filter column should match');
        System.assertEquals('THIS_FISCAL_QUARTER', reportApiParser.reportMetadata.standardDateFilter.durationValue, 'Standard date filter duration value should match');
        System.assertEquals(1, reportApiParser.reportMetadata.reportFilters.size(), 'Report filters size should be 1');
    }

    @isTest
    static void testAddStandardFilter() {
        Map<String, String> standardFilter = ReportApiParser.addStandardFilter('Owner', 'User');
        System.assertNotEquals(null, standardFilter, 'Standard filter should not be null');
        System.assertEquals('Owner', standardFilter.get('name'), 'Standard filter name should match');
        System.assertEquals('User', standardFilter.get('value'), 'Standard filter value should match');
    }

    @isTest
    static void testAddFilter() {
        Map<String, String> reportFilter = ReportApiParser.addFilter('StageName', 'equals', 'Closed');
        System.assertNotEquals(null, reportFilter, 'Report filter should not be null');
        System.assertEquals('StageName', reportFilter.get('column'), 'Report filter column should match');
        System.assertEquals('equals', reportFilter.get('operator'), 'Report filter operator should match');
        System.assertEquals('Closed', reportFilter.get('value'), 'Report filter value should match');
    }
}