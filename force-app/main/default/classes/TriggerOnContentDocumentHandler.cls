public class TriggerOnContentDocumentHandler {
    List<ContentDocument> contentDocuments = new List<ContentDocument>();
    public TriggerOnContentDocumentHandler(List<ContentDocument> contentDocuments) {
        this.contentDocuments = contentDocuments;
    }
    public void beforeDelete()
    {
        TriggerOnContentDocumentService.updateManagerPresentation(contentDocuments);
    }
}