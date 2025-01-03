public with sharing class TriggerOnFavoriteHandler {

    List<Follow__c> favoriteList;
    public TriggerOnFavoriteHandler(List<Follow__c> favoriteList) {
        this.favoriteList = favoriteList;
    }

    public void beforeInsert()
    {
        TriggerOnFavoriteService.populateObjectNameFieldInCommunityListViewURL(this.favoriteList);        
        TriggerOnFavoriteService.populateAccountContactLookupByTargetId(this.favoriteList);
    }

    public static void temp() {
        System.debug('Hello');
    }
}