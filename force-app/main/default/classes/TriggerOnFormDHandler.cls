public with sharing class TriggerOnFormDHandler {
    
    List<Form_D_Offering__c > newFormDList;   
    Map<Id, Form_D_Offering__c> oldFormDMap; 
    private static boolean runOnce = true;

    public TriggerOnFormDHandler(List<Form_D_Offering__c > newFormDList,Map<Id, Form_D_Offering__c> oldFormDMap) {
        this.newFormDList = newFormDList;
        this.oldFormDMap = oldFormDMap;
    }

    public void afterCreate() {
        TriggerOnFormDService.formdMpVeifiedCheckbox(this.newFormDList);
    }

    public void afterUpdate() {
        TriggerOnFormDService.formdMpVeifiedCheckbox(this.newFormDList);
        TriggerOnFormDService.updateRelatedRecordsMpVerifiedCheck(this.newFormDList,this.oldFormDMap);
    }
    public void afterDelete() {
        TriggerOnFormDService.updateRelatedRecordsMpVerifiedCheck(this.newFormDList,this.oldFormDMap);
    }

    public static boolean runOnce() {
        if(runOnce) {
            runOnce = false;
            return true;
        } else {
            return false;
        }
    }
}