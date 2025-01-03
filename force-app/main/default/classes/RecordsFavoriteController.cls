public with sharing class RecordsFavoriteController 
{
    public class FavouritesException extends Exception {}
    //DSC-729: Permission message
    private static String errorMessage = 'Already added in the followed list';
    

    public class Favorites
    {
        @AuraEnabled public Integer accessCount;
        @AuraEnabled public String iconColor;
        @AuraEnabled public String iconUrl;
        @AuraEnabled public String id;
        @AuraEnabled public String lastAccessDate;
        @AuraEnabled public String name;
        @AuraEnabled public String objectType;
        @AuraEnabled public Integer sortOrder;
        @AuraEnabled public String subtitle;
        @AuraEnabled public String target;
        @AuraEnabled public String targetType;
    }
    public Class FavouritesList
    {
        @AuraEnabled public List<Favorites> favorites;
    }
    
    /*
    * Get User Session ID from VF Page 'sessionIdVfPage' 
    */
    public static String getSessionIdFrmVFPg(){
        PageReference  vfPageContainSessionId = Page.sessionIdVfPage;
        String data;
        if(Test.isRunningTest()){
            data = UserInfo.getSessionId();
            return data;
        }
        else{
            data = vfPageContainSessionId.getContent().toString();
            return data.substring(data.indexOf('Session_Id_Start_Here') + 'Session_Id_Start_Here'.length(), data.indexOf('Session_Id_End_Here'));
        }
    }

    @AuraEnabled
    public static Boolean savePreferences(String contactUpdatesSelection, String accountUpdatesSelection, String searchesUpdatesSelection, Boolean isWeaklyUpdates) {
        try {
      
            // Retrieve existing preferences or create a new one
            List<Email_Notification_Preferences__c> preferencesList = [
                                                                        SELECT Id, Following_Objects__c, createdby.ContactId, Only_Weekly_Updates__c, Contact_Updates_Selection__c, Account_Updates_Selection__c, Search_Updates_Selection__c
                                                                        FROM Email_Notification_Preferences__c 
                                                                        WHERE OwnerId = :UserInfo.getUserId() 
                                                                        LIMIT 1
                                                                      ];
            Email_Notification_Preferences__c preferences;

            if (preferencesList.isEmpty()) {
                preferences = new Email_Notification_Preferences__c(OwnerId = UserInfo.getUserId());
            } else {
                preferences = preferencesList[0];
            }
            preferences.Contact_Updates_Selection__c = contactUpdatesSelection;
            preferences.Account_Updates_Selection__c = accountUpdatesSelection;
            preferences.Search_Updates_Selection__c = searchesUpdatesSelection;
            preferences.Only_Weekly_Updates__c = isWeaklyUpdates;
            upsert preferences;
            return true;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
            // Handle the exception as needed
        }
    }

    @AuraEnabled
    public static Email_Notification_Preferences__c getPreferences() {
        try {
            List<Email_Notification_Preferences__c> preferencesList = [
                                                                        SELECT Id, Following_Objects__c, Only_Weekly_Updates__c, Contact_Updates_Selection__c, Search_Updates_Selection__c, Account_Updates_Selection__c
                                                                        FROM Email_Notification_Preferences__c 
                                                                        WHERE OwnerId = :UserInfo.getUserId() 
                                                                        LIMIT 1
                                                                      ];
            if (preferencesList.size() > 0) {
                return preferencesList[0];
            } else {
                return null;
            }
        } catch (Exception e) {
            // Handle the exception as needed.
            return null;
        }
    }
    
    /*
    * Add record to favorite list using API call 
    */
    @AuraEnabled
    public static Follow__c addToFavorites(String recordId,String targetType)
    {
        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
        List<Follow__c> favList = [Select Id from Follow__c where Target_Id__c =: recordId and OwnerId=:UserInfo.getUserId() and RecordTypeId = :recordTypeId ];
        if(favList.size() > 0){
            throw new FavouritesException(errorMessage);
        }
        try{
            String userId;
            Follow__c fav = new Follow__c();

            if(targetType=='ListView') {
                if(recordId=='Account') {
                    fav.Object_Name__c = 'Account';
                    fav.Follow_Record_Name__c = 'Recently Viewed';
                }
                else if(recordId=='Contact') {
                    fav.Object_Name__c = 'Contact';
                    fav.Follow_Record_Name__c = 'Recently Viewed';
                }
                else if(recordId=='Marketplace_Searches__c') {
                    fav.Object_Name__c = 'Marketplace_Searches__c';
                    fav.Follow_Record_Name__c = 'Recently Viewed';
                }
                else if(recordId=='Investment__c') {
                    fav.Object_Name__c = 'Investment__c';
                    fav.Follow_Record_Name__c = 'Recently Viewed';
                }
                else if(recordId=='Update__c') {
                    fav.Object_Name__c = 'Update__c';
                    fav.Follow_Record_Name__c = 'Recently Viewed';
                }
                else if(recordId=='University_Alumni__c') {
                    fav.Object_Name__c = 'University_Alumni__c';
                    fav.Follow_Record_Name__c = 'Recently Viewed';
                } else if(recordId=='Form_D_Offering__c') {
                    fav.Object_Name__c = 'Form_D_Offering__c';
                    fav.Follow_Record_Name__c = 'Recently Viewed';
                }
                else {
                ListView lv =[SELECT Name, DeveloperName, SobjectType FROM ListView where Id =:recordId];
                fav.Object_Name__c = lv.SobjectType;
                fav.Follow_Record_Name__c =lv.Name;
                }
                Schema.SObjectType objectType = Schema.getGlobalDescribe().get(fav.Object_Name__c);
                    DescribeSObjectResult describe = objectType.getDescribe();
                    fav.Subtitle__c = describe.getLabel()+'s';
            }
            if(targetType=='Record') {
                Id newId = Id.valueOf(recordId);
                fav.Object_Name__c = newId.getSObjectType().getDescribe().getName();
                SObject temp = null;
                if(fav.Object_Name__c == 'Account') {
                    String q= 'SELECT Name,AUM__c,Metro_Area_Name__c,Type FROM '+fav.Object_Name__c+' where Id =:recordId';
                    temp = Database.query(q);
                    fav.Account_Type__c = (String)temp.get('Type');
                    fav.Account_Metro_Area__c = (String)temp.get('Metro_Area_Name__c');
                    fav.Account_AUM__c=(Decimal)temp.get('AUM__c');
                }
                else if(fav.Object_Name__c == 'Contact') {
                    String q= 'SELECT Name,Asset_Class_Coverage__c,Title,Contact_Type__c FROM '+fav.Object_Name__c+' where Id =:recordId';
                    temp = Database.query(q);
                    fav.Contact_Asset_Class_Coverage__c = (String)temp.get('Asset_Class_Coverage__c');
                    fav.Contact_Title__c = (String)temp.get('Title');
                    fav.Contact_Type__c=(String)temp.get('Contact_Type__c');
                }
                else {
                    String q= 'SELECT Name FROM '+fav.Object_Name__c+' where Id =:recordId';
                    temp = Database.query(q);
                }
                fav.Follow_Record_Name__c = (String)temp.get('Name');
                Schema.SObjectType objectType = Schema.getGlobalDescribe().get(fav.Object_Name__c);
                DescribeSObjectResult describe = objectType.getDescribe();
                fav.Subtitle__c = describe.getLabel();
            }
            List<custom_favorite_record_theme_Setting__mdt> iconTheme = new List<custom_favorite_record_theme_Setting__mdt>();
            iconTheme = [SELECT Icon_color__c,Icon_Url__c,Object_Name__c
                FROM custom_favorite_record_theme_Setting__mdt
                WHERE Object_Name__c =:fav.Object_Name__c
            ];
            if(iconTheme.size()>0) {
                fav.Icon_Color__c = iconTheme[0].Icon_color__c;
                fav.Icon_Url__c = iconTheme[0].Icon_Url__c;
            }
            userId = UserInfo.getUserId();
            fav.Target_Id__c = recordId;
            fav.Target_Type__c = targetType;
            fav.OwnerId = userId;
            insert fav;

            return fav;
        } catch(Exception ex) {
            System.debug(ex.getMessage() + ex.getStackTraceString());   
        }
        return null;
    }

    @AuraEnabled
    public static List<Follow__c> massAddToFavorites(List<String> recordId)
    {
        List<Follow__c> favList = new  List<Follow__c>();
        Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
        List<Follow__c> alreadyFavList = [Select Id,Target_Id__c from Follow__c where Target_Id__c =: recordId and OwnerId=:UserInfo.getUserId() and RecordTypeId = :recordTypeId ];
        if(alreadyFavList.size() > 0){
            for(Follow__c fav:alreadyFavList) {
                for (Integer i = 0; i < recordId.size(); i++) {
                    if (recordId[i] == fav.Target_Id__c) {
                        recordId.remove(i);
                    }
                }
            }
        }

        if(recordId.size()>0)
        {
            try{            
                
                Id newId = Id.valueOf(recordId[0]);
                string objName= newId.getSObjectType().getDescribe().getName();
    
                String userId = UserInfo.getUserId();
    
                List<custom_favorite_record_theme_Setting__mdt> iconTheme = new List<custom_favorite_record_theme_Setting__mdt>();
                iconTheme = [SELECT Icon_color__c,Icon_Url__c,Object_Name__c
                FROM custom_favorite_record_theme_Setting__mdt
                WHERE Object_Name__c =:objName];
    
                Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objName);
                DescribeSObjectResult describe = objectType.getDescribe();
    
                List<SObject> tempp = new List<SObject>();
                if(objName == 'Account') {
                    String q= 'SELECT Id,Name,AUM__c,Metro_Area_Name__c,Type FROM '+objName+' where Id =:recordId';
                    tempp = Database.query(q);
                    for(SObject temp:tempp)
                    {
                        Follow__c fav = new Follow__c();
                        fav.Account_Type__c = (String)temp.get('Type');
                        fav.Account_Metro_Area__c = (String)temp.get('Metro_Area_Name__c');
                        fav.Account_AUM__c=(Decimal)temp.get('AUM__c');
    
                        fav.Follow_Record_Name__c = (String)temp.get('Name');
                        fav.Subtitle__c = describe.getLabel();
                        fav.Object_Name__c = objName;
                        fav.Target_Id__c = (String)temp.get('Id');
                        fav.Target_Type__c = 'Record';
                        fav.OwnerId = userId;
                        if(iconTheme.size()>0) {
                            fav.Icon_Color__c = iconTheme[0].Icon_color__c;
                            fav.Icon_Url__c = iconTheme[0].Icon_Url__c;
                        }
                        favList.add(fav);
                    } 
                }
                else if(objName == 'Contact') {
                    String q= 'SELECT Id,Name,Asset_Class_Coverage__c,Title,Contact_Type__c FROM '+objName+' where Id =:recordId';
                    tempp = Database.query(q);
                    for(SObject temp:tempp)
                    {
                        Follow__c fav = new Follow__c();
                        fav.Contact_Asset_Class_Coverage__c = (String)temp.get('Asset_Class_Coverage__c');
                        fav.Contact_Title__c = (String)temp.get('Title');
                        fav.Contact_Type__c=(String)temp.get('Contact_Type__c');
                        
                        fav.Follow_Record_Name__c = (String)temp.get('Name');
                        fav.Subtitle__c = describe.getLabel();
                        fav.Object_Name__c = objName;
                        fav.Target_Id__c = (String)temp.get('Id');
                        fav.Target_Type__c = 'Record';
                        fav.OwnerId = userId;
                        if(iconTheme.size()>0) {
                            fav.Icon_Color__c = iconTheme[0].Icon_color__c;
                            fav.Icon_Url__c = iconTheme[0].Icon_Url__c;
                        }
                        favList.add(fav);
                    }
                }
                else {
                    String q= 'SELECT Id,Name FROM '+objName+' where Id =:recordId';
                    tempp = Database.query(q);
                    for(SObject temp:tempp)
                    {         
                        Follow__c fav = new Follow__c();           
                        fav.Follow_Record_Name__c = (String)temp.get('Name');
                        fav.Subtitle__c = describe.getLabel();
                        fav.Object_Name__c = objName;
                        fav.Target_Id__c = (String)temp.get('Id');
                        fav.Target_Type__c = 'Record';
                        fav.OwnerId = userId;
                        if(iconTheme.size()>0) {
                            fav.Icon_Color__c = iconTheme[0].Icon_color__c;
                            fav.Icon_Url__c = iconTheme[0].Icon_Url__c;
                        }
                        favList.add(fav);
                    }
                } 
                
                insert favList;
                return favList;
            } catch(Exception ex) {
                System.debug(ex.getMessage() + ex.getStackTraceString());   
            }
        }        
        return null;
    }
    
    /*
    * Remove record to favorite list using API call 
    */
    @AuraEnabled
    public static boolean removeFromFavorites(String favId)
    {
        try{
            Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
            Follow__c fav = [Select Id from Follow__c where Target_Id__c =: favId and RecordTypeId = :recordTypeId];
            if(fav != null){
                delete fav;
                return true;
            }
            return false;
        } catch(Exception ex) {
            System.debug(ex.getMessage() + ex.getStackTraceString());
            return false;
        }
    }
    @AuraEnabled
    public static integer massRemoveFromFavorites(List<String> favIdList)
    {
        try{
            Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
            List<Follow__c> favList = [Select Id from Follow__c where Target_Id__c =: favIdList and RecordTypeId = :recordTypeId];
            if(favList != null && favList.size()>0){
                integer unfollowRecordsCount=favList.size();
                delete favList;
                return unfollowRecordsCount;
            }
            return 0;
        } catch(Exception ex) {
            System.debug(ex.getMessage() + ex.getStackTraceString());
            return 0;
        }
    }
    
    public static List<Follow__c> getLegacyRecord(String userId){
        User currentuser = [Select Id ,Name,Legacy_Record_Imported__c,email from User where Id =:userId];
            if(!currentuser.Legacy_Record_Imported__c || Test.isRunningTest()) {
                List<Follow__c> favoriteList = new List<Follow__c>();
                String sessionId= getSessionIdFrmVFPg();
                Http http = new Http();
                String host = System.Url.getOrgDomainUrl().toExternalForm();
                String endPointURL = host + '/services/data/v50.0/ui-api/favorites/';
                HttpRequest request = new HttpRequest();
                request.setMethod('GET');
                request.setHeader('Authorization', 'OAuth '+ sessionId);
                request.setEndpoint(endPointURL);
                request.setHeader('Content-Type','application/json');
                request.setHeader('Accept','application/json');
                request.setHeader('X-Chatter-Entity-Encoding','false');
                HttpResponse response;
                response = http.send(request);
            if(response.getStatusCode() == 200)
            {
                currentuser.Legacy_Record_Imported__c = true;
                update currentuser;
                String favRecords = response.getBody().unescapeHtml4();
                FavouritesList favoritesList = (FavouritesList) System.JSON.deserialize(favRecords, FavouritesList.class);
                
                    for(Favorites favorite : favoritesList.favorites) {
                        Follow__c fav = new Follow__c();
                        fav.Follow_Id__c = favorite.Id;
                        fav.Target_Id__c = favorite.target;
                        fav.Follow_Record_Name__c = favorite.name;
                        fav.Object_Name__c = favorite.objectType;
                        fav.Target_Type__c = favorite.targetType;
                        fav.OwnerId = userId;
                        fav.Legacy_Record__c = true;
                        fav.Access_Count__c = favorite.accessCount;
                        fav.Icon_Color__c = favorite.iconColor;
                        fav.Icon_Url__c = favorite.iconUrl;
                        fav.Sort_Order__c = favorite.sortOrder;
                        fav.Last_Access_Date__c = favorite.lastAccessDate;
                        fav.Subtitle__c = favorite.subtitle;
                        favoriteList.add(fav);
                    }
                    insert favoriteList;
                    return favoriteList;
                }
            }
            return null;
    }

    /*
    * Get record to favorite record by target record id.
    */
    @AuraEnabled
    public static Follow__c getFavoriteRecordById(String favId)
    {
        try{
            Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
            Follow__c fav = [Select Id from Follow__c where Target_Id__c =: favId and RecordTypeId = :recordTypeId];
            if (fav != null) {
                return fav;
            }
            return null;
        } catch(Exception ex) {
            System.debug(ex.getMessage() + ex.getStackTraceString());
            return null;
        }
    }

    /*
    * Get list of all favorite records
    */
    @AuraEnabled
    public static List<Follow__c> getAllFavoriteRecords()
    {
        try{
            String userId = UserInfo.getUserId();
            getLegacyRecord(userId);
            Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
            List<Follow__c> favoriteRecord = [Select Target_Type__c,Object_Name__c,Follow_Id__c,Target_Id__c,Follow_Record_Name__c,Icon_Color__c,Icon_Url__c,Subtitle__c from Follow__c where RecordTypeId = :recordTypeId ];
            return favoriteRecord;
        } catch(Exception ex) {
            System.debug(ex.getMessage() + ex.getStackTraceString());
            return null;
        }
    }

    @AuraEnabled
    public static Integer getfollowRecordCount()
    {
        try{
            Id recordTypeId = [SELECT Id FROM RecordType WHERE DeveloperName = 'Follow_Record' AND SObjectType = 'Follow__c' LIMIT 1].Id;
            return [SELECT COUNT() FROM Follow__c WHERE RecordTypeId = :recordTypeId ];
        } catch(Exception ex) {
            System.debug(ex.getMessage() + ex.getStackTraceString());
        }
        return 20;
    }

    /*
    * Check record type of account or contact
    */
    @AuraEnabled
    public static Boolean checkRecordType(String objectName,String recordId)
    {
        if(objectName == 'Account')
        {
            Id genBusinessRecordTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('General_Business').getRecordTypeId();
            List<Account> account = [Select Id,RecordTypeId,Form_5500_Account__c from Account where Id = :recordId Limit 1];
            if(account.size() > 0 && (account[0].RecordTypeId == genBusinessRecordTypeId || account[0].Form_5500_Account__c))
            {
                return true;
            }
            return false;
        }
        else
        {
            Id genBusinessRecordTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('General_Business').getRecordTypeId();
            List<Contact> contact = [Select Id,RecordTypeId from Contact where Id = :recordId Limit 1];
            if(contact.size() > 0 && contact[0].RecordTypeId == genBusinessRecordTypeId)
            {
                return true;
            }
            return false;
        }
    }
}