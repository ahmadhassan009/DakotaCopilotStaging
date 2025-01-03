public class TriggerOnClientBaseHelper {
    List<Client_Base__c> clientBaseList;
    Map<ID, Client_Base__c> oldclientBaseMap;
    public TriggerOnClientBaseHelper (List<Client_Base__c> clientBaseList, Map<ID, Client_Base__c> oldclientBaseMap)
    {
        this.clientBaseList = clientBaseList;
        this.oldclientBaseMap = oldclientBaseMap;
    }
    public void beforeInsert()
    {
        TriggerOnClientBaseService.setClientBaseName(this.clientBaseList,this.oldclientBaseMap);
        TriggerOnClientBaseService.refreshClientBasePanels(this.clientBaseList);
    }
    public void beforeUpdate()
    {
        TriggerOnClientBaseService.setClientBaseName(this.clientBaseList,this.oldclientBaseMap);
        TriggerOnClientBaseService.refreshClientBasePanels(this.clientBaseList);
    }
    
    public void afterInsert()
    {
        TriggerOnClientBaseService.updateNumberofQPsInParentAccount(this.clientBaseList,this.oldclientBaseMap);
    }
    
    public void afterUpdate()
    {
        TriggerOnClientBaseService.updateNumberofQPsInParentAccount(this.clientBaseList,this.oldclientBaseMap);
    }
    
    public void afterDelete()
    {
        TriggerOnClientBaseService.updateNumberofQPsInParentAccount(this.clientBaseList,this.oldclientBaseMap);
    }
}