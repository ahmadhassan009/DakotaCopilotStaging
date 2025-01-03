import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getAnnualReportsAndHoldingsRecords from '@salesforce/apex/AnnualReportsAndHoldingsController.getAnnualReportsAndHoldingsRecords';
import getRelatedAnnualReportsAndHoldingsCount from '@salesforce/apex/AnnualReportsAndHoldingsController.getRelatedAnnualReportsAndHoldingsCount';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import CorporatePensionCSS from '@salesforce/resourceUrl/CorporatePensionCSS';
import { loadStyle } from 'lightning/platformResourceLoader';

const columns = [{
        label: "Annual Financial Report Name",
        sortable: true,
        fieldName: "recordLink",
        type: "url",
        initialWidth: 250,
        typeAttributes: {
                label: {
                    fieldName: 'Name'
                },
                target: '_self',
                tooltip: { 
                    fieldName: 'Name'
                }
            }
        },
        {
            label: "Report Year",
            sortable: true,
            fieldName: "ReportYear",
            type: "text"
        },
        {
            label: "Type",
            sortable: true,
            fieldName: "ReportType",
            type: "text",
        },
        {
            label: "View as PDF",
            type: "button",
            typeAttributes: {
                label: { fieldName : "DocName"} ,
                name: "AttachmentCell",
                variant: "base"
            },
            cellAttributes: 
            { 
                class: 'buttonHeight'
            }
        }
];

const actions = [
{ label: 'Edit', name: 'edit' },
{ label: 'Delete', name: 'delete' },
];


export default class AnnualReportsAndHoldingsInAccounts extends NavigationMixin(LightningElement) {
    @api recordId;
    @track isLoading = true;
    @track annualReportRecordsExists = false;
    CHANNEL_NAME = '/event/refreshComponents__e';
    columns = columns;
    annualReportHoldingRecords;
    totalAnnualReportHoldingCount;
    annualReportHoldingRecordsExists = false;
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = 'ReportYear';
    nameSortDir = this.defaultSortDirection;
    limit = 10;
    offset = 0;
    plusSign = '+';
    openModal = false;
    annualReportIdToAttachments = [];
    contentDocuments = [];
    collapsed = true;
    isCommunity = false;
    recordToDel;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 10 records of Annual Report and Pension Holdings
     */
    connectedCallback() {
        this.isLoading = true;
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;

        Promise.all([
            loadStyle(this, CorporatePensionCSS)
        ]);

        this.tempAddAction = columns;
        if(!this.isCommunity) {
            this.tempAddAction=[...this.tempAddAction,{
                type: 'action',
                typeAttributes: { rowActions: actions },
               }];
        }
        this.columns = this.tempAddAction;

        //To fetch number of Annual Reports and Holding records
        getRelatedAnnualReportsAndHoldingsCount({
            recordId: this.recordId
        }).then(annualReportHoldingRecordCount => {
            this.totalAnnualReportHoldingCount = annualReportHoldingRecordCount;
            //To fetch Annual Reports and Holding records
            this.getAnnualReportAndHoldingRecords(this.recordId, 'Report_Year__c', this.sortedDirection);
        }).catch(error => {
            console.log("Error in fetching total count of Annual Report and Holding Count: ", error);
        });

        getSFBaseUrl().then(baseURL => {
            if(baseURL) {
                this.baseURL = baseURL;
            }
            this.isLoading = false;
        })
        .catch(error => {
            this.isLoading = false;
        });
    }

    /**
     * To get Annual Report and Holding records linked to the account
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Plan Year)
     * @param sortedDirection sorting direction
     */
    getAnnualReportAndHoldingRecords(recordId, sortedBy, sortedDirection) {
        this.isLoading = true;

        //getting annual report and holding records based on the passed Account Id
        getAnnualReportsAndHoldingsRecords({
            accountId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            recordLimit: 10,
            offset: 0
        }).then(returnedAnnualReportHoldings => {
            if (returnedAnnualReportHoldings) {
                var tempAnnualReportHoldingList = [];
                for (var i = 0; i < returnedAnnualReportHoldings.length; i++) {
                    let tempAnnualReportHoldingRecord = Object.assign({}, returnedAnnualReportHoldings[i]); //cloning object
                    if (this.isCommunity) {
                        if (tempAnnualReportHoldingRecord.Id != undefined)
                            tempAnnualReportHoldingRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempAnnualReportHoldingRecord.Id;
                    } else {
                        if (tempAnnualReportHoldingRecord.Id != undefined)
                            tempAnnualReportHoldingRecord.recordLink = "/" + tempAnnualReportHoldingRecord.Id;
                    }
                    if(tempAnnualReportHoldingRecord.AR_Attachments != undefined && tempAnnualReportHoldingRecord.AR_Attachments.length > 0)
                    {
                        this.annualReportIdToAttachments[tempAnnualReportHoldingRecord.Id] = tempAnnualReportHoldingRecord.AR_Attachments;
                        if(tempAnnualReportHoldingRecord.AR_Attachments.length == 1) 
                        {
                            tempAnnualReportHoldingRecord.DocName = 'View PDF';                      
                        }
                        else {
                            tempAnnualReportHoldingRecord.DocName = 'View PDF(s)';
                        }
                    }

                    tempAnnualReportHoldingList.push(tempAnnualReportHoldingRecord);
                }
                this.annualReportHoldingRecords = tempAnnualReportHoldingList;
                this.offset = this.annualReportHoldingRecords.length;
                if (this.annualReportHoldingRecords.length > 0 || !this.isCommunity) {
                    this.annualReportHoldingRecordsExists = true;
                }

                if ((this.annualReportHoldingRecords.length) >= this.totalAnnualReportHoldingCount) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }

                if(this.offset > 0)
                {
                    this.collapsed =false;
                }
                else
                {
                    this.collapsed =true;
                }
            }
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            console.log("Error in fetching Annual Report and Holding records: ", error);
        });
    }

    /**
     * Row action gets called when View PDF column button is clicked
     * Also gets called when dropdown row actions(edit or delete) are done
     * @param {*} event Event action
     */
    callRowAction(event) {
        const selectedValue = event.detail.row.DocName;
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        const recordId = event.detail.row.Id;

        // In case if View PDF button is clicked
        if (actionName == "AttachmentCell") {
            if(selectedValue == 'View PDF') {
                window.open((this.annualReportIdToAttachments[recordId])[0].DistributionPublicUrl ,'_self');
            }
            else if(selectedValue == 'View PDF(s)'){
                this.contentDocuments = [];
                this.contentDocuments = this.annualReportIdToAttachments[recordId]
                this.openModal = true;
            }
        }
        // In case if Edit row action is performed
        else if(actionName == 'edit') {
            this.navigateToRecordEditPage(row);
        }
        // In case if Delete row action is performed
        else if(actionName == 'delete') {
            this.deleteRow(row);
        }
    }

    /**
     * Close multiple attachments Modal popup
     */
    closeModal() {
        this.openModal = false;
    }

    /**
     * Method is called when Refresh button on related list is clicked
     */
    refreshTable() {
        this.offset = 0;
        this.limit = 10;
        this.sortedDirection = 'desc';
        this.defaultSortDirection = 'desc';
        this.nameSortDir = this.defaultSortDirection;
        this.sortedBy = 'Report_Year__c';
        this.plusSign = '';
        this.annualReportHoldingRecords = [];
        this.contentDocuments = [];
        this.connectedCallback();
    }

    /**
     * For sorting the table
     * @param {*} event 
     */
    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;

        let tempSortBy = this.sortedBy;
        if (this.sortedBy === 'recordLink') {
            tempSortBy = 'Name';
        } else if (this.sortedBy === 'ReportYear') {
            tempSortBy = 'Report_Year__c';
        } else if (this.sortedBy === 'ReportType') {
            tempSortBy = 'Type__c';
        }

        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getAnnualReportAndHoldingRecords(this.recordId, tempSortBy, this.sortedDirection);
    }

    handleEvent = event => {
        this.isLoading = true;
        this.newbuttonPressed = false;
        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.refreshTable();       
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
        
        let newSearchRecord = { 
            type: 'standard__objectPage', 
            attributes: { objectApiName: 'Annual_Reports_and_Holdings_Data__c', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                defaultFieldValues:"Account__c="+this.recordId
            },
        };  
        this[NavigationMixin.Navigate](newSearchRecord);
    }

    /**
     * Method is called when new record is deleted
     * @param {*} row  
     */
    deleteRow(row) {
        this.isLoading=true;
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
                this.limit = 10;
                this.annualReportHoldingRecords = [];
                this.contentDocuments = [];
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

    /**
    * For redirecting to View All page
    */
    handleShowFullRelatedList() {
        var navigationURL = this.baseURL + '/lightning/cmp/c__AnnualReportHoldingsInAccountDataTableView?c__recordId=' + this.recordId + '&c__isCommunity=' + this.isCommunity;
        var url = '/viewall-annualreportsandholdings?recordId=' + this.recordId + '&isCommunity=' + this.isCommunity;

        if (this.isCommunity) {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        } else {
            window.open(navigationURL, "_self");
        }
    }
}