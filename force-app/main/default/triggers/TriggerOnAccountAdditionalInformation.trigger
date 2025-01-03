trigger TriggerOnAccountAdditionalInformation on Account_Additional_Information__c (after insert) 
{
    TriggerOnAccountAdditionalInfoHandler handler = new TriggerOnAccountAdditionalInfoHandler(Trigger.new);
    
    if(Trigger.isAfter)
    {
        if(Trigger.IsInsert)
        {
            handler.afterInsert();
        }
    }
}