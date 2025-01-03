import { LightningElement, api, wire } from 'lwc';
import CRMIntegeration from "@salesforce/resourceUrl/CRMIntegeration";
import getOrganizationId from '@salesforce/apex/CrmIntegrationController.getOrganizationId';
import getCurrentUserTimeZone from '@salesforce/apex/CrmIntegrationController.getCurrentUserTimeZone';
import getSessionId from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getSessionId';
import checkDataIntegerationsAccess from '@salesforce/apex/CrmIntegrationController.checkDataIntegerationsAccess';
import FORM_5500_RECORDS_ACCESS__FIELD from '@salesforce/schema/User.Form_5500_Records_Access__c';
import USER_ID from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import cometdlwc from "@salesforce/resourceUrl/cometd";
import { loadScript } from "lightning/platformResourceLoader";

export default class CrmIntegeration extends LightningElement {
    @api url = CRMIntegeration + '/index.html';

    subscription = {};
    CHANNEL_NAME = '/event/Form5500_Permission_Update__e';
    libInitialized = false;

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

    @wire(getSessionId)
    wiredSessionId({ error, data }) {
        if (data) {
            this.sessionId = data;
            this.error = undefined;
            loadScript(this, cometdlwc)
            .then(() => {
                //this.initializecometd();
            });
        } else if (error) {
            console.log(error);
            this.error = error;
            this.sessionId = undefined;
        }
    }

    initializecometd() {
        var outerThis = this;
        if (this.libInitialized) {
            return;
        }
        this.libInitialized = true;

        //inintializing cometD object/class
        var cometdlib = new window.org.cometd.CometD();
                
        //Calling configure method of cometD class, to setup authentication which will be used in handshaking
        cometdlib.configure({
            url: window.location.protocol + '//' + window.location.hostname + '/cometd/47.0/',
            requestHeaders: { Authorization: 'OAuth ' + this.sessionId},
            appendMessageTypeToURL : false,
            logLevel: 'debug'
        });

        cometdlib.websocketEnabled = false;

        cometdlib.handshake(function(status) {
            if (status.successful) {
                console.log('-------------------PLATEFORM MESSAGE LISTENING');
                // Successfully connected to the server.
                // Now it is possible to subscribe or send messages
                cometdlib.subscribe(outerThis.CHANNEL_NAME, function (message) {
                        outerThis.dispatchForm5500PermissionEvent(message);
            });
            } else {
                /// Cannot handshake with the server, alert user.
                console.error('Error in handshaking: ' + JSON.stringify(status));
            }
        });
    }

    dispatchForm5500PermissionEvent(message) {
        console.log('-------------------PLATEFORM MESSAGE RECIEVED', message, message.data.payload);
        if(message && message.data && message.data.payload && message.data.payload.communityUserId__c == USER_ID) {
            const iFrame = this.template.querySelector('iframe');
            iFrame.contentWindow.postMessage(
            {
                eventType: "form5500-permission-update",
                form5500recordAccess: message.data.payload.form5500Permission__c,
                key: 'salesforce-to-dci'
            },
            "*");
        }
    }

    async connectedCallback() {
        window.onhashchange = this.onHashChange;
        this._listenForMessage = this.listenForMessageAssignmentRulesGraph.bind(this);
        window.addEventListener("message", this._listenForMessage);
    }

    onHashChange = () => {
        const iFrame = this.template.querySelector('iframe');
        iFrame.contentWindow.postMessage(
          {
            eventType: "navigation",
            hash: window.location.hash,
            key: "salesforce-to-dci",
          },
          "*"
        );
      };

    async listenForMessageAssignmentRulesGraph(msg) {
        if(msg.data.key === 'dci-to-salesforce'){
            if(msg.data.eventType === 'navigation') {
                window.location.hash = msg.data.hash || window.location.hash;
            } else {
                this.onHashChange();
                const iFrame = this.template.querySelector('iframe');
                const orgId = await getOrganizationId();
                const isDataIntegerationsEnabled = await checkDataIntegerationsAccess({orgId: orgId});
                iFrame.contentWindow.postMessage({ 
                    eventType: "dci-app-level",
                    orgId: orgId,
                    form5500recordAccess: this.form5500recordAccess,
                    timeZone: await getCurrentUserTimeZone(),
                    isDataIntegerationsEnabled: isDataIntegerationsEnabled,
                    key: 'salesforce-to-dci'
                },"*");
            }
        }
    }

    disconnectedCallback() {
        window.removeEventListener("message", this._listenForMessage);
    }
    
}