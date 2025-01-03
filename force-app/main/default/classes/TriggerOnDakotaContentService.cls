public class TriggerOnDakotaContentService {
    
    public static void refreshDakotaContentPanels(List<Dakota_Content__c> newDakotaContent)
    {
        List<refreshComponents__e> refreshRecordEvents = new List<refreshComponents__e>();
        for (Dakota_Content__c DakotaContent : newDakotaContent) {
            refreshRecordEvents.add(new refreshComponents__e(
                recordUsed__c = DakotaContent.Metro_Area_Linked__r.Id,
                UserUsed__c = UserInfo.getUserId(),
                userSession__c=UserInfo.getSessionId()
            ));
        }
        EventBus.publish(refreshRecordEvents);
    }

    public static void updateMetroAreaReviewHighlight(List<Dakota_Content__c> newDakotaContentList, Map<Id, Dakota_Content__c> oldDakotaContentMap)
    {
        List<Id> parentMetroAreasIdsToUpdate = new List<Id>();
        List<Metro_Area__c> metroAreaRecords;
        if(Trigger.IsInsert || Trigger.IsUpdate)
        { 
            for(Dakota_Content__c dkContent:newDakotaContentList)
             {
                if(dkContent.Metro_Area_Linked__c !=null && dkContent.Type__c == 'Metro Area Roadmap' && 
                    (Trigger.IsInsert || Trigger.IsUpdate && ( dkContent.Date__c !=oldDakotaContentMap.get(dkContent.Id).Date__c || 
                    dkContent.Presentation_Recording_url__c != oldDakotaContentMap.get(dkContent.Id).Presentation_Recording_url__c)))
                {
                    
                    parentMetroAreasIdsToUpdate.add(dkContent.Metro_Area_Linked__c);
                    
                }
            }
            
            metroAreaRecords =[Select Id, Metro_Area_Review_Highlight__c,
                                               (Select Id, Date__c,Presentation_Recording_url__c,Metro_Area_Linked__c 
                                                From Dakota_Content__r where Presentation_Recording_url__c!=null AND Type__c = 'Metro Area Roadmap'
                                                Order by Date__c desc NULLS LAST Limit 1)
                                               from Metro_Area__c where Id IN :parentMetroAreasIdsToUpdate];
        }
       
        if(Trigger.IsDelete)
        {            
            for(Dakota_Content__c dkContent:oldDakotaContentMap.values())
            {                                   
                if(dkContent.Metro_Area_Linked__c !=null && dkContent.Type__c == 'Metro Area Roadmap' )
                {
                    parentMetroAreasIdsToUpdate.add(dkContent.Metro_Area_Linked__c);                   
                }
                
            }
            metroAreaRecords =[Select Id, Metro_Area_Review_Highlight__c,
                                               (Select Id, Date__c,Presentation_Recording_url__c,Metro_Area_Linked__c 
                                                From Dakota_Content__r where Presentation_Recording_url__c!=null AND Type__c = 'Metro Area Roadmap' AND ID Not IN :oldDakotaContentMap.keySet()
                                                Order by Date__c desc NULLS LAST Limit 1)
                                               from Metro_Area__c where Id IN :parentMetroAreasIdsToUpdate];
        }
        List<Metro_Area__c> metroAreasToBeUpdated = new List<Metro_Area__c>();
        
        for(Metro_Area__c ma : metroAreaRecords)
        {
            if(ma.Dakota_Content__r.size()>0 && ma.Metro_Area_Review_Highlight__c != ma.Dakota_Content__r[0].Presentation_Recording_url__c)
            {
                ma.Metro_Area_Review_Highlight__c = ma.Dakota_Content__r[0].Presentation_Recording_url__c;
                metroAreasToBeUpdated.add(ma);
            }
            else if(ma.Dakota_Content__r.size()<1 && ma.Metro_Area_Review_Highlight__c != null)
            {                                            
                ma.Metro_Area_Review_Highlight__c = null;
                metroAreasToBeUpdated.add(ma);
            }
        }        
        update metroAreasToBeUpdated;
    }
    
    public static void populateContactAccountField(List<Dakota_Content__c> newDakotaContentList, Map<Id, Dakota_Content__c> oldDakotaContentMap)
    {
        Id contentLineRecordTypeId = Schema.SObjectType.Dakota_Content__c.getRecordTypeInfosByDeveloperName().get('Content_Lines').getRecordTypeId();
		List<Dakota_Content__c> dcToProcess = new List<Dakota_Content__c>();
        List<Id> contactIds = new List<Id>();
        
        for(Dakota_Content__c dkContent:newDakotaContentList)
        {
            if(dkContent.RecordTypeId==contentLineRecordTypeId && dkContent.Contact_Linked__c!=null &&
               (Trigger.IsInsert || (oldDakotaContentMap != null && (dkContent.Contact_Linked__c != oldDakotaContentMap.get(dkContent.Id).Contact_Linked__c))))
            {
                contactIds.add(dkContent.Contact_Linked__c);
                dcToProcess.add(dkContent);
            }
        }
        
        Map<Id, Contact> contactList = new Map<Id, Contact>([Select Id, AccountId from Contact where Id=:contactIds]);
        
        for(Dakota_Content__c dkContent:dcToProcess)
        {
            if(contactList.containsKey(dkContent.Contact_Linked__c))
            {
                dkContent.Account_Linked__c = contactList.get(dkContent.Contact_Linked__c).AccountId;
            }
        }
    }

    /**
     * DSC-591: Function auto-populates metro area field from Contact or Account based on type
     */
    public static void populateMetroAreaField(List<Dakota_Content__c> newDakotaContentList, Map<Id, Dakota_Content__c> oldDakotaContentMap)
    {
        Id contentLineRecordTypeId = Schema.SObjectType.Dakota_Content__c.getRecordTypeInfosByDeveloperName().get('Content_Lines').getRecordTypeId();
		List<Dakota_Content__c> dcToProcess = new List<Dakota_Content__c>();
        List<Id> contactIds = new List<Id>();
        List<Id> accountIds = new List<Id>();
        
        for(Dakota_Content__c dkContent:newDakotaContentList)
        {
            // only for DC records which are of content lines record type
            if(dkContent.RecordTypeId==contentLineRecordTypeId)
            {
                //if type is Allocator Interview, we populate metro Area from Contact, so we store Id of Contact to query metro area
                if(dkContent.Type__c == 'Allocator Interview' && dkContent.Contact_Linked__c!=null && (Trigger.IsInsert || (oldDakotaContentMap != null && (dkContent.Contact_Linked__c != oldDakotaContentMap.get(dkContent.Id).Contact_Linked__c || dkContent.Type__c != oldDakotaContentMap.get(dkContent.Id).Type__c)))) {
                    contactIds.add(dkContent.Contact_Linked__c);
                    dcToProcess.add(dkContent);
                //if type is Key Account, we populate metro Area from Account, so we store Id of Account to query metro area
                } else if(dkContent.Type__c == 'Key Account' && dkContent.Account_Linked__c!=null && (Trigger.IsInsert || (oldDakotaContentMap != null && (dkContent.Account_Linked__c != oldDakotaContentMap.get(dkContent.Id).Account_Linked__c || dkContent.Type__c != oldDakotaContentMap.get(dkContent.Id).Type__c )))) { 
                    accountIds.add(dkContent.Account_Linked__c);
                    dcToProcess.add(dkContent);
                }
                
            }
            
        }
        
        Map<Id, Contact> contactList = new Map<Id, Contact>([Select Id, AccountId, Metro_Area__c from Contact where Id=:contactIds]);
        Map<Id, Account> accountList = new Map<Id, Account>([Select Id, MetroArea__c from Account where Id=:accountIds]);
        
        for(Dakota_Content__c dkContent:dcToProcess)
        {
            //if type is Allocator Interview, we populate metro Area from Contact
            if(dkContent.Type__c == 'Allocator Interview' && contactList.containsKey(dkContent.Contact_Linked__c)) {
                dkContent.Metro_Area_Linked__c = contactList.get(dkContent.Contact_Linked__c).Metro_Area__c;
             //if type is Key Account, we populate metro Area from Account
            } else if(dkContent.Type__c == 'Key Account' && accountList.containsKey(dkContent.Account_Linked__c)) { 
                dkContent.Metro_Area_Linked__c = accountList.get(dkContent.Account_Linked__c).MetroArea__c;
            }
        }
    }
    
    public static void setDakotaContentLinesName(List<Dakota_Content__c> newDakotaContentList, Map<Id, Dakota_Content__c> oldDakotaContentMap)
    {
        Set<Id> accountIds = new Set<Id>();
        Set<Id> contactIds = new Set<Id>();
        Set<Id> metroAreaIds = new Set<Id>();
        List<Dakota_Content__c> dakotaContentToBeProcessed = new List<Dakota_Content__c>();
        Id contentLineRecordTypeId = Schema.SObjectType.Dakota_Content__c.getRecordTypeInfosByDeveloperName().get('Content_Lines').getRecordTypeId();

        for(Dakota_Content__c dkContent:newDakotaContentList)
        {
            if(dkContent.RecordTypeId==contentLineRecordTypeId && (Trigger.IsInsert || (oldDakotaContentMap != null && (dkContent.Account_Linked__c != oldDakotaContentMap.get(dkContent.Id).Account_Linked__c || 
                                                                         dkContent.Contact_Linked__c != oldDakotaContentMap.get(dkContent.Id).Contact_Linked__c || 
                                                                         dkContent.Metro_Area_Linked__c != oldDakotaContentMap.get(dkContent.Id).Metro_Area_Linked__c))))
            {
                dakotaContentToBeProcessed.add(dkContent);
                if(dkContent.Contact_Linked__c != null)
                {
                    contactIds.add(dkContent.Contact_Linked__c);
                }
                else if(dkContent.Account_Linked__c != null)
                {
                    accountIds.add(dkContent.Account_Linked__c);
                }
                else if(dkContent.Metro_Area_Linked__c != null)
                {
                    metroAreaIds.add(dkContent.Metro_Area_Linked__c);
                }
            }
        }
        
        Map<Id,Account> accountMap = new Map<Id,Account>([Select Id,Name from Account where Id In: accountIds]);
        Map<Id,Contact> contactMap = new Map<Id,Contact>([Select Id,Name,Title,Account.Name from Contact where Id In: contactIds]);
        Map<Id,Metro_Area__c> metroAreaMap = new Map<Id,Metro_Area__c>([Select Id,Name from Metro_Area__c where Id In: metroAreaIds]);
        
        for(Dakota_Content__c dkContent:dakotaContentToBeProcessed)
        {
            if(dkContent.Contact_Linked__c != null && contactMap.containsKey(dkContent.Contact_Linked__c)) 
            {
                Contact linkedContact = contactMap.get(dkContent.Contact_Linked__c);
                dkContent.Name = linkedContact.Name + ', '+ (linkedContact.Title != null ? linkedContact.Title+', ' : '') +linkedContact.Account.Name;
                if(dkContent.Name.length()>80) {
                    dkContent.Name = linkedContact.Name + ', '+ (linkedContact.Title != null ? linkedContact.Title : '');
                    if(dkContent.Name.length()>80){
                        String temp = dkContent.Name;
                        dkContent.Name = temp.substring(0,80);
                    }
                }
            }
            else if(dkContent.Account_Linked__c != null && accountMap.containsKey(dkContent.Account_Linked__c)) 
            {
                dkContent.Name = accountMap.get(dkContent.Account_Linked__c).Name;
            }
            else if(dkContent.Metro_Area_Linked__c != null && metroAreaMap.containsKey(dkContent.Metro_Area_Linked__c))
            {
                dkContent.Name = metroAreaMap.get(dkContent.Metro_Area_Linked__c).Name;
            }
        }
    }

    public static void updateCMSCollectionVisibility(List<Dakota_Content__c> newDakotaContentList, Map<Id, Dakota_Content__c> oldDakotaContentMap)
    {
        Boolean dateUpdated = false;
        Boolean alreadyVisibleRecordDeleted = false;
        Boolean newDakotaContentWithDate = false;
        if(Trigger.IsInsert)
        {
            for(Dakota_Content__c dkContent:newDakotaContentList)
            {
                if(dkContent.Date__c != null)
                {
                    newDakotaContentWithDate = true;
                }
            }
        }
        
        if(Trigger.IsUpdate)
        {
            for(Dakota_Content__c dkContent:newDakotaContentList)
            {
                if(dkContent.Date__c != oldDakotaContentMap.get(dkContent.Id).Date__c)
                {
                    dateUpdated = true;
                }
            }
        }
        
        if(Trigger.IsDelete)
        {
            for(Dakota_Content__c dkContent:oldDakotaContentMap.values())
            {
                if(dkContent.Visible_in_CMS_Collection__c == true)
                {
                    alreadyVisibleRecordDeleted = true;
                }
            }
        }
        
        if(newDakotaContentWithDate == true || dateUpdated == true || alreadyVisibleRecordDeleted == true)
        {
            List<Dakota_Content__c> alreadyVisibleDakotaContents = [Select Id,Name,Visible_in_CMS_Collection__c from Dakota_Content__c where Visible_in_CMS_Collection__c = true];
            for(Dakota_Content__c dkContent :alreadyVisibleDakotaContents)
            {
                dkContent.Visible_in_CMS_Collection__c = false;
            }
            update alreadyVisibleDakotaContents;
            

            List<Dakota_Content__c> dakotaContentsToBeShown = [Select Id,Name,Visible_in_CMS_Collection__c,Date__c from Dakota_Content__c order by Date__c desc NULLS LAST,CreatedDate desc Limit 4];
            for(Dakota_Content__c dkContent :dakotaContentsToBeShown)
            {
                dkContent.Visible_in_CMS_Collection__c = true;
            }
            update dakotaContentsToBeShown;
        }
    }
}