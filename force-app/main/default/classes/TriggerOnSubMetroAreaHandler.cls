public with sharing class TriggerOnSubMetroAreaHandler {
    List<Sub_Metro_Area__c> subMetroAreaList;
    List<Sub_Metro_Area__c> subMetroAreaOldList;
    Map<ID, Sub_Metro_Area__c> oldSubMetroAreaMap;
    public TriggerOnSubMetroAreaHandler(List<Sub_Metro_Area__c> subMetroAreaNewList, List<Sub_Metro_Area__c> subMetroAreaOldList, Map<ID, Sub_Metro_Area__c> oldSubMetroAreaMap)
    {
        this.subMetroAreaList = subMetroAreaNewList;
        this.subMetroAreaOldList = subMetroAreaOldList;
        this.oldSubMetroAreaMap = oldSubMetroAreaMap;
    }
    public void beforeInsert()
    {
        TriggerOnSubMetroAreaService.preventDuplicationOfSubMetroAreas(this.subMetroAreaList,this.oldSubMetroAreaMap);
        TriggerOnSubMetroAreaService.setSubMetroAreaName(this.subMetroAreaList,this.oldSubMetroAreaMap);
        TriggerOnSubMetroAreaService.refreshSubMetroAreaPanels(this.subMetroAreaList);
    }
    public void beforeUpdate()
    {
        TriggerOnSubMetroAreaService.preventDuplicationOfSubMetroAreas(this.subMetroAreaList,this.oldSubMetroAreaMap);
        TriggerOnSubMetroAreaService.setSubMetroAreaName(this.subMetroAreaList,this.oldSubMetroAreaMap);
        TriggerOnSubMetroAreaService.refreshSubMetroAreaPanels(this.subMetroAreaList);
    }
    public void afterInsert()
    {
        TriggerOnSubMetroAreaService.updateNumberOfAccountsInMetroArea(this.subMetroAreaList, this.subMetroAreaOldList, this.oldSubMetroAreaMap);
    }
    public void afterUpdate()
    {
        TriggerOnSubMetroAreaService.updateNumberOfAccountsInMetroArea(this.subMetroAreaList, this.subMetroAreaOldList, this.oldSubMetroAreaMap);
    }
    public void afterDelete()
    {
        TriggerOnSubMetroAreaService.updateNumberOfAccountsInMetroArea(this.subMetroAreaList, this.subMetroAreaOldList, this.oldSubMetroAreaMap);
    }
}