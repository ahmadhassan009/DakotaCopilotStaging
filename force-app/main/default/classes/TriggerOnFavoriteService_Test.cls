@isTest
public with sharing class TriggerOnFavoriteService_Test {
     @isTest
    public static void testPopulateObjectNameFieldInCommunityListViewURL() {
        Follow__c fav = new Follow__c();
        fav.Object_Name__c = 'Marketplace_Searches__c';
        insert fav;
        Follow__c newfavorite =[SELECT Id,Object_Name__c,Object_Name_In_Community_List_View_URL__c from Follow__c where id =: fav.id];
        System.assertEquals(newfavorite.Object_Name_In_Community_List_View_URL__c, 'marketplace-searches');
        
        Follow__c fav2 = new Follow__c();
        fav2.Object_Name__c = 'Account';
        insert fav2;
        Follow__c newfavorite2 =[SELECT Id,Object_Name__c,Object_Name_In_Community_List_View_URL__c from Follow__c where id =: fav2.id];
        System.assertEquals(newfavorite2.Object_Name_In_Community_List_View_URL__c, 'account');

    }

    @isTest
    public static void testPopulateAccountContactLookupByTargetId() {

        Account acc = TestDataFactory.createAccount();
        
        Follow__c fav2 = new Follow__c();
        fav2.Object_Name__c = 'Account';
        fav2.Target_Type__c = 'Record';
        fav2.Target_Id__c = acc.Id;
        insert fav2;
        Follow__c newfavorite2 =[SELECT Id,Object_Name__c,Target_Type__c,Target_Id__c,Account__c from Follow__c where id =: fav2.id];
        System.assertEquals(newfavorite2.Target_Id__c, newfavorite2.Account__c);

    }
}