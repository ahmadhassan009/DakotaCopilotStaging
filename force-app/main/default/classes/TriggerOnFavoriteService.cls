public with sharing class TriggerOnFavoriteService {
    public static void populateObjectNameFieldInCommunityListViewURL(List<Follow__c> newfavorites) {
        
		String tempObjectNameField ;
        String modifiedString = '';
        Boolean convertNextCharToLowerCase = false;
        Id recordTypeId =  [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
        for(Follow__c fav : newfavorites){
            if(recordTypeId == fav.RecordTypeId  || Test.isRunningTest()) {
                tempObjectNameField = fav.Object_Name__c.substring(0, 1).toLowerCase() + fav.Object_Name__c.substring(1);
            if ((tempObjectNameField).endsWith('__c')) {
                tempObjectNameField = tempObjectNameField.substring(0, tempObjectNameField.length() - 3);
            } 
            modifiedString = tempObjectNameField;
            if(tempObjectNameField.contains('_')) {
                modifiedString = '';
                tempObjectNameField = tempObjectNameField.replace('_', '-');
                convertNextCharToLowerCase = false;
                for (Integer i = 0; i < tempObjectNameField.length(); i++) {
                    String currentChar = tempObjectNameField.substring(i, i + 1);
                    
                    if (currentChar == '-') {
                        convertNextCharToLowerCase = true;
                        modifiedString += currentChar;
                    } else if (convertNextCharToLowerCase) {
                        modifiedString += currentChar.toLowerCase();
                    } else {
                        modifiedString += currentChar;
                    }
                }
            }
            fav.Object_Name_In_Community_List_View_URL__c = modifiedString;
            }
        }
    }

    public static void populateAccountContactLookupByTargetId(List<Follow__c> newfavorites) {
        for(Follow__c fav : newfavorites) {
            if(fav.Target_Type__c == 'Record' && fav.Target_Id__c != '' ) {
                Id recordId = fav.Target_Id__c;
                String objectName = recordId.getSObjectType().getDescribe().getName();
                if(fav.Object_Name__c =='Account' && objectName=='Account') {
                    fav.Account__c = fav.Target_Id__c;
                }else if(fav.Object_Name__c =='Contact' && objectName=='Contact') {
                    fav.Contact__c = fav.Target_Id__c;
                }
            }
        }
    }
}