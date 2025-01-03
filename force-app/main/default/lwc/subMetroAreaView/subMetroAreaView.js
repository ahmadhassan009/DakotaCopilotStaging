import { LightningElement, api } from 'lwc';
import getSubMetroAreaRecords from '@salesforce/apex/AccountSubMetroAreaController.getSubMetroAreaRecords';
import activeCommunities from '@salesforce/label/c.active_communities';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';

export default class SubMetroAreaView extends LightningElement {
    @api recordId;
    relatedSubMetroAreaRecords = '</br>';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    isCommunity = false;
    isSalesforceInstance = false;
    showComponent = false;
    CHANNEL_NAME = '/event/refreshComponents__e';
    totalRecords = 0;

    connectedCallback() {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            this.subscription = response;
        });
        onError(error => {
            console.error('Received error from server SF: ', error);
        });
        this.checkIsCommunityInstance();
        // Get related sub metro area records for account
        getSubMetroAreaRecords({
            recordId: this.recordId,
            isCommunity: this.isCommunity
        }).then(relatedSubMetroAreas => {
            if (relatedSubMetroAreas) {
                var tempSubMetroAreasList = '';
                this.totalRecords = relatedSubMetroAreas.length;
                for (var i = 0; i < relatedSubMetroAreas.length; i++) {
                    let tempRecord = Object.assign({}, relatedSubMetroAreas[i]); //cloning object 
                    if (tempRecord.Metro_Area__c != undefined) {
                        if (this.isCommunity == true) {
                            tempSubMetroAreasList += "<a style= "+ '"color: rgb(53, 88, 214);"'+ "href=" + "/" + this.communityName + "/s/detail/" + tempRecord.Metro_Area__c + ' target="_self">' + tempRecord.Metro_Area__r.Name + '</a>';
                        }
                        else {
                            tempSubMetroAreasList += "<a href=" + "/" + tempRecord.Metro_Area__c + ' target="_self">' + tempRecord.Metro_Area__r.Name + '</a>';
                        }
                        if (i != relatedSubMetroAreas.length - 1) {
                            tempSubMetroAreasList += '; ';
                        }
                    }
                }
                if (tempSubMetroAreasList != '') {
                    this.relatedSubMetroAreaRecords = tempSubMetroAreasList;
                    this.showComponent = true;
                }
            }
        }).catch(error => {
            this.showComponent = true;
            console.log('Error -> ' + error);
        });
    }
    handleEvent = event => {
        this.isLoading = true;
        this.newbuttonPressed = false;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.refreshTable();
    }
    refreshTable(event) {
        this.connectedCallback();
    }
    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
    }
}