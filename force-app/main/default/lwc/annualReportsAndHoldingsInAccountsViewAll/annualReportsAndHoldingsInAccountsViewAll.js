import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getAccountName from '@salesforce/apex/ContactRelatedToAccountController.getAccountName';
import getRelatedAnnualReportsAndHoldingsCount from '@salesforce/apex/AnnualReportsAndHoldingsController.getRelatedAnnualReportsAndHoldingsCount';
import getAnnualReportsAndHoldingsRecords from '@salesforce/apex/AnnualReportsAndHoldingsController.getAnnualReportsAndHoldingsRecords';
import CorporatePensionCSS from '@salesforce/resourceUrl/CorporatePensionCSS';
import { loadStyle } from 'lightning/platformResourceLoader';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';


const COLUMNS = [{
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
    type: "texte",
    sortable: true
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

export default class AnnualReportsAndHoldingsInAccountsViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    @api isCommunity;
    @track isLoading = false;
    CHANNEL_NAME = '/event/refreshComponents__e';
    subscription = {};
    isCommunityBoolean;
    columns = COLUMNS;
    tempAddAction= [];
    annualReportsRecords;
    accountNameLink;
    recordLink;
    recordName;
    totalAnnualReportsCount;
    infiniteLoading = false;
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = 'ReportYear';
    sfFieldNameForSorting = 'Report_Year__c';
    nameSortDir = this.defaultSortDirection;
    offset = 0;
    limit = 50;
    plusSign;
    openModal = false;
    dataSorting = false;
    newbuttonPressed = false;
    contentDocuments = [];
    annualReportIdToAttachments = [];

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 50 records of Annual Report and Pension Holdings
     */
    connectedCallback() {
        this.isLoading = true;
        this.isCommunityBoolean = this.isCommunity == 'false' ? false : true;
        this.tempAddAction = COLUMNS;

        Promise.all([
            loadStyle(this, CorporatePensionCSS)
        ]);

        if(!this.isCommunityBoolean) {
            this.tempAddAction=[...this.tempAddAction,{
                type: 'action',
                typeAttributes: { rowActions: actions },
               }];
        }
        this.columns = this.tempAddAction;

        this.setLinks();
        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordName = returnedAccount.Name;
            }
        });

        //To fetch number of Annual Reports and Holding records
        getRelatedAnnualReportsAndHoldingsCount({
            recordId: this.recordId
        }).then(annualReportsRecordCount => {
            if(annualReportsRecordCount)
                this.totalAnnualReportsCount = annualReportsRecordCount;
            //To fetch Annual Reports and Holding records
            this.getAnnualReportRecords(this.recordId, 'Report_Year__c', this.sortedDirection,this.offset, this.limit);
        }).catch(error => {
            console.log("Error in fetching total count of Annual Reports and Holdings Data : ", error);
        });
    }

    /**
     * To get Annual Reports and Holdings records linked to the account
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Report Year)
     * @param sortedDirection sorting direction
     */
    getAnnualReportRecords(recordId, sortedBy, sortedDirection, offset, limit) {
        this.isLoading = true;
        //getting Annual Reports and Holdings records based on the passed Account Id
        getAnnualReportsAndHoldingsRecords({
            accountId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            recordLimit: limit,
            offset: offset
        }).then(returnedAnnualReportsAndHoldings => {
            if(returnedAnnualReportsAndHoldings) {
                var tempAnnualReportsList = [];
                for (var i = 0; i < returnedAnnualReportsAndHoldings.length; i++) {
                    let tempAnnualReportsRecord = Object.assign({}, returnedAnnualReportsAndHoldings[i]); //cloning object
                    if (this.isCommunityBoolean) {
                        if (tempAnnualReportsRecord.Id != undefined)
                            tempAnnualReportsRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempAnnualReportsRecord.Id;
                    } else {
                        if (tempAnnualReportsRecord.Id != undefined)
                            tempAnnualReportsRecord.recordLink = "/" + tempAnnualReportsRecord.Id;
                    }

                    if(tempAnnualReportsRecord.AR_Attachments != undefined && tempAnnualReportsRecord.AR_Attachments.length > 0)
                    {
                        this.annualReportIdToAttachments[tempAnnualReportsRecord.Id] = tempAnnualReportsRecord.AR_Attachments;
                        if(tempAnnualReportsRecord.AR_Attachments.length == 1) 
                        {
                            tempAnnualReportsRecord.DocName = 'View PDF';                      
                        }
                        else
                        {
                            tempAnnualReportsRecord.DocName = 'View PDF(s)';
                        }
                    }

                    tempAnnualReportsList.push(tempAnnualReportsRecord);
                }

                this.annualReportsRecords = tempAnnualReportsList;
                this.offset = this.annualReportsRecords.length;

                if ((this.annualReportsRecords.length) >= this.totalAnnualReportsCount) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }
                this.infiniteLoading = false;
            }
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            this.infiniteLoading = false;
            console.log("Error in fetching Annual Reports and Holdings records: ", error);
        });
    }

    /**
     * For sorting the table
     * @param {*} event 
     */
    updateColumnSorting(event) {
        this.isLoading = true;
        this.dataSorting = true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.setSalesforceSortField();

        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.annualReportsRecords = null;
        getAnnualReportsAndHoldingsRecords({
            accountId: this.recordId,
            sortedBy: this.sfFieldNameForSorting,
            sortOrder: this.sortedDirection,
            recordLimit: this.offset,
            offset: 0
        }).then(returnedAnnualReportsAndHoldings => {
            if (returnedAnnualReportsAndHoldings) {
                var tempAnnualReportsList = [];
                for (var i = 0; i < returnedAnnualReportsAndHoldings.length; i++) {
                    let tempAnnualReportsRecord = Object.assign({}, returnedAnnualReportsAndHoldings[i]); //cloning object
                    if (this.isCommunityBoolean) {
                        if (tempAnnualReportsRecord.Id != undefined)
                            tempAnnualReportsRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempAnnualReportsRecord.Id;
                       
                    } else {
                        if (tempAnnualReportsRecord.Id != undefined)
                            tempAnnualReportsRecord.recordLink = "/" + tempAnnualReportsRecord.Id;
                    }

                    if(tempAnnualReportsRecord.AR_Attachments != undefined && tempAnnualReportsRecord.AR_Attachments.length > 0)
                    {
                        this.annualReportIdToAttachments[tempAnnualReportsRecord.Id] = tempAnnualReportsRecord.AR_Attachments;
                        if(tempAnnualReportsRecord.AR_Attachments.length == 1) 
                        {
                            tempAnnualReportsRecord.DocName = 'View PDF';                      
                        }
                        else
                        {
                            tempAnnualReportsRecord.DocName = 'View PDF(s)';
                        }
                    }

                    tempAnnualReportsList.push(tempAnnualReportsRecord);
                }
                this.annualReportsRecords = tempAnnualReportsList;
                this.dataSorting = false;
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    setSalesforceSortField() {
        let tempSortBy = this.sortedBy;
        if (this.sortedBy === 'recordLink') {
            tempSortBy = 'Name';
        } else if (this.sortedBy === 'ReportYear') {
            tempSortBy = 'Report_Year__c';
        } else if (this.sortedBy === 'ReportType') {
            tempSortBy = 'Type__c';
        }
        this.sfFieldNameForSorting = tempSortBy;
    }

    /**
     * For loading more records on scroll down
     * @param {*} event 
     */
    loadMoreData(event) {
        if (this.totalAnnualReportsCount > this.offset) {
            if (this.infiniteLoading) {
                return;
            }
            if(this.dataSorting) {
                return;
            }
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if (this.annualReportsRecords != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            this.setSalesforceSortField();
            getAnnualReportsAndHoldingsRecords({
                accountId: this.recordId,
                sortedBy: this.sfFieldNameForSorting,
                sortOrder: this.sortedDirection,
                recordLimit: this.limit,
                offset: this.offset
            }) .then (returnedAnnualReportsAndHoldings => {
                if (returnedAnnualReportsAndHoldings) {
                    var tempAnnualReportsList = [];
                    for (var i = 0; i < returnedAnnualReportsAndHoldings.length; i++) {
                        let tempAnnualReportsRecord = Object.assign({}, returnedAnnualReportsAndHoldings[i]); //cloning object
                        if (this.isCommunityBoolean) {
                            if (tempAnnualReportsRecord.Id != undefined)
                                tempAnnualReportsRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempAnnualReportsRecord.Id;
                        } else {
                            if (tempAnnualReportsRecord.Id != undefined)
                                tempAnnualReportsRecord.recordLink = "/" + tempAnnualReportsRecord.Id;
                        }
    
                        if(tempAnnualReportsRecord.AR_Attachments != undefined && tempAnnualReportsRecord.AR_Attachments.length > 0)
                        {
                            this.annualReportIdToAttachments[tempAnnualReportsRecord.Id] = tempAnnualReportsRecord.AR_Attachments;
                            if(tempAnnualReportsRecord.AR_Attachments.length == 1) 
                            {
                                tempAnnualReportsRecord.DocName = 'View PDF';                      
                            }
                            else
                            {
                                tempAnnualReportsRecord.DocName = 'View PDF(s)';
                            }
                        }
    
                        tempAnnualReportsList.push(tempAnnualReportsRecord);
                    }

                    if(this.annualReportsRecords)
                        this.annualReportsRecords =  this.annualReportsRecords.concat(tempAnnualReportsList);
                    if((this.offset+50) >= this.totalAnnualReportsCount || (this.offset) == 0)
                    {
                        this.offset = this.totalAnnualReportsCount;
                        this.plusSign = '';
                    } else {
                        this.offset = parseInt(this.offset ) + parseInt(this.limit);
                        this.plusSign = '+';
                    }

                    this.loadMoreStatus = '';
                    if(this.tableElement){
                        this.tableElement.isLoading = false;
                    }
                    this.infiniteLoading = false;    
                }
            }) .catch(error => {
                this.infiniteLoading = false;
                console.log("Error:" , error);
            });
        }
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
        else if(actionName == 'edit') {
            this.navigateToRecordEditPage(row);
        }
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
    refreshTable(event) {
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.sortedDirection = 'desc';
        this.defaultSortDirection = 'desc';
        this.nameSortDir = this.defaultSortDirection;
        this.sortedBy = 'ReportYear';
        this.annualReportsRecords = [];
        this.contentDocuments = [];
        this.plusSign = '';
        this.connectedCallback();
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

    //Edit handler
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

    //Deletion handler
    deleteRow(row) {
        this.isLoading=true;
        let recordToDel= JSON.stringify(row.Id).replace(/['"]+/g, '');

        deleteRecord(recordToDel)
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
                this.annualReportsRecords = [];
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

    // Set breadcrumb links
    setLinks() {
        if (this.isCommunityBoolean) {
            this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
            this.accountNameLink = "/" + this.communityName + '/s/account/Account/Default';
        } else {
            this.recordLink = '/' + this.recordId;
            this.accountNameLink = '/one/one.app#/sObject/Account/list?filterName=Recent';
        }
    }

}