trigger TriggerOnFavorite on Favorite__c (before insert, after insert) {
    TriggerOnFavoriteHandler.temp();
}