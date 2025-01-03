global class SchedulerToUpdateSearchesStatus implements Schedulable{
    global void execute(SchedulableContext ctx) {
        updateMarketplaceSearchStatus();
    }
    
    
    public static void updateMarketplaceSearchStatus()
    {
        Date todayDate = System.now().Date();
        List<Marketplace_Searches__c> searchesToBeArchived = [Select Id,Name,Search_Status__c from Marketplace_Searches__c where
                                                                Search_Status__c not in ('Archived','','Completed') 
                                                                and End_Date__c < :todayDate and End_Date__c!=null];
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