global class SchedulerToDeleteActivityStream implements Schedulable{
    global void execute(SchedulableContext ctx) {
        deleteJunkUpdatesRecords();
        updateMarketplaceSearchStatus();
    }
    
    public static void deleteJunkUpdatesRecords()
    {
        List<Update__c> activityStreamsToBeDeleted = [Select Id,Name from Update__c where
                                                      Account__c = null and
                                                      Contact__c = null and Contact_Deleted__c = null Limit 5000];
        if(activityStreamsToBeDeleted.size()>0)
        {
            delete activityStreamsToBeDeleted;
        }
    }
    
    public static void updateMarketplaceSearchStatus()
    {
        Date todayDate = System.now().Date();
        Date sixMonthOldDate = System.now().Date().addMonths(-6);
        List<Marketplace_Searches__c> searchesToBeArchived = [Select Id,Name,Search_Status__c from Marketplace_Searches__c where Search_Status__c != 'Archived'
                                                              and (End_Date__c < :todayDate or (End_Date__c = null and Search_Status__c!= 'Upcoming' and 
                                                                  Search_Status__c != 'Ongoing' and CreatedDate < :sixMonthOldDate))];
        if(searchesToBeArchived.size() > 0)
        {
            for(Marketplace_Searches__c searchRecord :searchesToBeArchived)
            {
                searchRecord.Search_Status__c = 'Archived';
            }
            update searchesToBeArchived;
        }
    }
}