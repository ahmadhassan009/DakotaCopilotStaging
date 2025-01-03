import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getMetroAreaRelatedDakotaContentRecords from '@salesforce/apex/DakotaContentMetroAreaRelatedList.getMetroAreaStateRelatedDakotaContentRecords';
import getMetroAreaRelatedDakotaContentCount from '@salesforce/apex/DakotaContentMetroAreaRelatedList.getMetroAreaStateRelatedDakotaContentCount';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';

const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled: true }
];
const COLUMNS = [

    {
        label: 'Content Name',
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: { fieldName: 'contentLineName' },
            tooltip: { fieldName: 'contentLineName' },
            target: '_self'
        }
    },

    {
        label: 'Date',
        fieldName: 'dateField',
        type: 'date',
        typeAttributes: {
            day: "numeric",
            month: "numeric",
            year: "numeric"
        }
    },

    {
        label: 'Type',
        fieldName: 'Type',
        type: 'Picklist'
    },
    {
        label: 'Featured On',
        fieldName: "FeaturedOnLink",
        type: "url",
        typeAttributes: {
            label: { fieldName: 'FeaturedOn' },
            tooltip: { fieldName: 'FeaturedOn' },
            target: '_self'
        }
    },

    {
        label: 'Presentation Recording',
        fieldName: 'recordingLink',
        type: "url",
        typeAttributes: {
            label: { fieldName: 'recordingLabel' },
            tooltip: { fieldName: 'recordingLabel' },
            target: '_self'
        }
    }
    ,
{
    type: 'action',
    typeAttributes: { rowActions: noActions },
}

];
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

export default class DakotaStateContentPanelMetroArea extends NavigationMixin(LightningElement) {
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api stateName;
    @api recordId;
    @api recordName;
    @track isLoading = false;
    @api isSalesforceInstance = false;
    columns = COLUMNS;
    tempAddAction = [];
    setSelectedRows = [];
    totalRelatedDakotaContentCount = 0;
    relatedDakotaContentRecords;
    newbuttonPressed = false;
    isCommunity = false;
    offset = 0;
    limit = 10;
    plusSign = '+';
    baseURL = '';
    recordToDel;
    collapsed = true;
    panelStyling;
    fromEditEvent = false;
    @track data;
    error;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    @api
    clearAll() {
        this.setSelectedRows = [];
    }

    chevronButtonClicked() {
        this.collapsed = !this.collapsed;
        this.relatedDakotaContentRecords = [];
        this.offset=0;
        if(!this.collapsed) {
            this.isLoading = true;
            getMetroAreaRelatedDakotaContentRecords({
                stateName: this.stateName,
                sortedBy: 'LastModifiedDate',
                sortedDirection: 'DESC',
                recordLimit: 10,
                offset: 0,                        
                nullOrder: 'LAST'
            }).then(relatedDakotaContent => {
                if (relatedDakotaContent) {
                    var tempDakotaContentList = [];
                    for (var i = 0; i < relatedDakotaContent.length; i++) {
                        let tempRecord = Object.assign({}, relatedDakotaContent[i]); //cloning object  
                        if (this.isCommunity) {
                            tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                            tempRecord.FeaturedOnLink = (tempRecord.Dakota_Live_Call__c != null
                                ? "/" + this.communityName + "/s/detail/" + tempRecord.Dakota_Live_Call__c
                                : '');
                            tempRecord.recordingLink = tempRecord.Presentation_Recording_url__c;
                        }
                        else {
                            tempRecord.recordLink = "/" + tempRecord.Id;
                            tempRecord.FeaturedOnLink = (tempRecord.Dakota_Live_Call__c != null
                                ? "/" + tempRecord.Dakota_Live_Call__c
                                : '');
                            tempRecord.recordingLink = tempRecord.Presentation_Recording_url__c;
                        }
                        if (tempRecord.Id != undefined) {
                            tempRecord.contentLineName = tempRecord.Name;
                            tempRecord.dateField = tempRecord.Date__c;
                            tempRecord.recordingLabel = "Click Here to Watch";
                            tempRecord.Type = tempRecord.Type__c;
                        }
                        if (tempRecord.Dakota_Live_Call__c != undefined) {
                            tempRecord.FeaturedOn = tempRecord.Dakota_Live_Call__r.Name;
                        }
    
                        tempDakotaContentList.push(tempRecord);
                    }
    
                    this.relatedDakotaContentRecords = tempDakotaContentList;
                    this.offset = tempDakotaContentList.length;
                    this.isLoading = false;
                }
            }).catch(error => {
                this.isLoading = false;
            });
        }
    }

    connectedCallback() {
        this.isLoading = true;
        this.checkIsCommunityInstance();
        this.columns =COLUMNS;


        //To get count of related records
        getMetroAreaRelatedDakotaContentCount({
            stateName: this.stateName,
        }).then(DakotaContentCount => {
            if (DakotaContentCount) {
                this.totalRelatedDakotaContentCount = DakotaContentCount;

                //To set panel height based total number of records 
                if (this.totalRelatedDakotaContentCount >= 10) {
                    this.panelStyling = 'height : 305px;';
                }
                else if (this.totalRelatedDakotaContentCount == 1) {
                    this.panelStyling = 'height : 62px;';
                }
                else if (this.totalRelatedDakotaContentCount == 2) {
                    this.panelStyling = 'height : 90px;';
                }
                else if (this.totalRelatedDakotaContentCount == 3) {
                    this.panelStyling = 'height : 115px;';
                }
                else if (this.totalRelatedDakotaContentCount == 4) {
                    this.panelStyling = 'height : 142px;';
                }
                else if (this.totalRelatedDakotaContentCount == 5) {
                    this.panelStyling = 'height : 170px;';
                }
                else if (this.totalRelatedDakotaContentCount == 6) {
                    this.panelStyling = 'height : 196px;';
                }
                else if (this.totalRelatedDakotaContentCount == 7) {
                    this.panelStyling = 'height : 225px;';
                }
                else if (this.totalRelatedDakotaContentCount == 8) {
                    this.panelStyling = 'height : 250px;';
                }
                else if (this.totalRelatedDakotaContentCount == 9) {
                    this.panelStyling = 'height : 280px;';
                }
            }
        }).catch(error => { });

        //To get base url of the instance
        getSFBaseUrl().then(baseURL => {
            if (baseURL) {
                this.baseURL = baseURL;
            }
        })
            .catch(error => {
                console.log("Error:", error);
            });
    }



    get recordDakotaContentCountCondition() {
        if (this.totalRelatedDakotaContentCount == 10) {
            return false;
        }

        if (this.totalRelatedDakotaContentCount > 10) {
            return true;
        }
        else {
            return false
        }
    }

    handleEvent = event => {

        this.isLoading = true;
        this.newbuttonPressed = false;
        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.checkIsCommunityInstance();
        this.fromEditEvent = true;
        this.refreshTable();
    }
    /**
     * DSC-42
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
        let newDakotaContentRecord = {
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Dakota_Content__c', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                useRecordTypeCheck: 'yes',
                defaultFieldValues: "Metro_Area_Linked__c=" + this.recordId
            },
        };
        this[NavigationMixin.Navigate](newDakotaContentRecord);
        this.newbuttonPressed = false;
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
    }

    // To refresh table
    refreshTable(event) {
        if(!this.fromEditEvent)
        {
            var table = this.template.querySelector('lightning-datatable');
            if(table!=null)
                table.enableInfiniteLoading = true;
        }
        this.fromEditEvent = false;
        this.connectedCallback();
    }

    //Handle row actions for datatable
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this.deleteRow(row);
                break;
            case 'edit':
                this.navigateToRecordEditPage(row);
                break;
            default:
        }
    }

    //Deletion handler
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

    //Edit handler
    navigateToRecordEditPage(row) {
        let { Id } = row;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: Id,
                actionName: 'edit'
            }
        });
    }


    handleShowFullRelatedList() {

        var url = '/metro-area-state-view-all?stateName=' + this.stateName + '&objectName=Dakota_Content__c';
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
    }
}