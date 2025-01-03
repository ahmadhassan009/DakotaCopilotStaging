import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import getRecords from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getRecords';
import getRecordsCount from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getRecordsCount';
import activeCommunities from '@salesforce/label/c.active_communities';
import NAME_FIELD from '@salesforce/schema/Manager_Presentation__c.Name';
import POSTED_DATE_FIELD from '@salesforce/schema/Manager_Presentation__c.Posted_Date__c';
import MEETING_DATE_FIELD from '@salesforce/schema/Manager_Presentation__c.Meeting_Date__c';
import ACCOUNT_NAME_FIELD from '@salesforce/schema/Manager_Presentation__c.Account_Name__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Manager_Presentation__c.Asset_Class__c';
import SUB_ASSET_FIELD from '@salesforce/schema/Manager_Presentation__c.Sub_Asset_Class__c';

const COLUMNS = [
    { label: 'Manager Presentation Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName } } },
    { label: 'Account Name', sortable: true, fieldName: 'AccountId', type: 'url', typeAttributes: { label: { fieldName: ACCOUNT_NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: ACCOUNT_NAME_FIELD.fieldApiName } } },
    { label: "Asset Class", sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: "text" },
    { label: "Sub-Asset Class", sortable: true, fieldName: SUB_ASSET_FIELD.fieldApiName, type: "text" },
    { label: 'Meeting Date', sortable: true, fieldName: MEETING_DATE_FIELD.fieldApiName, type: 'text' },
    { label: 'Posted Date', sortable: true, fieldName: POSTED_DATE_FIELD.fieldApiName, type: 'text' }
];

export default class AllManagerPresentationRelatedToAccount extends NavigationMixin(LightningElement) {
    @api recordId;

    recordsExists = false;
    columns = COLUMNS;
    data;
    baseURL = '';
    recordToDel;
    panelStyling;
    isLoading = false;
    totalRecords = '0';
    listName = '';
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = 'Meeting_Date__c';
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'FIRST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.fetchRecords();
    }

    fetchRecords() {
        this.isLoading = true;
        let tempSortBy = this.sortedBy;
        if (this.sortedBy === 'Id') {
            tempSortBy = NAME_FIELD.fieldApiName;
        } else if (this.sortedBy === 'AccountId') {
            tempSortBy = ACCOUNT_NAME_FIELD.fieldApiName;
        }
        getRecordsCount({
            recordId: this.recordId
        }).then(returnedCount => {
            this.recordsExists = !(returnedCount == 0);
            this.totalRecords = (returnedCount > 10) ? '10+' : returnedCount;
            if (returnedCount > 0) {
                this.nullOrder = (this.sortedDirection == 'desc') ? 'LAST' : 'FIRST';
                getRecords({
                    recordId: this.recordId,
                    sortBy: tempSortBy,
                    sortOrder: this.sortedDirection,
                    nullOrder: this.nullOrder,
                    recordLimit: 10,
                    offset: 0
                }).then(returnedData => {
                    this.isLoading = false;
                    if (returnedData) {
                        for (let i = 0; i < returnedData.length; i++) {
                            returnedData[i].Id = "/" + this.communityName + '/s/manager-presentation/' + returnedData[i].Id;
                            if (returnedData[i].Account__c) {
                                returnedData[i].AccountId = "/" + this.communityName + '/s/account/' + returnedData[i].Account__c;
                            }
                            const options = {
                                year: 'numeric', month: 'numeric', day: 'numeric'
                            };
                            if (returnedData[i].Posted_Date__c != null) {
                                let dt = new Date(returnedData[i].Posted_Date__c);
                                returnedData[i].Posted_Date__c = new Intl.DateTimeFormat('en-US', options).format(dt);
                            }
                            if (returnedData[i].Meeting_Date__c != null) {
                                let dt = new Date(returnedData[i].Meeting_Date__c);
                                returnedData[i].Meeting_Date__c = new Intl.DateTimeFormat('en-US', options).format(dt);
                            }
                        }
                        this.data = returnedData;
                    } else {
                        this.data = null;
                    }
                }).catch(error => {
                    this.isLoading = false;
                });
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail?.fieldName;
        this.sortedDirection = event.detail?.sortDirection;
        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.fetchRecords();
    }

    handleShowFullRelatedList() {
        let url = '/manager-presentations?recordId=' + this.recordId
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }
}