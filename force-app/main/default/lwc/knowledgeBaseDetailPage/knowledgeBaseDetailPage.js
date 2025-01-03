import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

export default class KnowledgeBaseDetailPage extends LightningElement {
    @api recordId;
    isLoading = true;
    fieldsToShowDynamically = ['Knowledge_Base__c.Name', 'Knowledge_Base__c.Type__c', 'Knowledge_Base__c.Video_Document_Link__c'];
    @wire(getRecord, { recordId: '$recordId', fields: '$fieldsToShowDynamically' })
    async wiredRecord({ data }) {
        if (data) {
            setInterval(() => {
                this.isLoading = false;
            }, 2000);
        }
    }
}