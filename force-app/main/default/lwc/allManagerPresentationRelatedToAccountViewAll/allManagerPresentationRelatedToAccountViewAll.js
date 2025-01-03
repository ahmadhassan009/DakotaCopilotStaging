import { LightningElement, api } from 'lwc';
import getRecordsRelatedAccountName from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getAccountName';
import getAllRecords from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getRecords';
import getRecordsCount from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getRecordsCount';
import { refreshApex } from '@salesforce/apex';
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

export default class allManagerPresentationRelatedToAccountViewAll extends LightningElement {
    @api recordId;

    accountNameLink;
    accountDefault;
    plusSign = '';
    columns = COLUMNS;
    isLoading = false;
    totalRelatedCount = 0;
    relatedRecords = [];
    offset = 0;
    limit = 50;
    sortedDirection = 'desc';
    sortedBy = MEETING_DATE_FIELD.fieldApiName;
    fromLoadMore = false;
    fromRefresh = false;
    isSorted = false;
    accountName = '';
    nullOrder = 'LAST'
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.accountNameLink = "/" + this.communityName + '/s/account/' + this.recordId;
        this.accountDefault = "/" + this.communityName + '/s/account/Account/Default';
        this.getTotalRecordCount();
        this.fetchRecord();
        this.getAccountName();
    }

    getAccountName() {
        getRecordsRelatedAccountName({
            recordId: this.recordId
        }).then(result => {
            this.accountName = result.Name;
        }).catch(error => {
            console.log('Error : ', error);
        });
    }

    getTotalRecordCount() {
        getRecordsCount({
            recordId: this.recordId
        }).then(count => {
            if (count) {
                this.totalRelatedCount = count;
            }
        }).catch(error => {
            console.log('Error : ', error);
        });
    }

    setNullOrder(sortedDirection) {
        this.nullOrder = (sortedDirection == 'desc') ? 'LAST' : 'FIRST';
    }

    fetchRecord() {
        this.setNullOrder(this.sortedDirection);
        let sortByField = this.sortedBy;
        if (this.sortedBy == 'Id') {
            sortByField = 'Name';
        } else if (this.sortedBy === 'AccountId') {
            sortByField = ACCOUNT_NAME_FIELD.fieldApiName;
        }
        getAllRecords({
            recordId: this.recordId,
            sortBy: sortByField,
            sortOrder: this.sortedDirection,
            nullOrder: this.nullOrder,
            recordLimit: this.limit,
            offset: this.offset
        }).then(returnedData => {
            let tempList = [];
            if (returnedData.length > 0) {
                for (let i = 0; i < returnedData.length; i++) {
                    let tempRecord = Object.assign({}, returnedData[i]);
                    tempRecord.Id = "/" + this.communityName + '/s/manager-presentation/' + tempRecord.Id;
                    if (tempRecord.Account__c) {
                        tempRecord.AccountId = "/" + this.communityName + '/s/account/' + tempRecord.Account__c;
                    }
                    const options = {
                        year: 'numeric', month: 'numeric', day: 'numeric'
                    };
                    if (tempRecord.Posted_Date__c != null) {
                        let dt = new Date(tempRecord.Posted_Date__c);
                        tempRecord.Posted_Date__c = new Intl.DateTimeFormat('en-US', options).format(dt);
                    }
                    if (tempRecord.Meeting_Date__c != null) {
                        let dt = new Date(tempRecord.Meeting_Date__c);
                        tempRecord.Meeting_Date__c = new Intl.DateTimeFormat('en-US', options).format(dt);
                    }
                    tempList.push(tempRecord);
                }

                if (this.offset == 0) {
                    this.fromRefresh = false;
                }
                this.relatedRecords = this.relatedRecords.concat(tempList);
                this.plusSign = ((this.offset + this.limit) >= this.totalRelatedCount) ? '' : '+';
                this.offset += tempList.length;
                if (this.fromLoadMore) {
                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                    }
                }
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('error in data : ', error);
        });
    }

    onHandleSort(event) {
        if (this.fromLoadMore) {
            setTimeout(() => {
                this.onHandleSort(event);
            }, 1000);
        } else {
            const {
                fieldName: sortedBy,
                sortDirection
            } = event.detail;
            this.offset = 0;
            this.limit = 50;
            this.relatedRecords = [];
            this.isLoading = true;
            this.sortedBy = sortedBy

            this.sortedDirection = sortDirection;
            this.fetchRecord();
        }
    }

    loadMoreData(event) {
        if (this.totalRelatedCount != this.offset && this.offset > 0) {
            if (!this.fromRefresh) {
                if (this.relatedRecords != null && event.target) {
                    event.target.isLoading = true;
                }
                this.tableElement = event.target;
                this.offset = this.relatedRecords.length;
                this.fromLoadMore = true;
                this.fetchRecord();
            }
        }
    }

    async refreshTable(event) {
        this.isLoading = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.fromRefresh = true;
        this.sortedDirection = 'desc';
        this.sortedBy = MEETING_DATE_FIELD.fieldApiName;
        this.relatedRecords = [];
        let table = this.template.querySelector('lightning-datatable');
        await this.getTotalRecordCount();
        if (table != null)
            table.enableInfiniteLoading = true;
        return refreshApex(this.fetchRecord());
    }
}