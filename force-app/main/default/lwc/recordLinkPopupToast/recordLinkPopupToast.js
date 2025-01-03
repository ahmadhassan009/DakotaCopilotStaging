import { LightningElement, api } from 'lwc';
import CRMIntegeration from "@salesforce/resourceUrl/CRMIntegeration";

export default class RecordLinkPopupToast extends LightningElement {
    @api recordId;
    @api recordType;
    recordName;
    @api url = CRMIntegeration + '/index.html';

    connectedCallback() {
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
                        hash: '#/widget.alert-detail',
                        key: "salesforce-to-dci",
                    }, "*");
                    break;
                case "record-link-popup-toast-message":
                    iFrame.contentWindow.postMessage({
                        key: "salesforce-to-dci",
                        eventType:"record-link-popup-toast-message",
                        data:msg.data.data,
                    }, "*")
                    break;
                case "toggle-toast_iframe":
                    const div = this.template.querySelector('div');
                    div.style.display = msg.data.display;
                    break;
            }
        }
    }
}