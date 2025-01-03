public with sharing class APIResponseParser {
    public String sqlQuery;
    public String sqlQueryResult;
    public String answer;
    public FilterValue filterValue;

    public class FilterValue{
        public String ReportName; // reportName
        public String ObjectName; // objectName
        public List<String> Fields; // fields
        public String FiltersConditions; // filtersCondition
        public List<Filter> Filters; // filters
    }

    public class Filter{
        public String Column; // column;
        public String Operator; // operator;
        public String Value; // value;
    }

	/**
	 *	Plarsing Functions
	 */
	public static APIResponseParser parse(String json){
		return (APIResponseParser) System.JSON.deserialize(json, APIResponseParser.class);
	}

	public static String parseToJson(APIResponseParser apiResponseParser){
		return (String) System.JSON.serialize(apiResponseParser);
	}
    
	public static FilterValue parseReportFilter(String json){
		return (FilterValue) System.JSON.deserialize(json, FilterValue.class);
	}

	public static String parseToJson(FilterValue filterValue){
		return (String) System.JSON.serialize(filterValue);
	}

	public static List<Map<String,String>> convertToMap(List<Filter> filterValues){
        List<Map<String,String>> filtersMapsList = new List<Map<String,String>>();
        Map<String,String> filterMap = new Map<String, String>();
        for(Filter filterValue: filterValues){
            filterMap.put('column', filterValue.Column);
            filterMap.put('operator', filterValue.Operator.uncapitalize());
            filterMap.put('value', filterValue.Value);

            filtersMapsList.add(filterMap);
            filterMap = new Map<String, String>();
        }
        System.debug('Filters Map'+filtersMapsList);
		return filtersMapsList;
	}
}