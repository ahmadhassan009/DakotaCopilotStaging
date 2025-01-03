import { LightningElement, api } from 'lwc';
import getRecordType from '@salesforce/apex/DakotaContentDetailsController.getRecordType';
import lastOddChildCss from '@salesforce/resourceUrl/dakotaContentDetailsAndVideoCss';
import { loadStyle } from 'lightning/platformResourceLoader';
const DAKOTACONTENTFIELDS = ['Name','Type__c', 'Presentation_Recording__c', 'Date__c', 'Description__c'];
const DAKOTACONTENTLINEFIELDS = ['Name', 'Dakota_Live_Call__c', 'Date__c', 'Type__c', 'Account_Linked__c', 'Metro_Area_Linked__c', 'Contact_Linked__c', 'Description__c'];

export default class DakotaContentDetailsAndVideo extends LightningElement {
    @api recordId;
    @api objectApiName;
    fields = DAKOTACONTENTFIELDS;

    async connectedCallback() {
        //DSC-591: Resolved CSS issue on page layout when last row has odd field
        Promise.all([
            loadStyle(this, lastOddChildCss)
        ]);
        getRecordType({
            recordId : this.recordId
        }).then(returnedDakotaContent => {
            if(returnedDakotaContent != null)
            {
                if(returnedDakotaContent.RecordType.Name == 'Content') {
                    this.fields = DAKOTACONTENTFIELDS
                } else {
                    this.fields = DAKOTACONTENTLINEFIELDS;
                }
            }
        }).catch(error => {
            console.log("Error:" , error);
        });
    }
}