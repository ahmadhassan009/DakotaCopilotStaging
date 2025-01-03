public with sharing class TriggerOnContentDocumentLinkHandler {
    List<ContentDocumentLink> ContentDocumentList;
    
    public TriggerOnContentDocumentLinkHandler(List<ContentDocumentLink> ContentDocumentList)
    {
        this.ContentDocumentList = ContentDocumentList;
    }
    public void beforeInsert()
    {
        TriggerOnContentDocumentLinkService.shareVisibility(ContentDocumentList);
    }
    public void afterInsert()
    {
        TriggerOnContentDocumentLinkService.updateManagerPresentationAfterInsert(ContentDocumentList);
    }
}