public class DakotaContentController {
    private static String baseUrl = URL.getSalesforceBaseUrl().toExternalForm()+'/';
    
    private static final Map<String, String> ACCOUNT_PICKLIST_SEARCH = new Map<String, String>{
        'private equity' => 'Private_Equity__c', 
            'private credit' => 'Private_Credit__c',
            'hedge funds' => 'Hedge_Funds__c',
            'liquid alternatives' => 'Liquid_Alternatives__c',
            'private real estate' => 'Private_Real_Estate__c',
            'real assets' => 'Real_Assets__c'
            };          
                
            public class DakotaContentSearchFilter{
                @AuraEnabled
                public String label {get; set;}
                @AuraEnabled
                public String name {get; set;}
            }
    
    
    @AuraEnabled(cacheable=true)
    public static DakotaContentWrapper fetchFilteredRecords(String searchFilters, String recordLimit, String offset, String sortBy, String sortOrder)
    {  
        String countQuery = 'Select count(Id) from Dakota_Content__c';      
        String baseQuery = 'Select Id, Name, Type__c, Date__c,Dakota_Live_Call__c,RecordTypeId,Video_links_to_Dakota_Content_Lines__c,Dakota_Live_Call__r.Presentation_Recording_url__c,'+
            'Dakota_Live_Call__r.Name,Presentation_Recording_url__c,(Select Name,Type__c,Dakota_Live_Call__r.name,Video_links_to_Dakota_Content_Lines__c,Presentation_Recording_url__c from Dakota_Content__r) From Dakota_Content__c ';
        
        List<String> filters = new List<String>();
        List<String> whereConditions = new List<String>();
        List<String> dropdownFilters = new List<String>();
        AggregateResult countResults;
        List<Dakota_Content__c> dakotaContentsQueryResults = new List<Dakota_Content__c> ();
        List<DakotaContentSearchFilter> dakotaContentSearchFilters = (List<DakotaContentSearchFilter>) JSON.deserialize(searchFilters, List<DakotaContentSearchFilter>.class); 
        Id parentRecordTypeId = Schema.getGlobalDescribe().get('Dakota_Content__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Content').getRecordTypeId();
        Id childRecordTypeId = Schema.getGlobalDescribe().get('Dakota_Content__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Content_Lines').getRecordTypeId();
        
        if(dakotaContentSearchFilters != null && dakotaContentSearchFilters.size() > 0)
        {
            for(DakotaContentSearchFilter searchFilter:dakotaContentSearchFilters)
            {
                if(ACCOUNT_PICKLIST_SEARCH.containsKey(searchFilter.label.toLowerCase())){
                    dropdownFilters.add('Account_Linked__r.' + ACCOUNT_PICKLIST_SEARCH.get(searchFilter.label.toLowerCase()) + ' = \'Yes\'');
                } else {
                    filters.add('%'+searchFilter.label+'%');                    
                }
            }
            if(filters.size() > 0) {
                whereConditions.add('Account_Linked__r.name LIKE :filters');
                whereConditions.add('Account_Linked__r.type LIKE :filters');
                whereConditions.add('Account_Linked__r.MetroArea__r.Name LIKE :filters');
                whereConditions.add('Contact_Linked__r.Name LIKE :filters');
                whereConditions.add('Contact_Linked__r.Contact_Type__c LIKE :filters');
                whereConditions.add('Contact_Linked__r.Title LIKE :filters');
                whereConditions.add('Contact_Linked__r.Account.Name LIKE :filters');
                whereConditions.add('Contact_Linked__r.Account.Type LIKE :filters');
                whereConditions.add('Type__c LIKE :filters');
                whereConditions.add('Metro_Area_Linked__r.Name LIKE :filters');
                whereConditions.add('Name LIKE :filters');
            }
            if(whereConditions.size()>0)
            {
                baseQuery += ' Where '+String.join(whereConditions, ' Or ');
                countQuery += ' Where '+String.join(whereConditions, ' Or ');
            }
            if(dropdownFilters.size() > 0) {
                baseQuery += whereConditions.size() > 0 ?  ' Or '+String.join(dropdownFilters, ' Or ') : ' Where '+String.join(dropdownFilters, ' Or ');
                countQuery += whereConditions.size() > 0 ?  ' Or '+String.join(dropdownFilters, ' Or ') : ' Where '+String.join(dropdownFilters, ' Or ');
            }
            baseQuery += ' Order by '+sortBy+' '+sortOrder+  ' NULLS LAST Limit '+recordLimit+' Offset '+offset;
            countResults = Database.query(countQuery);   
            dakotaContentsQueryResults = Database.query(baseQuery);
            if(dakotaContentsQueryResults.size() > 0)
            {
                List<DakotaContentRecords> finalDakotaContentsToReturn = prepareSearchedDakotaContentData(dakotaContentsQueryResults,parentRecordTypeId,childRecordTypeId);
                return new DakotaContentWrapper((Integer)countResults.get('expr0'), finalDakotaContentsToReturn);    
            }
        }
        else 
        {
            List<Restricted_Dakota_Content_Types__c> excludedDakotaContentTypes = Restricted_Dakota_Content_Types__c.getall().values();
            List<String> excludedTypes = new List<String>();
            for(Restricted_Dakota_Content_Types__c dcTypes:excludedDakotaContentTypes)
            {
                excludedTypes.add(dcTypes.Name);
            }
            
            String dakotaContentQuery = baseQuery+' Where (RecordTypeId = :parentRecordTypeId) And (Type__c Not In :excludedTypes) Order by '+sortBy+' '+sortOrder+  ' NULLS LAST Limit '+recordLimit+' Offset '+offset;
            countQuery += ' Where RecordTypeId = :parentRecordTypeId And Type__c Not In :excludedTypes';
            dakotaContentsQueryResults = Database.query(dakotaContentQuery);

            if(dakotaContentsQueryResults.size()>0)
            {
                List<DakotaContentRecords> finalDakotaContentsToReturn = new List<DakotaContentRecords>();
                for(Dakota_Content__c dc : dakotaContentsQueryResults)
                {
                    finalDakotaContentsToReturn.add(createParentDakotaContentWrapper(dc,false));                  
                }
                countResults = Database.query(countQuery);
                return new DakotaContentWrapper((Integer)countResults.get('expr0'), finalDakotaContentsToReturn); 
            }
        }
        return null;
    }
    
    public static List<DakotaContentRecords> prepareSearchedDakotaContentData(List<Dakota_Content__c> dakotaContentsQueryResults,Id parentRecordTypeId,Id childRecordTypeId)
    {
        List<DakotaContentRecords> finalDakotaContentsToReturn = new List<DakotaContentRecords>();
        Map<String,DakotaContentRecords> finalDakotaContentsToReturnMap = new Map<String,DakotaContentRecords>();
        if(dakotaContentsQueryResults.size()>0)
        {
            for(Dakota_Content__c dc : dakotaContentsQueryResults)
            {
                if(dc.RecordTypeId == parentRecordTypeId)
                {
                    finalDakotaContentsToReturn.add(createParentDakotaContentWrapper(dc,true));
                }
                else if(dc.RecordTypeId == childRecordTypeId)
                {
                    finalDakotaContentsToReturn.add(createChildDakotaContentWrapper(dc));
                }
            }
            return finalDakotaContentsToReturn;
        }
        return null;
    }
    
    public static DakotaContentRecords createParentDakotaContentWrapper(Dakota_Content__c dc,Boolean fromSearch)
    {
        List<String> childDCMetroAreaRecords = new List<String>();
        List<String> childDCKeyAccountRecords = new List<String>();
        List<String> childDCAllocatorPanelistRecords = new List<String>();
        List<String> childDCRemainingRecords = new List<String>();
        String childDakotaContents = '';
        
        if(fromSearch == false && dc.Dakota_Content__r.size() > 0)
        {
            String childDakotaContentVideo ='';
            for(Dakota_Content__c childContent : dc.Dakota_Content__r)
            {
                String htmlBody = '';              
                htmlBody += '<div style="display:grid;grid-template-columns: 25px auto;padding: 3px;word-break: break-all;">';
                childDakotaContentVideo = childContent.Presentation_Recording_url__c==null ? '' : childContent.Video_links_to_Dakota_Content_Lines__c;
                String childDakotaContentName = '<a href="'+System.Label.Marketplace_Community_Base_URL+'detail/' + childContent.Id+'" target="_self"'+'title="'+childContent.Name+'">'+childContent.Name+'</a>';                        
                htmlBody += '<span class=videoIconSpan>' + childDakotaContentVideo + '</span><span>' + childDakotaContentName + '</span>'; 
                htmlBody += '</div>';

                if(childContent.Type__c == 'Metro Area Roadmap')
                {
                    childDCMetroAreaRecords.add(htmlBody);                               
                    
                }
                else if(childContent.Type__c == 'Key Account')
                {
                    childDCKeyAccountRecords.add(htmlBody);
                                              
                }
                else if(childContent.Type__c == 'Allocator Interview' || childContent.Type__c == 'Panel')
                {
                    childDCAllocatorPanelistRecords.add(htmlBody);                                                               
                }
                else
                {
                    childDCRemainingRecords.add(htmlBody);                                                              
                }                           
            }
        }
        List<String> allSortedChildDakotaContents = new List<String>();
        allSortedChildDakotaContents.addAll(childDCMetroAreaRecords);
        allSortedChildDakotaContents.addAll(childDCKeyAccountRecords);
        allSortedChildDakotaContents.addAll(childDCAllocatorPanelistRecords);
        allSortedChildDakotaContents.addAll(childDCRemainingRecords);
        String finalChildDakotaContents = String.join(allSortedChildDakotaContents , '');       
        DakotaContentRecords dakotaContentRecord = new DakotaContentRecords();
        dakotaContentRecord.Dakota_Live_Call = dc.Dakota_Live_Call__c;
        dakotaContentRecord.Id = dc.Id;
        dakotaContentRecord.Name = dc.Name;
        dakotaContentRecord.dakotaContentdate = dc.Date__c;
        dakotaContentRecord.Type = dc.Type__c;
        dakotaContentRecord.childDakotaContents = finalChildDakotaContents;
        dakotaContentRecord.Presentation_Recording_url = dc.Presentation_Recording_url__c;
        dakotaContentRecord.isParent = true;
        return dakotaContentRecord;
    }
    
    public static DakotaContentRecords createChildDakotaContentWrapper(Dakota_Content__c dc)
    {
        String htmlBody = '<div style="display:grid;grid-template-columns: 25px auto;padding: 3px;word-break: break-all;">';
        String childDakotaContentVideo = dc.Presentation_Recording_url__c==null ? '' : dc.Video_links_to_Dakota_Content_Lines__c;
        String childDakotaContentName = '<a href="'+System.Label.Marketplace_Community_Base_URL+'detail/' + dc.Id+'" target="_self"'+'title="'+dc.Name+'">'+dc.Name+'</a>';                        
        htmlBody += '<span class=videoIconSpan>' + childDakotaContentVideo + '</span><span>' + childDakotaContentName + '</span>';                                                                       
        htmlBody += '</div>';
        DakotaContentRecords dakotaContentRecord = new DakotaContentRecords();
        dakotaContentRecord.Dakota_Live_Call = dc.Dakota_Live_Call__c;
        dakotaContentRecord.Id = dc.Id;
        dakotaContentRecord.Name = dc.Dakota_Live_Call__c != null ? dc.Dakota_Live_Call__r.Name : null;
        dakotaContentRecord.dakotaContentdate = dc.Date__c;
        dakotaContentRecord.Type = dc.Type__c;
        dakotaContentRecord.childDakotaContents = htmlBody;
        dakotaContentRecord.Presentation_Recording_url = dc.Dakota_Live_Call__c != null ? dc.Dakota_Live_Call__r.Presentation_Recording_url__c : null;
        dakotaContentRecord.isParent = false;
        return dakotaContentRecord;
    }
    
    public class DakotaContentWrapper
    {
        @AuraEnabled public Integer totalRecordCount {get; set;}
        @AuraEnabled public List<DakotaContentRecords> dcRecords {get; set;}
        public DakotaContentWrapper(Integer totalRecordCount, List<DakotaContentRecords> dcRecords)
        {
            this.totalRecordCount = totalRecordCount;
            this.dcRecords = dcRecords;
        } 
    }
    
    public class DakotaContentRecords
    {
        @AuraEnabled public String Presentation_Recording_url {get;set;}
        @AuraEnabled public String Dakota_Live_Call {get;set;}
        @AuraEnabled public String Name {get;set;}
        @AuraEnabled public String Id {get;set;}
        @AuraEnabled public Date dakotaContentdate {get;set;}
        @AuraEnabled public String Type {get;set;}
        @AuraEnabled public String childDakotaContents {get;set;}
        @AuraEnabled public Boolean isParent {get;set;}
    }
    
}