import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getMetroAreaRelatedDakotaContentRecords from '@salesforce/apex/DakotaContentMetroAreaRelatedList.getMetroAreaRelatedDakotaContentRecords';
import getMetroAreaRelatedDakotaContentCount from '@salesforce/apex/DakotaContentMetroAreaRelatedList.getMetroAreaRelatedDakotaContentCount';
import getMetroAreaName from '@salesforce/apex/DakotaContentMetroAreaRelatedList.getMetroAreaName';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';

const COLUMNS = [

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
        label: 'Presentation Recording',
        fieldName: 'recordingLink',
        type: "url",
        typeAttributes: {
            label: { fieldName: 'recordingLabel' },
            tooltip: { fieldName: 'recordingLabel' },
            target: '_self'
        }
    }

];
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];
const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled: true }
];

export default class DakotaContentPanelMetroArea extends NavigationMixin(LightningElement) {
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
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
    }

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

        // Get related Dakota Content records
        getMetroAreaRelatedDakotaContentRecords({
            recordId: this.recordId,
            recordLimit: 10,
            offset: 0
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

        //To get count of related records
        getMetroAreaRelatedDakotaContentCount({
            recordId: this.recordId
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


    loadMoreData(event) {
        if (this.totalRelatedDakotaContentCount > this.offset && this.newbuttonPressed == false) {
            //Display a spinner to signal that data is being loaded
            if (this.relatedDakotaContentRecords != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            getMetroAreaRelatedDakotaContentRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset
            }).then(relatedDakotaContent => {
                var tempDakotaContentsList = [];
                for (var i = 0; i < relatedDakotaContent.length; i++) {
                    let tempDakotaContentsRecord = Object.assign({}, relatedDakotaContent[i]); //cloning object 
                    if (this.isCommunity) {
                        tempDakotaContentsRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempDakotaContentsRecord.Id;
                        tempDakotaContentsRecord.FeaturedOnLink = (tempDakotaContentsRecord.Dakota_Live_Call__c != null
                            ? "/" + this.communityName + "/s/detail/" + tempDakotaContentsRecord.Dakota_Live_Call__c
                            : '');
                        tempDakotaContentsRecord.recordingLink = tempDakotaContentsRecord.Presentation_Recording_url__c;
                    }
                    else {
                        tempDakotaContentsRecord.recordLink = "/" + tempDakotaContentsRecord.Id;
                        tempDakotaContentsRecord.FeaturedOnLink = (tempDakotaContentsRecord.Dakota_Live_Call__c != null
                            ? "/" + tempDakotaContentsRecord.Dakota_Live_Call__c
                            : '');
                        tempDakotaContentsRecord.recordingLink = tempDakotaContentsRecord.Presentation_Recording_url__c;
                    }

                    if (tempDakotaContentsRecord.Id != undefined) {
                        tempDakotaContentsRecord.contentLineName = tempDakotaContentsRecord.Name;
                        tempDakotaContentsRecord.dateField = tempDakotaContentsRecord.Date__c;
                        tempDakotaContentsRecord.recordingLabel = "Click Here to Watch"
                        tempDakotaContentsRecord.Type = tempDakotaContentsRecord.Type__c;

                    }
                    if (tempDakotaContentsRecord.Dakota_Live_Call__c != undefined) {
                        tempDakotaContentsRecord.FeaturedOn = tempDakotaContentsRecord.Dakota_Live_Call__r.Name;
                    }
                    tempDakotaContentsList.push(tempDakotaContentsRecord);
                }

                if (this.relatedDakotaContentRecords)
                    this.relatedDakotaContentRecords = this.relatedDakotaContentRecords.concat(tempDakotaContentsList);
                if ((this.offset + 10) >= this.totalRelatedDakotaContentCount) {
                    this.offset = this.totalRelatedDakotaContentCount;
                    this.plusSign = '';
                }
                else {
                    this.offset = parseInt(this.offset) + parseInt(this.limit);
                    this.plusSign = '+';
                }

                this.loadMoreStatus = '';
                if (this.tableElement) {
                    this.tableElement.isLoading = false;
                }
            }).catch(error => {
                console.log("Error:", error);
            });
        }
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

    @wire(getMetroAreaName, { recordId: '$recordId' })
    loadMetroAreaName(metroAreaName) {
        if (metroAreaName.data) {
            this.recordName = metroAreaName.data;
        }
    }

    handleShowFullRelatedList() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Metro_Area__c',
                relationshipApiName: 'Dakota_Content__r',
                actionName: 'view'
            },
        });
    }
}