import { LightningElement, api } from 'lwc';
import getRecordsRelatedAccountName from '@salesforce/apex/PublicPlanMinutesInAccountsController.getRecordsRelatedAccountName';
import getAllRecords from '@salesforce/apex/PublicPlanMinutesInAccountsController.getRecords';
import getRecordsCount from '@salesforce/apex/PublicPlanMinutesInAccountsController.getRecordsCount';
import { refreshApex } from '@salesforce/apex';
import activeCommunities from '@salesforce/label/c.active_communities';
import NAME_FIELD from '@salesforce/schema/Public_Plan_Minute__c.Name';
import POSTED_DATE_FIELD from '@salesforce/schema/Public_Plan_Minute__c.Posted_Date__c';
import MEETING_URL_FIELD from '@salesforce/schema/Public_Plan_Minute__c.Meeting_Minute_URL__c';
import MEETING_DATE_FIELD from '@salesforce/schema/Public_Plan_Minute__c.Meeting_Date__c';

const COLUMNS = [
    { label: 'Public Plan Minute', sortable: true, fieldName: 'Id', type: 'url',initialWidth: 500, typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName } } },
    { label: 'Posted Date', sortable: true, fieldName: POSTED_DATE_FIELD.fieldApiName,initialWidth: 170, type: 'text', },
    { label: 'Meeting Date', sortable: true, fieldName: MEETING_DATE_FIELD.fieldApiName,initialWidth: 170, type: 'text' },
    { label: 'Meeting Minutes URL', sortable: true, fieldName: MEETING_URL_FIELD.fieldApiName, type: 'url', typeAttributes: { label: { fieldName: MEETING_URL_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: MEETING_URL_FIELD.fieldApiName } } }
]

export default class PublicPlanMinutesInAccountsViewAll extends LightningElement {
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
            this.accountName = result;
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
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
    }
    fetchRecord() {

        this.setNullOrder(this.sortedDirection);
        var sortByField = this.sortedBy;
        if(this.sortedBy == 'Id')
        {
            sortByField = 'Name';
        }

        getAllRecords({
            recordId: this.recordId,
            sortBy: sortByField,
            sortOrder: this.sortedDirection,
            nullOrder: this.nullOrder,
            recordLimit: this.limit,
            offset: this.offset
        }).then(returnedData => {
            var tempList = [];
            if (returnedData.length > 0) {
                for (var i = 0; i < returnedData.length; i++) {
                    let tempRecord = Object.assign({}, returnedData[i]);
                    tempRecord.Id = "/" + this.communityName + '/s/public-plan-minute/' + tempRecord.Id;
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

                if ((this.offset + this.limit) >= this.totalRelatedCount) {
                    this.plusSign = '';
                }
                else {
                    this.plusSign = '+';
                }
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

    loadMoreData(event) {
        if (this.totalRelatedCount != this.offset && this.offset > 0) {
            //Display a spinner to signal that data is being loaded
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

    refreshTable(event) {
        this.isLoading = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.fromRefresh = true;
        this.sortedDirection = 'desc';
        this.sortedBy = MEETING_DATE_FIELD.fieldApiName;
        this.relatedRecords = [];
        var table = this.template.querySelector('lightning-datatable');
        if (table != null)
            table.enableInfiniteLoading = true;
        return refreshApex(this.fetchRecord());
    }

}