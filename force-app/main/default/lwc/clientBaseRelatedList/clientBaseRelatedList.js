import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getAccountRelatedClientBaseRecords from '@salesforce/apex/ClientBaseRelatedToAccountController.getAccountRelatedClientBaseRecords';
import getAccountRelatedClientBaseCount from '@salesforce/apex/ClientBaseRelatedToAccountController.getAccountRelatedClientBaseCount';
import NAME_FIELD from '@salesforce/schema/Client_Base__c.Name';
import AUM_FIELD from '@salesforce/schema/Client_Base__c.AUM__c';
import TYPE_FIELD from '@salesforce/schema/Client_Base__c.Type__c';
import NUMBER_OF_CLIENTS_FIELD from '@salesforce/schema/Client_Base__c.Number_of_Clients__c';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CURRENCY from '@salesforce/i18n/currency';
import LOCALE from '@salesforce/i18n/locale';

const COLUMNS = [
    { label: 'Client Base Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip: { fieldName: NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Type', sortable: true, fieldName: TYPE_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Number of Clients', sortable: true, fieldName: NUMBER_OF_CLIENTS_FIELD.fieldApiName, type: 'number' },
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'Currency', typeAttributes: { minimumFractionDigits: '0' } },
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

export default class ClientBaseRelatedList extends NavigationMixin(LightningElement) {
    @api recordId;
    @api parentObjectName;
    @api relationshipApiName;
    @track isLoading = false;
    @api isSalesforceInstance = false;
    CHANNEL_NAME = '/event/refreshComponents__e';
    columns = COLUMNS;
    setSelectedRows = [];
    totalRelatedClientBaseCount = 0;
    tempAddAction = [];
    relatedClientBaseRecords;
    isCommunity = false;
    viewAll = false;
    offset = 0;
    limit = 10;
    plusSign = '';
    collapsed = true;
    clientBaseRecordsExists = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = AUM_FIELD.fieldApiName;
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'LAST';

    connectedCallback() {
        this.isLoading = true;
        this.checkIsCommunityInstance();
        this.tempAddAction = COLUMNS;
        if(this.isCommunityBoolean == false) {
            this.tempAddAction = [...this.tempAddAction, {
                type: 'action',
                typeAttributes: { rowActions: actions },
            }];
        }
        this.columns = this.tempAddAction;
        // Get related marketplace ClientBase records for account
        this.fetchData();
    }

    fetchData()
    {
        this.isLoading = true;
        var tempSortBy = this.sortedBy;
        if(this.sortedBy === 'recordLink') {
            tempSortBy = NAME_FIELD.fieldApiName;
        } 
        if (this.sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        getAccountRelatedClientBaseRecords({
            recordId: this.recordId,
            sortBy: tempSortBy,
            sortOrder: this.sortedDirection,
            nullOrder: this.nullOrder
        }).then(relatedMarketplaceClientBase => {
            if (relatedMarketplaceClientBase) {
                var tempClientBaseList = [];
                for (var i = 0; i < relatedMarketplaceClientBase.length; i++) {
                    if (relatedMarketplaceClientBase[i].AUM__c != null) {
                        var number = Math.round(parseFloat((relatedMarketplaceClientBase[i].AUM__c)));

                        if (number < 0) {
                            number = Math.abs(number);
                        }
                        relatedMarketplaceClientBase[i].AUM__c = new Intl.NumberFormat(LOCALE, {
                            style: 'currency',
                            currency: CURRENCY,
                            currencyDisplay: 'symbol'
                        }).format(number);
                        relatedMarketplaceClientBase[i].AUM__c = relatedMarketplaceClientBase[i].AUM__c.replace('.00', '');
                    }
                    let tempRecord = Object.assign({}, relatedMarketplaceClientBase[i]); //cloning object
                    if (this.isCommunity) {
                        tempRecord.recordLink = "/" + this.communityName + "/s/client-base/" + tempRecord.Id;
                    }
                    else {
                        tempRecord.recordLink = "/" + tempRecord.Id;
                    }

                    tempClientBaseList.push(tempRecord);
                }
                this.relatedClientBaseRecords = tempClientBaseList;
                this.offset = this.relatedClientBaseRecords.length;
                if (this.offset > 0) {
                    this.collapsed = false;
                }
                else {
                    this.collapsed = true;
                }

                //To get count of related ClientBase records
                getAccountRelatedClientBaseCount({
                    recordId: this.recordId
                }).then(clientBaseRecordCount => {
                    this.isLoading = false;
                    if (clientBaseRecordCount == 0 && this.communityName == 'dakotaMarketplace') {
                        this.clientBaseRecordsExists = false;
                    }
                    else {
                        this.clientBaseRecordsExists = true;
                    }
                    this.totalRelatedClientBaseCount = clientBaseRecordCount;
                    if (this.offset >= this.totalRelatedClientBaseCount) {
                        this.plusSign = '';
                    }
                    else {
                        this.plusSign = '+';
                    }
                }).catch(error => {
                    this.isLoading = false;
                 });
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    // To refresh table
    refreshTable(event) {
        this.connectedCallback();
    }
    handleEvent = event => {
        this.isLoading = true;
        this.newbuttonPressed = false;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.refreshTable();
    }
    // To create new record
    createNewRecord(event) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            this.subscription = response;
        });

        onError(error => {
            console.error('Received error from server SF: ', error);
        });

        let newSearchRecord = {
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Client_Base__c', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                defaultFieldValues: "Account__c=" + this.recordId
            },
        };
        this[NavigationMixin.Navigate](newSearchRecord);
    }
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
                this.offset = 0;
                this.limit = 50;
                this.relatedSearchesRecords = null;
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
    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
    }

    handleShowFullRelatedList() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Account',
                relationshipApiName: 'Client_Base20__r',
                actionName: 'view'
            }
        });
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.fetchData();
    }
}