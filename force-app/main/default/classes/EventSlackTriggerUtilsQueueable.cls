public class EventSlackTriggerUtilsQueueable implements Queueable, Database.AllowsCallouts {
    String payload;
    String endpoint;
    public EventSlackTriggerUtilsQueueable(String endpoint, String payload)
    {
        this.payload = payload;
        this.endpoint = endpoint;
    }
    
    public void execute(QueueableContext context) {
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('POST');
        request.setBody(payload);
       
        if (!Test.isRunningTest())
            (new Http()).send(request);       
    }
}