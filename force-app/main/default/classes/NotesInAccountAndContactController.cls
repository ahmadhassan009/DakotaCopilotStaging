public with sharing class NotesInAccountAndContactController {

    public class DakotaNotesException extends Exception {}
    //DSC-729: Permission message
    private static String permissionMsg = 'You don\'t have necessary permissions to perform this action';
    /**
     * Function returns Id of the portal user's organization, and name of the profile incase of admin
     */
    @AuraEnabled
    public static List<String> getOrganizationId()
    {
        List<User> users = [SELECT Id, ContactId,Contact.AccountId, Profile.Name, IsPortalEnabled
                            FROM User 
                            WHERE Id=:UserInfo.getUserId()];
          
        if(users!=null && users.size()>0)
        {
            if(users[0].IsPortalEnabled == true && users[0].Contact != null && users[0].Contact.AccountId != null) {
                return new List<String>{'true',users[0].Contact.AccountId};
            } else {
                return new List<String>{'false',users[0].Profile.Name};
            }
        }
        
        return null;
    }

    @AuraEnabled
    public static Boolean checkDakotaNotesPermissions(){
        try {
            if(Schema.SObjectType.Dakota_Notes__c.isAccessible()) {
                return true;
            }
            return false;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


    /** 
     * Function returns the name of the profile
     */
    @AuraEnabled
    public static String getUserProfileName()
    {     
        User user = [SELECT  Profile.Name FROM User  WHERE Id=:UserInfo.getUserId()];
        return user.Profile.Name;
    }

    /** 
     * function returns the total number of records
     */
    @AuraEnabled
    public static Integer getTotalNotesRecordsCount(String recordId)
    {
        List<String> orgId = getOrganizationId();
        if(orgId!=null && orgId.size() > 0) { 
            if(orgId[0] == 'true') {
                return [SELECT COUNT() FROM Dakota_Notes__c WHERE (Account__c = :recordId OR Contact__c = :recordId) AND Organization_ID__c =:orgId];
            } else if(orgId[0] == 'false' && orgId[1] == 'System Administrator') {
                return [SELECT COUNT() FROM Dakota_Notes__c WHERE Account__c = :recordId OR Contact__c = :recordId];
            } else {
                return [SELECT COUNT() FROM Dakota_Notes__c WHERE (Account__c = :recordId OR Contact__c = :recordId) AND OwnerId =:UserInfo.getUserId()];
            }
        } else {
            return 0;
        }
    }

    @AuraEnabled
    public static string getSFBaseUrl(){
        String sfdcBaseURL = URL.getSalesforceBaseUrl().toExternalForm();
        return sfdcBaseURL;
    }

    /** 
     * function returns the name of the object
     */
    @AuraEnabled
    public static String getObjectName(String recordId)
    {
        return Id.valueOf(recordId).getSObjectType().getDescribe().getName();
    }

    /** 
     * function return the notes for the user (for community users the result is based on org id)
     */
    @AuraEnabled
    public static List<NotesHelper> fetchNotes(String  recordId, Integer recLimit, Integer offset, String sortby, String sortDirection)
    {
        if(!Schema.SObjectType.Dakota_Notes__c.isAccessible()) {
            return null;
        }
        List<String> orgId = getOrganizationId();
        if(orgId!=null && orgId.size() > 0) {
            String adminCheck = '';
            if(orgId[0] == 'true') {
                adminCheck = ' AND Organization_ID__c =:orgId ';
            } else if(orgId[0] == 'false' && orgId[1] != 'System Administrator') {
                adminCheck = ' AND OwnerId = \''+ UserInfo.getUserId() +'\' ';
            }
            List<NotesHelper> notesHelperList = new List<NotesHelper>();
            String notesListQuery = ' SELECT Id, Name, Text_Preview__c, CreatedById, CreatedBy.Name, Created_By_User__c, lastmodifiedById, lastmodifiedBy.Name, lastmodifieddate, Account__c, Contact__c, OwnerId'+
                                    ' FROM Dakota_Notes__c'+
                                    ' WHERE (Account__c = :recordId OR Contact__c = :recordId) '+ adminCheck+
                                    ' ORDER BY '+sortby +' '+sortDirection+' LIMIT '+recLimit+ ' OFFSET ' +offset;
            
            List<Dakota_Notes__c> notesList = Database.query(notesListQuery);
            if(notesList!=null && notesList.size()>0)
            {      
                NotesHelper noteHelper;
               for(Dakota_Notes__c dnote: notesList)
               {
                    noteHelper = new NotesHelper();

                    noteHelper.Id = dnote.Id;

                    if(dnote.Name!=null)
                        noteHelper.Title = dnote.Name;

                    if(dnote.Text_Preview__c!=null){
                        dnote.Text_Preview__c = formatRichText(dnote.Text_Preview__c);
                        noteHelper.TextPreview = dnote.Text_Preview__c;
                    }
                    if(dnote.Account__c!=null)
                    {
                        noteHelper.Account = dnote.Account__c;
                    }
                    if(dnote.Contact__c!=null)
                    {
                        noteHelper.Contact = dnote.Contact__c;
                    }
                    
                    /// Id, Title, TextPreview, CreatedById, CreatedByName, LastModifiedDate, LastModifiedById, LastModifiedByName, Account, Contact
                    noteHelper.CreatedById = dnote.CreatedById;
                    noteHelper.CreatedByName = dnote.CreatedBy.Name;
                    noteHelper.LastModifiedById = dnote.lastmodifiedById;
                    noteHelper.LastModifiedByName = dnote.lastmodifiedBy.Name;
                    noteHelper.LastModifiedDate = dnote.lastmodifieddate;
                    noteHelper.OwnerId = dnote.OwnerId;

                    notesHelperList.add(noteHelper);
               }  
           }
           return notesHelperList;
        }
        return null;
    }
    /** 
     * function takes note id and deletes that note
     */
    @AuraEnabled
    public static Boolean deleteNote(String  recordId)
    {
        try {
            if(!Schema.SObjectType.Dakota_Notes__c.isAccessible()) {
                throw new DakotaNotesException(permissionMsg);
            }
            List<Database.DeleteResult> deletedNotes = new List<Database.DeleteResult>();

            deletedNotes = Database.delete([SELECT Id
                FROM Dakota_Notes__c
                WHERE Id = :recordId]);

            if(deletedNotes!=null && deletedNotes.size()>0) {
                return true;
            }
            return false;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class NotesHelper
    {
        @AuraEnabled public String Id { get; set; }
        @AuraEnabled public String Title { get; set; }
        @AuraEnabled public String TextPreview { get; set; }
        @AuraEnabled public String CreatedById { get; set; }
        @AuraEnabled public String CreatedByName { get; set; }
        @AuraEnabled public Datetime LastModifiedDate { get; set; }
        @AuraEnabled public String LastModifiedById { get; set; }
        @AuraEnabled public String LastModifiedByName { get; set; }
        @AuraEnabled public String Account { get; set; }
        @AuraEnabled public String Contact { get; set; }
        @AuraEnabled public String OwnerId { get; set; } 
    }

    /** 
     * Formates the rich text fields for list views
     */
    public static string formatRichText(String fieldValue)
    {   
        if(!String.isBlank(fieldValue)){
            if(fieldValue.substring(0,3) == '<p>') {
                fieldValue = fieldValue.replaceFirst('<p>','');
                fieldValue = fieldValue.replaceFirst('</p>','');
            }

            //remove font-size and font family from rich text area value
            fieldValue = fieldValue.replaceAll('font-size:[^;\']*(;)?','');
            fieldValue = fieldValue.replaceAll('font-family:[^;\']*(;)?','');
            return fieldValue;
        }
        else{
            return null;
        }
    }

    @AuraEnabled
    public static SObject fetchParentRecord(String recordId) {
        String objName = getObjectName(recordId);
        if(objName == 'Contact')
        {
            return [
                SELECT Id, Name
                FROM Contact
                WHERE Id =: recordId
                ORDER BY Name LIMIT 1
            ];
        }
        else
        {
            return [
                SELECT Id, Name
                FROM Account
                WHERE Id =: recordId
                ORDER BY Name LIMIT 1
            ];
        }
    }
}