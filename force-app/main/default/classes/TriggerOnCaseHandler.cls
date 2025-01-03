public class TriggerOnCaseHandler {
    List<Case> newCases;
    Map<Id,Case> oldCases;
    
    public TriggerOnCaseHandler( List<Case> newValues, Map<Id,Case> oldValues) {
        this.newCases = newValues;
        this.oldCases = oldValues;
    }

    public void beforeInsert()
    {
        TriggerOnCaseService.setContactSearchAssetClasses(newCases,oldCases);
        TriggerOnCaseService.setPhoneAndBillingAddress(newCases,oldCases);
    }

    public void afterInsert()
    {
        TriggerOnCaseService.sendEmailtoApprovers(newCases);
    }

    public void beforeUpdate()
    {
        TriggerOnCaseService.setContactSearchAssetClasses(newCases,oldCases);
    }
}