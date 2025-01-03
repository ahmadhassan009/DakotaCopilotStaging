trigger TriggerOnForm5500AdditionalInformation on Form_5500_Additional_Information__c (after delete, before update) {

    Form5500AdditionalInformationHandler handler = new Form5500AdditionalInformationHandler(Trigger.new, Trigger.oldMap);
    if (Trigger.isAfter)
    {
        if(Trigger.isDelete)
        {
            handler.afterDelete();
        }
    } else if (Trigger.isBefore) {
        if(Trigger.isUpdate) {
            handler.beforeUpdate();
        }
    }

}