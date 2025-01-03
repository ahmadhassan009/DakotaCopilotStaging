public class QueueableClassFormAdvAndItsChilds implements Queueable {
    private List<Form_ADV__c> parentRecords;
    private List<sObject> childRecords;
    private List<Schedule_D_Custodian__c> grandChildRecords;
    

    public QueueableClassFormAdvAndItsChilds(List<Form_ADV__c> parentRecords,List<sObject> childRecords,List<Schedule_D_Custodian__c> grandChildRecords) {
        this.parentRecords = parentRecords;
        this.childRecords = childRecords;
        this.grandChildRecords = grandChildRecords;
    }
    public void execute(QueueableContext context) {

        Map<String, Id> crdToIdMap = new Map<String, Id>();

        try {
            if(parentRecords.size()>0)
            {
                update parentRecords;
            }
            if(childRecords.size()>0)
            {
                insert childRecords;

                if(grandChildRecords.size()>0)
                {
                    for(sObject record : childRecords)
                    {
                        Form_ADV_Schedule_D__c parent=(Form_ADV_Schedule_D__c)record;
                        crdToIdMap.put(string.valueOf(parent.CRD_Number__c),parent.Id);
                    }
                    for(Schedule_D_Custodian__c gcRecord : grandChildRecords)
                    {
                        gcRecord.Form_ADV_Schedule_D__c = crdToIdMap.get(gcRecord.CRD_Number__c);
                    }
                    insert grandChildRecords;
                }
            }
            
        } catch(Exception ex) {
            System.debug(ex.getMessage());
        } 
    }
}