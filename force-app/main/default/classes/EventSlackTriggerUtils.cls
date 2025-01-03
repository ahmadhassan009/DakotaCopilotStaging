public class EventSlackTriggerUtils {
    
    // JSON stringify Event SObject
    // @param action - insert/update/delete
    // @param event - affected Event (sobject)
    public static String serializeEvent(String action, event Event) {
        RecordType recordType = [SELECT Name FROM RecordType WHERE Id = :event.RecordTypeId];
        
        JSONGenerator gen = JSON.createGenerator(true);
        gen.writeStartObject();
        gen.writeStringField('Action', action);
        gen.writeStringField('Event', JSON.serialize(event));
        gen.writeStringField('RecordTypeName', recordType.Name);
        gen.writeEndObject();
        return gen.getAsString();
    }
}