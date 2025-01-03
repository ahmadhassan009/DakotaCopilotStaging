public class TriggerOnAccountContactRelationService {

    public static  boolean firstRun = true;

    
    @testVisible private static Set<RefreshComponents__e> eventList = new Set<RefreshComponents__e>();
    
    public static void refreshAccountContactRelation(List<AccountContactRelation> newAccountContactRelation)
    {
        List<RefreshComponents__e> refreshRecordEvents = new List<RefreshComponents__e>();
        for (AccountContactRelation AccountContactRelations : newAccountContactRelation) {
            RefreshComponents__e rc = new RefreshComponents__e(
                recordUsed__c = AccountContactRelations.AccountId,
                UserUsed__c = UserInfo.getUserId(),
                userSession__c=UserInfo.getSessionId()
            );
            eventList.add(rc);
            refreshRecordEvents.add(rc);
        }
        EventBus.publish(refreshRecordEvents);
    }


    public static void updateNotaFitForDakotaTalentFlagInContacts(List<AccountContactRelation> newAccountContactRelationList) {
        if(!TriggerOnAccountContactRelationService.firstRun) {return;}
        TriggerOnAccountContactRelationService.firstRun = false;

        List<Id> relatedContactIds = new List<Id>();
        for (AccountContactRelation acRelation : newAccountContactRelationList) {
            if (acRelation.ContactId != null && acRelation.AccountId != null) {
                relatedContactIds.add(acRelation.ContactId);
            }
        }
        if(relatedContactIds.size() > 0) {
            List<Contact> relatedContactsList = new List<Contact>([SELECT Id, Name, AccountId, Not_a_fit_for_MarketplaceII__c,  Account.Not_a_fit_for_MarketplaceII__c FROM Contact WHERE Id IN: relatedContactIds]);
            List<Contact> contactsToUpdateList = new List<Contact>();
            if(relatedContactsList != null && relatedContactsList.size() > 0) {
                for (Contact con : relatedContactsList) {
                    if(con.Not_a_fit_for_MarketplaceII__c != con.Account.Not_a_fit_for_MarketplaceII__c) {
                        contactsToUpdateList.add(new Contact(Id = con.Id, Not_a_fit_for_MarketplaceII__c = con.Account.Not_a_fit_for_MarketplaceII__c));
                    }
                }
            }
            if(contactsToUpdateList.size() > 0) {
                update contactsToUpdateList;
            }
        }
    }

    /**
     * Function to check if any of the Heroku Synced field has been updated, if thats the case, reset the Heroku Synced Flag to false
     */
    public static void resetHerokuSyncFlag(List<AccountContactRelation> newAccountContactRelationList, Map<Id,AccountContactRelation> oldNewAccountContactRelationList)
    {
        HerokuSyncHelper helperObj = new HerokuSyncHelper('AccountContactRelation');
        helperObj.resetHerokuSyncFlag((List<SObject>)newAccountContactRelationList, (Map<Id, SObject>)oldNewAccountContactRelationList);
    }

    public static void deleteRecFromHeroku(Map<Id,AccountContactRelation> oldNewAccountContactRelationMap)
    {
        System.enqueueJob(new DeleteRecFromHeroku(oldNewAccountContactRelationMap.keySet(),'AccountContactRelation'));
    }
}