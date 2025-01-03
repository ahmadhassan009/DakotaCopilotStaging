import { LightningElement, api, wire, track  } from 'lwc';
import getMetroAreaName from '@salesforce/apex/RelatedConferenceController.getMetroAreaName';
import getAllRelatedSortedConferencesRecords from '@salesforce/apex/RelatedConferenceController.getAllRelatedSortedConferencesRecords';
import getRelatedConferenceCount from '@salesforce/apex/RelatedConferenceController.getRelatedConferenceCount';
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
    { label: 'Conference Name', fieldName: "recordLink", sortable: true, type: "url", typeAttributes: { label: { fieldName: CONFERENCE_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONFERENCE_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Start Date', fieldName: STARTDATE_FIELD.fieldApiName, sortable: true, type: 'date', typeAttributes: {day: "numeric",month: "numeric", year: "numeric"} },    
    { label: 'Investment Focus', fieldName: INVESTMENT_FOCUS_FIELD.fieldApiName, sortable: true,type: 'Picklist' },
    { label: 'Speaker Type', fieldName: SPEAKER_TYPE_FIELD.fieldApiName, sortable: true, type: 'Picklist' },
    { label: 'Format', fieldName: FORMAT_FIELD.fieldApiName, sortable: true, type: 'Picklist' },
    { label: 'Registration Link', fieldName: 'registerationUrl', type: 'button', sortable: true, typeAttributes: { label: { fieldName: 'RegLink' }, name: "RegLinkCell", variant: "base", }, cellAttributes: { class: 'buttonHeight' } }
]

const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];
const noActions = [
    { label: 'No actions available', name: 'No actions available', disabled: true }
];

export default class ConferencesRelatedToMetroAreaViewAll extends NavigationMixin(LightningElement) {

    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';

    @api recordId;
    @api recordName;
    @api isCommunity;
    @track isLoading = false;
    fromRefresh = false;
    conferencesRelatedToMa;
    totalRelatedConferencesCount;
    panelName = 'Conferences';
    columns = COLUMNS;
    offset = 0;
    limit = 50;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = STARTDATE_FIELD.fieldApiName;
    plusSign = '';
    baseURL = '';
    tempAddAction = [];
    recordToDel;
    setSelectedRows = [];
    collapsed = true;
    panelStyling;
    isCommunityBoolean;
    registrationLinkArray = [];

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 50 records of Conferences
     */
    connectedCallback() {

        this.isLoading = true;

        Promise.all([
            loadStyle(this, ConferenceInMetroAreaCSS)
        ]);

        //Check if current environment is Salesforce or Community
        this.isCommunityBoolean = this.isCommunity == 'false' ? false : true;
        // To set links for breadcrumbs
        this.setLinks();

        this.tempAddAction = COLUMNS;
        if (this.isCommunityBoolean) {
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

        //To fetch total number of Conference records
        getRelatedConferenceCount({
            recordId: this.recordId
        }).then(conferenceRecordCount => {
            if (conferenceRecordCount) {
                this.totalRelatedConferencesCount = conferenceRecordCount;
            }
        }).catch(error => {
            console.log('Error : ', error);
        });

        this.setFieldsBeforeSorting();

        //Fetch first 50 Conference records
        getAllRelatedSortedConferencesRecords({
            recordId: this.recordId,
            recordLimit: this.limit,
            offset: this.offset,
            sortBy: this.sortedBy,
            sortOrder: this.sortedDirection
        }).then(relatedConferencesToMa => {
            if (relatedConferencesToMa) {
                var tempConferencesList = [];
                for (var i = 0; i < relatedConferencesToMa.length; i++) {
                    let tempConferenceRecord = Object.assign({}, relatedConferencesToMa[i]); //cloning object

                    if (this.isCommunityBoolean) {
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
                if ((this.offset) >= this.totalRelatedConferencesCount  || (this.offset) == 0) {
                    this.plusSign = '';
                }
                else {
                    this.plusSign = '+';
                }

                this.isLoading = false;
                this.infiniteLoading = false;
                if(this.fromRefresh) {
                    this.fromRefresh = false;
                }
            }
        }).catch(error => {
            this.isLoading = false;
            this.infiniteLoading = false;
            console.log('Error : ', error);
        });

        this.setFieldsAfterSorting();

        //Get Metro Area name to show at the top
        getMetroAreaName({
            recordId : this.recordId
        }).then(returnedMetroArea => {
            if(returnedMetroArea != null)
            {
                this.recordName = returnedMetroArea;
            }
        });
        
    }

    /**
     * For sorting the table
     * @param {*} event 
     */
    onHandleSort(event) {

        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;
        this.sortedBy = sortedBy;
        this.sortedDirection = sortDirection;

        this.setFieldsBeforeSorting();

        // Get related sorted conference records
        getAllRelatedSortedConferencesRecords({
            recordId: this.recordId,
            recordLimit: this.offset,
            offset: 0,
            sortBy: this.sortedBy,
            sortOrder: this.sortedDirection
        }).then (relatedConferencesToMa => {
            if (relatedConferencesToMa) { 
                var tempConferencesList = [];  
                for (var i = 0; i < relatedConferencesToMa.length; i++) {
                    let tempConferenceRecord = Object.assign({}, relatedConferencesToMa[i]); //cloning object

                    if (this.isCommunityBoolean) {
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
                this.offset = tempConferencesList.length; 
                this.isLoading = false;
            }
        }) .catch(error => {
            this.isLoading=false;
            console.log('Error : ', error);
        });

        this.setFieldsAfterSorting();

    }

    /**
     * Gets called when more records are loaded on scroll
     * @param {*} event 
     */
    loadMoreData(event) {
        if(this.totalRelatedConferencesCount > this.offset && this.fromRefresh == false) {
            //Display a spinner to signal that data is being loaded
            if(this.conferencesRelatedToMa != null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;

            this.setFieldsBeforeSorting();

            //Fetch next chunk of records
            getAllRelatedSortedConferencesRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset,
                sortBy: this.sortedBy,
                sortOrder: this.sortedDirection
            }).then (relatedConferencesToMa => {
                if (relatedConferencesToMa) { 
                    var tempConferencesList = [];  
                    for (var i = 0; i < relatedConferencesToMa.length; i++) {
                        let tempConferenceRecord = Object.assign({}, relatedConferencesToMa[i]); //cloning object
    
                        if (this.isCommunityBoolean) {
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
                        this.plusSign = '';
                    } else {
                        this.offset = parseInt(this.offset ) + parseInt(this.limit);
                        this.plusSign = '+';
                    }

                    if(this.tableElement){
                        this.tableElement.isLoading = false;
                    }
                    this.infiniteLoading = false; 
                }
            }) .catch(error => {
                this.isLoading=false;
                this.infiniteLoading = false;
                console.log("Error:" , error);
            });

            this.setFieldsAfterSorting();

        }
    }

    setFieldsBeforeSorting() {
        if(this.sortedBy == 'recordLink') {
            this.sortedBy = CONFERENCE_NAME_FIELD.fieldApiName;
        } else if(this.sortedBy == 'MetroAreaLink') {
            this.sortedBy = 'Metro_Area__r.Name';
        } else if (this.sortedBy == 'registerationUrl') {
            this.sortedBy = 'Registration_Link__c';
        }
    }

    setFieldsAfterSorting() {
        if(this.sortedBy == CONFERENCE_NAME_FIELD.fieldApiName) {
            this.sortedBy = 'recordLink';
        } else if(this.sortedBy == 'Metro_Area__r.Name') {
            this.sortedBy = 'MetroAreaLink';
        } else if (this.sortedBy == 'Registration_Link__c') {
            this.sortedBy = 'registerationUrl';
        }
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

    handleEvent = event => {

        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.refreshTable(event);
    }

    /**
     * Method is called when new record is created
     * @param {*} event 
     */
    createNewRecord(event) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            this.subscription = response;
        });
    
        onError(error => {
            console.error('Received error from server SF: ', error);
        });
        
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


    /**
     * Method is called when a record is deleted
     * @param {*} row  
     */
    deleteRow(row) {
        this.isLoading=true;
        this.fromRefresh = true;
        this.recordToDel= JSON.stringify(row.Id).replace(/['"]+/g, '');

        deleteRecord(this.recordToDel)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record deleted',
                        variant: 'success'
                    })

                );
                this.isLoading=false;
                this.offset = 0;
                this.limit = 50;
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
                this.isLoading=false;
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

    // Set breadcrumb links
    setLinks() {
        if(this.isCommunityBoolean) {  
            this.recordLink = "/"+this.communityName+"/s/metro-area/" + this.recordId;
            this.maNameLink = "/"+this.communityName + '/s/metro-area/Metro_Area__c/Default';
        } else {
            this.recordLink = '/'+this.recordId;
            this.maNameLink = '/one/one.app#/sObject/Metro_Area__c/list?filterName=Recent';
        }  
    }

    /**
     * Method is called when Refresh button on related list is clicked
     * @param {*} event
     */
    refreshTable(event) {

        this.fromRefresh = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.sortedDirection = 'asc';
        this.sortedBy = STARTDATE_FIELD.fieldApiName;
        this.conferencesRelatedToMa = null;
        var table = this.template.querySelector('lightning-datatable');
        if(table!=null)
            table.enableInfiniteLoading=true;
        return refreshApex(this.connectedCallback());
    }

}