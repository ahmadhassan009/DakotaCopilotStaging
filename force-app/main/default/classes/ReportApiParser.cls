// we need both "ReportApiParserTest and CreateReportAPITest" test classes to complete the coverage of this class
public with sharing class ReportApiParser {
    public ReportMetadata reportMetadata;

    public class ReportMetadata {
        public String name;
        public ReportType reportType;
        public List<String> detailColumns;
        public StandardDateFilter standardDateFilter;
        public List<Map<String, String>> standardFilters;
        public String reportBooleanFilter;
        public List<Map<String, String>> reportFilters;
    }

    public class ReportType {
        public String label;
        public String type;
    }

    public class StandardDateFilter {
        public String column; // CLOSE_DATE
        public String durationValue; // THIS_FISCAL_QUARTER
        public String endDate; // 2016-12-31
        public String startDate; // 2016-10-01
    }

    // Utility Functions
    public static Map<String, String> addStandardFilter(String name, String value) {
        return new Map<String, String>{'name' => name, 'value' => value};
    }

    public static Map<String, String> addFilter(String column, String operator, String value) {
        return new Map<String, String>{'column' => column, 'operator' => operator, 'value' => value};
    }

    // Parsing Functions
    public static ReportApiParser parse(String json) {
        return (ReportApiParser) System.JSON.deserialize(json, ReportApiParser.class);
    }

    public static String parseToJson(ReportApiParser reportApiParser) {
        return System.JSON.serialize(reportApiParser);
    }
}