import { LightningElement, api, wire, track } from 'lwc';
import cometdlwc from "@salesforce/resourceUrl/cometd";
import getSessionId from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getSessionId';
import getAuthSessionId from  '@salesforce/apex/MFAController.getAuthSessionId';
import { loadScript } from "lightning/platformResourceLoader";
export default class ConcurrentSessionsPopup extends LightningElement {
    subscription = {};
    CHANNEL_NAME = '/event/Concurrent_Login_Event__e';
    libInitialized = false;
    @track sessionId;
    @track error;
    userAuthSessionId = '';
    showLogoutPopup = false
    messageTextPart1 = 'Another user is currently logged in to this account on another device. ';
    messageTextLink = 'Click here';
    messageTextPart2 = '  to login.';

    connectedCallback() {
        
        getAuthSessionId().then(response => {
            if(response) {
                this.userAuthSessionId = response;
            }
        }).catch(error => {
            console.log('error in getting user Auth Session Id', error);
        });
    }

    @wire(getSessionId)
    wiredSessionId({ error, data }) {
        if (data) {
            this.sessionId = data;
            this.error = undefined;
            loadScript(this, cometdlwc)
            .then(() => {
                this.initializecometd();
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
                // Successfully connected to the server.
                // Now it is possible to subscribe or send messages
                cometdlib.subscribe(outerThis.CHANNEL_NAME, function (message) {
                        outerThis.showPopup(message);
            });
            } else {
                /// Cannot handshake with the server, alert user.
                console.error('Error in handshaking: ' + JSON.stringify(status));
            }
        });
    }

    showPopup(message) {
        if(this.userAuthSessionId == message.data.payload.Session_Id__c) {
            window.postMessage({
                key: "concurrentSession"
              }, '*');
            if(document?.body?.style) document.body.style.overflow = 'hidden';//freezes the background scroll
            this.showLogoutPopup = true;
        }
    }
}