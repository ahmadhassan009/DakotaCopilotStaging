import { LightningElement, api, wire } from 'lwc';
import getOrganizationId from '@salesforce/apex/CrmIntegrationController.getOrganizationId';
import CRMIntegeration from "@salesforce/resourceUrl/CRMIntegeration";
import FORM_5500_RECORDS_ACCESS__FIELD from '@salesforce/schema/User.Form_5500_Records_Access__c';
import USER_ID from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';

export default class AccountSubscribe extends LightningElement {
    @api recordId;
    @api recordType;
    @api url = CRMIntegeration + '/index.html';
    @api marginRight;
    hideIframe = 'hideButton';


    //DCI-259: Passing flag for form5500 record access
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [FORM_5500_RECORDS_ACCESS__FIELD]
    }) wireuser({
        error,
        data
    }) {
        if (error) {
           this.error = error ; 
        } else if (data && data.fields) {
            this.form5500recordAccess = data.fields.Form_5500_Records_Access__c.value;
        }
    }
    
    initCSSVariables() {
        let css = this.template.host.style;
        css.setProperty('--marginRight', this.marginRight);
    }

    connectedCallback() { 
        this.initCSSVariables();
        this._listenForMessage = this.listenForMessageAssignmentRulesGraph.bind(this);
        window.addEventListener("message", this._listenForMessage);
    }

    async listenForMessageAssignmentRulesGraph(msg) {
        const iFrame = this.template.querySelector('iframe');
        if(this.recordType === 'Contact') {
             iFrame.style.right = '-140px';
        }
        if (msg.data.key === 'dci-to-salesforce') {
            switch (msg.data.eventType) {
                case 'show-button':
                    this.hideIframe = 'showButton';
                    break;
                case 'dci-app-level':
                    iFrame.contentWindow.postMessage({
                        eventType: "navigation",
                        hash: '#/widget.subscribe-button',
                        key: "salesforce-to-dci",
                    }, "*");
                    break;
                case 'fetch-record-details':
                    iFrame.contentWindow.postMessage({
                        eventType: "sf-record-details",
                        recordId: this.recordId,// event type: sf-record-details
                        recordType: this.recordType,
                        key: 'salesforce-to-dci'
                    }, "*");
                    iFrame.contentWindow.postMessage({
                        eventType: "subscribe-widget",
                        orgId: await getOrganizationId(),//event type dci-app-level
                        form5500recordAccess: this.form5500recordAccess,
                        key: 'salesforce-to-dci'
                    }, "*");
                    break;
                case 'link-success':
                    iFrame.contentWindow.postMessage({
                        eventType: "link-success",
                        key: "salesforce-to-dci",
                    }, "*");
            }
        }
    }
}