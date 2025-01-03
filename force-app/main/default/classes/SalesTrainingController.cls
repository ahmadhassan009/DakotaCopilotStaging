public with sharing class SalesTrainingController {
    public static String sortFieldOrder;
    public static String sortbyFieldName;
    @AuraEnabled
    public static Boolean updateNumberOfViews(String recordId)
    {
      
        List<Knowledge_Base__c> kb = [Select id, Number_of_Views__c from Knowledge_Base__c where Id =:recordId];
        if(kb != null && kb.size() > 0)
        {            
             kb[0].Number_of_Views__c = kb[0].Number_of_Views__c == null ? 1 : kb[0].Number_of_Views__c+1;
                update kb;
            return true;
        }
        
        return false;
    }

    @AuraEnabled
    public static List<SalesTrainingRecords> fetchFilteredSalesTrainingRecords(String searchFilters, String sortOrder, String sortBy)
    {  
        Id salesTrainingRecordType = Schema.getGlobalDescribe().get('Knowledge_Base__c').getDescribe().getRecordTypeInfosByDeveloperName().get('Sales_Training').getRecordTypeId();
        String baseQuery = 'SELECT Id, Title__c,Chapter_Number__c,(Select Id,Topic__r.Chapter_Number__c,Topic__r.Title__c,Title__c,Sales_Training_Type__c,Category__c,Sub_Topic_Chapter_Number__c,What_will_you_learn__c,Video_Document_Link__c,Number_of_Views__c from Knowledge_Base__r where Video_Document_Link__c != null) FROM Knowledge_Base__c WHERE RecordTypeId =:salesTrainingRecordType AND Sales_Training_Type__c =\'Sales Training Topics\'';
        String whereCondition = '';
        List<Knowledge_Base__c> salesTrainingQueryResults = new List<Knowledge_Base__c> ();
        List<SalesTrainingRecords> finalsalesTrainingsToReturn = new List<SalesTrainingRecords>();
        
        if(searchFilters != '')
        {
            Set<Id> childFilteredSTRecordsIds = new Set<Id>();
            String searchKeyword = '\'%' +searchFilters + '%\'';

            //Search the keyword in the parent records
            baseQuery+= ' AND Title__c LIKE '+ searchKeyword + ' ORDER BY '+sortBy + ' '+ sortOrder;   
            List<Knowledge_Base__c> filteredParentRecordsWithChilds = Database.query(baseQuery); // we got those parent records that contain the search kwyword  (along with their respective childs)
            
            for(Knowledge_Base__c parentRecord : filteredParentRecordsWithChilds)
            {   
                // prepare the final dataset to return containing the parent (having searched keyword) and all of its related child records
                if(parentRecord.Knowledge_Base__r!=null && parentRecord.Knowledge_Base__r.size() > 0)
                {
                    SalesTrainingRecords salesTrainingRecord = new SalesTrainingRecords();
                    salesTrainingRecord.topic = parentRecord.Title__c;
                        salesTrainingRecord.Id = parentRecord.Id;
                        salesTrainingRecord.chapterNumber= parentRecord.Chapter_Number__c;
                    for(Knowledge_Base__c childRecord : parentRecord.Knowledge_Base__r)
                    {
                        // get ID's of all the related child records
                        childFilteredSTRecordsIds.add(childRecord.Id);
                    }
                    salesTrainingRecord.childrenTrainingRecords = createChildSalesTrainingRecords(parentRecord.Knowledge_Base__r);
                    finalsalesTrainingsToReturn.add(salesTrainingRecord);
                }
            }
            
            // search the keyword in all the child records in sales training recordtype
            searchKeyword = '\'' +searchFilters + '*\'';
            String searchquery = 'FIND '+searchKeyword + ' IN ALL FIELDS RETURNING Knowledge_Base__c(Id ,Title__c,Topic__c,topic__r.Title__c,Topic__r.Chapter_Number__c,Category__c,What_will_you_learn__c,Sub_Topic_Chapter_Number__c,Video_Document_Link__c,Number_of_Views__c WHERE Topic__c!=null AND Video_Document_Link__c != null AND RecordTypeId=:salesTrainingRecordType ORDER BY ' + sortBy + ' ' +sortOrder+')';            
            List<List<Knowledge_Base__c>> searchList = search.query(searchquery);
            searchFilters = searchFilters.replace('\\\'', '\'');
            for(Knowledge_Base__c searchedRec : searchList[0])
            {
                //if the child record haven't already been added along with its parent in finalsalesTrainingsToReturn then add this child record in salesTrainingQueryResults list      
                if((!(childFilteredSTRecordsIds.contains(searchedRec.Id))) && (searchedRec?.What_will_you_learn__c?.containsIgnoreCase(searchFilters) == true || 
                searchedRec?.Category__c?.containsIgnoreCase(searchFilters) == true ||
                searchedRec?.Title__c?.containsIgnoreCase(searchFilters) == true))
                {
                    salesTrainingQueryResults.add(searchedRec);
                }
            }
            if(salesTrainingQueryResults!=null && salesTrainingQueryResults.size() > 0)
            {
                Map<Id,String> parentSalesTrainingRecMap = new Map<Id,String>();
                Map<Id,Decimal> parentSalesTrainingRecMap2 = new Map<Id,Decimal>(); 

                Map<Id,List<Knowledge_Base__c>> parentSTtoChildRecIds = new Map<Id,List<Knowledge_Base__c>>();
                for(Knowledge_Base__c st : salesTrainingQueryResults)
                {
                    parentSalesTrainingRecMap.put(st.Topic__c,st.Topic__r.Title__c);
                    parentSalesTrainingRecMap2.put(st.Topic__c,st.Topic__r.Chapter_Number__c); 

                    if(parentSTtoChildRecIds.containsKey(st.Topic__c))
                    {
                        List<Knowledge_Base__c> childSTRecords = parentSTtoChildRecIds.get(st.Topic__c);
                        childSTRecords.add(st);
                        parentSTtoChildRecIds.put(st.Topic__c,childSTRecords);
                    }
                    else
                    {
                        List<Knowledge_Base__c> childSTRecords = new List<Knowledge_Base__c>{st};
                        parentSTtoChildRecIds.put(st.Topic__c,childSTRecords);
                    }
                }
                
                for(Id parentId : parentSalesTrainingRecMap.keySet())
                {
                    SalesTrainingRecords salesTrainingRecord = new SalesTrainingRecords();
                    salesTrainingRecord.topic = parentSalesTrainingRecMap.get(parentId);
                    salesTrainingRecord.chapterNumber= parentSalesTrainingRecMap2.get(parentId); // addded for  Chapter_Number__c
                    salesTrainingRecord.Id = parentId;
                    salesTrainingRecord.childrenTrainingRecords = createChildSalesTrainingRecords(parentSTtoChildRecIds.get(parentId));
                    finalsalesTrainingsToReturn.add(salesTrainingRecord);  
                }
            }
            sortFieldOrder = sortOrder;
            sortbyFieldName = sortBy == 'Title__c' ? 'topic' : 'chapterNumber';
            finalsalesTrainingsToReturn.sort();
            return finalsalesTrainingsToReturn;
        }
        else 
        {
            baseQuery+= ' ORDER BY '+sortBy + ' '+ sortOrder;   
            salesTrainingQueryResults = Database.query(baseQuery);

            if(salesTrainingQueryResults.size() > 0)
            {
                for(Knowledge_Base__c st : salesTrainingQueryResults)
                {
                    SalesTrainingRecords salesTrainingRecord = new SalesTrainingRecords();
                    if(st.Knowledge_Base__r.size() > 0)
                    {
                        salesTrainingRecord.topic = st.Title__c;
                        salesTrainingRecord.Id = st.Id;
                        salesTrainingRecord.chapterNumber = st.Chapter_Number__c;
                        salesTrainingRecord.childrenTrainingRecords = createChildSalesTrainingRecords(st.Knowledge_Base__r);
                        finalsalesTrainingsToReturn.add(salesTrainingRecord);  
                    }
                }
                return finalsalesTrainingsToReturn;
            }
        }
        return null;
    }

    private static List<ChildSalesTraining> createChildSalesTrainingRecords(List<Knowledge_Base__c> trainingRecordsToBeProcessed)
    {
        List<ChildSalesTraining> childSalesTrainingsToReturn = new List<ChildSalesTraining>();
        for(Knowledge_Base__c st : trainingRecordsToBeProcessed)
        {
            ChildSalesTraining salesTrainingRecord = new ChildSalesTraining();
            salesTrainingRecord.title = st.Title__c;
            salesTrainingRecord.category = st.Category__c;
            salesTrainingRecord.id = st.Id;
            salesTrainingRecord.sub_topic_chapter_number = st.Sub_Topic_Chapter_Number__c;
            salesTrainingRecord.what_will_you_learn = st.What_will_you_learn__c;
            salesTrainingRecord.video_document_link = st.Video_Document_Link__c;
            salesTrainingRecord.num_of_views = st.Number_of_Views__c > 0 ? st.Number_of_Views__c : 0;
            childSalesTrainingsToReturn.add(salesTrainingRecord);                  
        }
        return childSalesTrainingsToReturn;
    }

    public class ChildSalesTraining
    {
        @AuraEnabled public String title {get;set;}
        @AuraEnabled public String category {get;set;}
        @AuraEnabled public String id {get;set;}
        @AuraEnabled public String what_will_you_learn {get;set;}
        @AuraEnabled public String video_document_link {get;set;}
        @AuraEnabled public Decimal num_of_views {get;set;}
        @AuraEnabled public Decimal sub_topic_chapter_number {get;set;}
        
    }
    
    public class SalesTrainingRecords implements Comparable
    {
        @AuraEnabled public String Id {get;set;}
        @AuraEnabled public String topic {get;set;}
        @AuraEnabled public Decimal chapterNumber {get;set;}
        @AuraEnabled public List<ChildSalesTraining> childrenTrainingRecords {get;set;}
        
        public Integer compareTo(Object compareTo) {
            SalesTrainingRecords compareToST = (SalesTrainingRecords)compareTo;
            Integer returnValue = 0;          
            if(sortbyFieldName == 'topic')
            {
                if(sortFieldOrder=='desc')
                { 
                    if ((topic == null) && (compareToST.topic == null)) {
                        returnValue = 0;
                    } else if ((topic == null) && (compareToST.topic != null)){
                        returnValue = 1;
                    } else if ((topic != null) && (compareToST.topic == null)){
                        returnValue = -1;
                    }else if (topic > compareToST.topic) {
                        returnValue = -1;
                    } else if (topic < compareToST.topic) {
                        returnValue = 1;
                    }                     
                }
                else 
                {
                    if ((topic == null) && (compareToST.topic == null)) {
                        returnValue = 0;
                    } else if ((topic == null) && (compareToST.topic != null)){
                        returnValue = 1;
                    } else if ((topic != null) && (compareToST.topic == null)){
                        returnValue = -1;
                    }else if (topic > compareToST.topic) {
                        returnValue = 1;
                    } else if (topic < compareToST.topic) {
                        returnValue = -1;
                    }
                }
            }
            else if(sortbyFieldName == 'chapterNumber')
            {
                if(sortFieldOrder=='desc')
                { 
                    if ((chapterNumber == null) && (compareToST.chapterNumber == null)) {
                        returnValue = 0;
                    } else if ((chapterNumber == null) && (compareToST.chapterNumber != null)){
                        returnValue = 1;
                    } else if ((chapterNumber != null) && (compareToST.chapterNumber == null)){
                        returnValue = -1;
                    }else if (chapterNumber > compareToST.chapterNumber) {
                        returnValue = -1;
                    } else if (chapterNumber < compareToST.chapterNumber) {
                        returnValue = 1;
                    }                     
                }
                else 
                {
                    if ((chapterNumber == null) && (compareToST.chapterNumber == null)) {
                        returnValue = 0;
                    } else if ((chapterNumber == null) && (compareToST.chapterNumber != null)){
                        returnValue = 1;
                    } else if ((chapterNumber != null) && (compareToST.chapterNumber == null)){
                        returnValue = -1;
                    }else if (chapterNumber > compareToST.chapterNumber) {
                        returnValue = 1;
                    } else if (chapterNumber < compareToST.chapterNumber) {
                        returnValue = -1;
                    }
                }
            }

            return returnValue;
        }
    }
}