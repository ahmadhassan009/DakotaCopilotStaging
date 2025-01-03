import { LightningElement, api } from 'lwc';
import getOrganizationId from '@salesforce/apex/CrmIntegrationController.getOrganizationId';
import getAccountName from '@salesforce/apex/CrmIntegrationController.getAccountName';
import getContactName from '@salesforce/apex/CrmIntegrationController.getContactName';
import CRMIntegeration from "@salesforce/resourceUrl/CRMIntegeration";
export default class RecordLinkPopup extends LightningElement {
    @api recordId;
    @api recordType;
    recordName;
    @api url = CRMIntegeration + '/index.html';


    connectedCallback() {
        if(this.recordType == 'Account') {
            getAccountName({recordId: this.recordId}).then(resp=> {
                if(resp) this.recordName = resp;
                const iFrame = this.template.querySelector('iframe');
                iFrame.contentWindow.postMessage({
                    eventType: "sf-record-details",
                    recordId: this.recordId,// event type: sf-record-details
                    recordType: this.recordType,
                    recordName: this.recordName,
                    key: 'salesforce-to-dci'
                }, "*");
            }).catch(error => {
                console.log('error in retreieving account name', error);
            });
        } else if (this.recordType == 'Contact') {
            getContactName({recordId: this.recordId}).then(resp => {
                if(resp) this.recordName = resp;
                const iFrame = this.template.querySelector('iframe');
                iFrame.contentWindow.postMessage({
                        eventType: "sf-record-details",
                        recordId: this.recordId,// event type: sf-record-details
                        recordType: this.recordType,
                        recordName: this.recordName,
                        key: 'salesforce-to-dci'
                    }, "*");
            }).catch(error => {
                console.log('error in retrieving contact name', error);
            });
        }
        this._listenForMessage = this.listenForMessageAssignmentRulesGraph.bind(this);
        window.addEventListener("message", this._listenForMessage);
    }

    async listenForMessageAssignmentRulesGraph(msg) {
        if (msg.data.key === 'dci-to-salesforce') {
            const iFrame = this.template.querySelector('iframe');
            switch (msg.data.eventType) {
                case 'dci-app-level':
                    iFrame.contentWindow.postMessage({
                        eventType: "navigation",
                        hash: '#/widget.link-popup',
                        key: "salesforce-to-dci",
                    }, "*");
                    break;
                case 'fetch-record-details-for-popup':
                    iFrame.contentWindow.postMessage({
                        eventType: "sf-record-details",
                        recordId: this.recordId,// event type: sf-record-details
                        recordType: this.recordType,
                        recordName: this.recordName,
                        key: 'salesforce-to-dci'
                    }, "*");
                    iFrame.contentWindow.postMessage({
                        eventType: "link-popup-widget",
                        orgId: await getOrganizationId(),//event type dci-app-level
                        key: 'salesforce-to-dci'
                    }, "*");
                    break;
                case 'toggle-link-popup':
                    const div = this.template.querySelector('div');
                    div.style.display = msg.data.display;
                    break;
            }
        }
    }
}