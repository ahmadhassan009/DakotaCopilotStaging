public class TriggerOnContentVersionHandler {
    List<ContentVersion> contentVersions = new List<ContentVersion>();
    public TriggerOnContentVersionHandler(List<ContentVersion> contentVersions) {
        this.contentVersions = contentVersions;
    }
    public void afterInsert()
    {
        TriggerOnContentVersionService.createPublicLinkForFile(contentVersions);
    }
}