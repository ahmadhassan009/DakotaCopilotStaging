public class TriggerOnContentDocumentLinkService {
    public static void shareVisibility(List<ContentDocumentLink> ContentDocumentList) 
    {
        for(ContentDocumentLink cdLink: ContentDocumentList) 
        {
            if(cdLink.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Manager_Presentation__c'
               || cdLink.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Corporate_Pension_Holding__c'
               || cdLink.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Annual_Reports_and_Holdings_Data__c'
               || cdLink.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Marketplace_Searches__c')
            {
                cdLink.Visibility='AllUsers';
            }
        }
    }
    
    public static void updateManagerPresentationAfterInsert(List<ContentDocumentLink> ContentDocumentList) 
    {
        List<Id> mpIds = new List<Id>();
        for(ContentDocumentLink l: ContentDocumentList) 
        {
            if(l.LinkedEntityId.getSObjectType().getDescribe().getName() == 'Manager_Presentation__c')
                mpIds.add(l.LinkedEntityId);
        }
        if(mpIds!=null && mpIds.size()>0)
        {
            List<Manager_Presentation__c> ManagerPresentationRecs= [Select Id,Type__c FROM Manager_Presentation__c WHERE Id IN: mpIds];
            for(Manager_Presentation__c mpRec: ManagerPresentationRecs)
            {
                mpRec.Type__c = 'File Attached';
            }
            if(ManagerPresentationRecs != null && ManagerPresentationRecs.size() > 0) {
                update ManagerPresentationRecs;
            }
        }
    }
}