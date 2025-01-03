import { LightningElement, api } from 'lwc';

export default class MetroAreaDetailsAndQuickLink extends LightningElement {
    @api recordId;
    @api objectApiName;
    fields = ['Name','Description__c'];
    renderData = false;

    hanldeProgressValue(event)
    {
        this.renderData = event.detail;
    }
    
}