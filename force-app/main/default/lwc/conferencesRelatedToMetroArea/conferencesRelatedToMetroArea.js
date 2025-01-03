import { LightningElement, api, wire, track } from 'lwc';
import getMetroAreaName from '@salesforce/apex/RelatedConferenceController.getMetroAreaName';
import getRelatedConferencesToMetroArea from '@salesforce/apex/RelatedConferenceController.getRelatedConferencesToMetroArea';
import getAllRelatedConferencesRecords from '@salesforce/apex/RelatedConferenceController.getAllRelatedConferencesRecords';
import getRelatedConferenceCount from '@salesforce/apex/RelatedConferenceController.getRelatedConferenceCount';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import ConferenceInMetroAreaCSS from '@salesforce/resourceUrl/ConferenceInMetroAreaCSS';

import { NavigationMixin } from "lightning/navigation";

import { refreshApex } from '@salesforce/apex';
import { loadStyle } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';

import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import activeCommunities from '@salesforce/label/c.active_communities';

import CONFERENCE_NAME_FIELD from '@salesforce/schema/Conference__c.Name';
import STARTDATE_FIELD from '@salesforce/schema/Conference__c.Start_Date__c';
import SPEAKER_TYPE_FIELD from '@salesforce/schema/Conference__c.Speaker_Type__c';
import FORMAT_FIELD from '@salesforce/schema/Conference__c.Format__c';
import INVESTMENT_FOCUS_FIELD from '@salesforce/schema/Conference__c.Investment_Focus__c';

const COLUMNS = [
    { label: 'Conference Name', fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONFERENCE_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONFERENCE_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Start Date', fieldName: STARTDATE_FIELD.fieldApiName, type: 'date', typeAttributes: {day: "numeric",month: "numeric", year: "numeric"} },    
    { label: 'Investment Focus', fieldName: INVESTMENT_FOCUS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Speaker Type', fieldName: SPEAKER_TYPE_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Format', fieldName: FORMAT_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Registration Link', fieldName: 'registerationUrl', type: 'button', typeAttributes: { label: { fieldName: 'RegLink' }, name: "RegLinkCell", variant: "base", }, cellAttributes: { class: 'buttonHeight' } }
]

const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];
const noActions = [
    { label: 'No actions available', name: 'No actions available', disabled: true }
];

export default class ConferencesRelatedToMetroArea extends NavigationMixin(LightningElement)  {

    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';

    @api recordId;
    @api recordName;
    @track isLoading = false;
    newbuttonPressed = false;
    conferencesRelatedToMa;
    totalRelatedConferencesCount = 0;
    columns = COLUMNS;
    isCommunity;
    recordsExist = false;
    offset = 0;
    limit = 10;
    baseURL = '';
    tempAddAction = [];
    recordToDel;
    collapsed = true;
    panelStyling;
    registrationLinkArray = [];

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Check if current environment is Salesforce or Community
     */
    checkIsCommunityInstance() {

        Promise.all([
            loadStyle(this, ConferenceInMetroAreaCSS)
        ]);

        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        if(this.isCommunity === false)
        {
            this.recordsExist=true;
        }
    }

    @wire(getMetroAreaName, { recordId: '$recordId' })
    loadMetroAreaName(metroAreaName) {

        if (JSON.stringify(metroAreaName) != '{}') {
            if (metroAreaName.data !== undefined && metroAreaName.data != null) {
                this.recordName = metroAreaName.data;
            }
        }
    }

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 10 records of Conferences
     */
    connectedCallback() {

        this.isLoading = true;
        this.checkIsCommunityInstance();
        this.tempAddAction = COLUMNS;

        if (this.isCommunity) {
            this.tempAddAction = [...this.tempAddAction, {
                type: 'action',
                typeAttributes: { rowActions: noActions },
            }];
        }
        else {
            this.tempAddAction = [...this.tempAddAction, {
                type: 'action',
                typeAttributes: { rowActions: actions },
            }];
        }
        this.columns = this.tempAddAction;

        getSFBaseUrl().
            then(baseURL => {
                if (baseURL) {
                    this.baseURL = baseURL;
                }
            })
            .catch(error => {
                console.log("Error:", error);
            });

        //To fetch total number of Conference records
        getRelatedConferenceCount({
            recordId: this.recordId
        }).then(contactRecordCount => {
            if (contactRecordCount > 0) {
                this.recordsExist = true;
                this.totalRelatedConferencesCount = contactRecordCount;
 
                //To set panel height based total number of records 
                if (this.totalRelatedConferencesCount >= 10) {
                    this.panelStyling = 'height : 305px;';
                }
                else if (this.totalRelatedConferencesCount == 1) {
                    this.panelStyling = 'height : 62px;';
                }
                else if (this.totalRelatedConferencesCount == 2) {
                    this.panelStyling = 'height : 90px;';
                }
                else if (this.totalRelatedConferencesCount == 3) {
                    this.panelStyling = 'height : 115px;';
                }
                else if (this.totalRelatedConferencesCount == 4) {
                    this.panelStyling = 'height : 142px;';
                }
                else if (this.totalRelatedConferencesCount == 5) {
                    this.panelStyling = 'height : 170px;';
                }
                else if (this.totalRelatedConferencesCount == 6) {
                    this.panelStyling = 'height : 196px;';
                }
                else if (this.totalRelatedConferencesCount == 7) {
                    this.panelStyling = 'height : 225px';
                }
                else if (this.totalRelatedConferencesCount == 8) {
                    this.panelStyling = 'height : 250px;';
                }
                else if (this.totalRelatedConferencesCount == 9) {
                    this.panelStyling = 'height : 280px;';
                }
            } else {
                this.totalRelatedConferencesCount = 0;
            }
        }).catch(error => {
            console.log('Error : ', error);
        });

        //Get Conference records to display
        getRelatedConferencesToMetroArea({
            recordId: this.recordId
        }).then(relatedConferencesToMa => {
            if (relatedConferencesToMa) {
                var tempConferencesList = [];
                for (var i = 0; i < relatedConferencesToMa.length; i++) {
                    let tempConferenceRecord = Object.assign({}, relatedConferencesToMa[i]); //cloning object

                    if (this.isCommunity) {
                        tempConferenceRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempConferenceRecord.Id;
                        if (tempConferenceRecord.Metro_Area__c != undefined) {
                            tempConferenceRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempConferenceRecord.Metro_Area__c;
                            tempConferenceRecord.MetroAreaName = tempConferenceRecord.Metro_Area__r.Name;
                        }
                            
                    } else {
                        tempConferenceRecord.recordLink = "/" + tempConferenceRecord.Id;
                        if (tempConferenceRecord.Metro_Area__c != undefined) {
                            tempConferenceRecord.MetroAreaLink = "/" + tempConferenceRecord.Metro_Area__c;
                            tempConferenceRecord.MetroAreaName = tempConferenceRecord.Metro_Area__r.Name;
                        }
                    }
                    if(tempConferenceRecord.Registration_Link__c != null || tempConferenceRecord.Registration_Link__c != undefined) {
                        tempConferenceRecord.RegLink = 'Click Here';
                        tempConferenceRecord.registerationUrl = tempConferenceRecord.Registration_Link__c;
                        this.registrationLinkArray[tempConferenceRecord.Id] = tempConferenceRecord.Registration_Link__c;
                    }
                    tempConferencesList.push(tempConferenceRecord);
                }
                this.conferencesRelatedToMa = tempConferencesList;
                this.offset = this.conferencesRelatedToMa.length;
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('Error : ', error);
        });

        
    }

    //Function is called when Chevron is clicked.
    chevronButtonClicked() {
        this.collapsed = !this.collapsed;
    }

    /**
     * Gets called when dropdown row actions(edit or delete) are done
     * @param {*} event Event action
     */
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        const recordId = event.detail.row.Id;

        switch (actionName) {
            case 'RegLinkCell':
                window.open(this.formatUrl(this.registrationLinkArray[recordId]), '_blank');
                break;
            case 'delete':
                this.deleteRow(row);
                break;
            case 'edit':
                this.navigateToRecordEditPage(row);
                break;
            default:
        }
    }

    formatUrl(url) {
        if (!url.match(/^https?:\/\//i)) {
            url = 'http://' + url;
        }
        return url;
    }

    /**
     * Method is called when a record is deleted
     * @param {*} row  
     */
    deleteRow(row) {

        this.isLoading = true;
        this.recordToDel = JSON.stringify(row.Id).replace(/['"]+/g, '');

        deleteRecord(this.recordToDel)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record deleted',
                        variant: 'success'
                    })

                );
                this.isLoading = false;
                return refreshApex(this.connectedCallback());

            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: 'Error Occured While Deleting The Record',
                        variant: 'error'
                    })
                );
                this.isLoading = false;
            });

    }

    /**
     * Method to navigate to record edit page
     * @param {*} row 
     */
    navigateToRecordEditPage(row) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });

        let { Id } = row;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: Id,
                actionName: 'edit'
            }
        });
    }

    /**
     * Method is called when new record is created
     * @param {*} event 
     */
    createNewRecord(event) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });
    
        onError(error => {
            console.error('Received error from server SF: ', error);
        });

        this.newbuttonPressed = true;
        let newConferenceRecord = { 
            type: 'standard__objectPage', 
            attributes: { objectApiName: 'Conference__c', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                useRecordTypeCheck:'yes',
                defaultFieldValues:"Metro_Area__c=" + this.recordId
            },
        };  
        this[NavigationMixin.Navigate](newConferenceRecord);
    }

    handleEvent = event => {
    
        this.isLoading = true;
        this.newbuttonPressed = false;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.checkIsCommunityInstance();
        this.refreshTable();
    }

    /**
     * Gets called when more records are loaded on scroll
     * @param {*} event 
     */
    loadMoreData(event) {
        if(this.totalRelatedConferencesCount > this.offset && this.newbuttonPressed == false) {
            
            //Display a spinner to signal that data is being loaded
            if(this.conferencesRelatedToMa != null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;

            //Fetch next chunk of records
            getAllRelatedConferencesRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset
            }).then (relatedConferencesToMa => {
                if (relatedConferencesToMa) { 
                    var tempConferencesList = [];  
                    for (var i = 0; i < relatedConferencesToMa.length; i++) {
                        let tempConferenceRecord = Object.assign({}, relatedConferencesToMa[i]); //cloning object
    
                        if (this.isCommunity) {
                            tempConferenceRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempConferenceRecord.Id;
                            if (tempConferenceRecord.Metro_Area__c != undefined) {
                                tempConferenceRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempConferenceRecord.Metro_Area__c;
                                tempConferenceRecord.MetroAreaName = tempConferenceRecord.Metro_Area__r.Name;
                            }
                                
                        } else {
                            tempConferenceRecord.recordLink = "/" + tempConferenceRecord.Id;
                            if (tempConferenceRecord.Metro_Area__c != undefined) {
                                tempConferenceRecord.MetroAreaLink = "/" + tempConferenceRecord.Metro_Area__c;
                                tempConferenceRecord.MetroAreaName = tempConferenceRecord.Metro_Area__r.Name;
                            }
                        }
                        if(tempConferenceRecord.Registration_Link__c != null || tempConferenceRecord.Registration_Link__c != undefined) {
                            tempConferenceRecord.RegLink = 'Click Here';
                            tempConferenceRecord.registerationUrl = tempConferenceRecord.Registration_Link__c;
                            this.registrationLinkArray[tempConferenceRecord.Id] = tempConferenceRecord.Registration_Link__c;
                        }
    
                        tempConferencesList.push(tempConferenceRecord);
                    }
                    if(this.conferencesRelatedToMa)
                        this.conferencesRelatedToMa =  this.conferencesRelatedToMa.concat(tempConferencesList);
                    if((this.offset + this.limit) >= this.totalRelatedConferencesCount)
                    {
                        this.offset = this.totalRelatedConferencesCount;
                    } else {
                        this.offset = parseInt(this.offset ) + parseInt(this.limit);
                    }

                    if(this.tableElement){
                        this.tableElement.isLoading = false;
                    } 
                }
            }) .catch(error => {
                this.isLoading=false;
                console.log("Error:" , error);
            });

        }
    }

    /**
     * Method is called when Refresh button on related list is clicked
     * @param {*} event
     */
    refreshTable(event)
    {
        var table = this.template.querySelector('lightning-datatable');
        if(table!=null)
            table.enableInfiniteLoading = true;
        this.connectedCallback();
    }

    /**
    * For redirecting to View All page
    */
    handleShowFullRelatedList() {
        var navigationURL = this.baseURL + '/lightning/cmp/c__ConferencesRelatedToMaDataTableView?c__recordId=' + this.recordId + '&c__recordName=' + this.recordName + '&c__totalRelatedConferencesCount=' + this.totalRelatedConferencesCount + '&c__isCommunity=' + this.isCommunity;
        var url = '/view-metroareaconferences?recordId=' + this.recordId + '&recordName=' + this.recordName + '&totalRelatedConferencesCount=' + this.totalRelatedConferencesCount + '&isCommunity=' + this.isCommunity;

        if (this.isCommunity) {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
        else {
            window.open(navigationURL, "_self");
        }
    }

}