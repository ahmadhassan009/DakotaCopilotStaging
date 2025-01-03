import { LightningElement, api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE_FIELD from '@salesforce/schema/Account.Type';
import METROAREA_FIELD from '@salesforce/schema/Account.Metro_Area_Name__c';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';
import WEBSITE_FIELD from '@salesforce/schema/Account.Website';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import { refreshApex } from '@salesforce/apex';
import getFaTeamsAllChildAccounts from '@salesforce/apex/ChildAccountsInAccountsController.getFaTeamsAllChildAccounts';
import getAccountsCount from '@salesforce/apex/ChildAccountsInAccountsController.getAccountsCount';
import CURRENCY from '@salesforce/i18n/currency';
import LOCALE from '@salesforce/i18n/locale';
import activeCommunities from '@salesforce/label/c.active_communities';

import getAccountName from '@salesforce/apex/ContactRelatedToAccountController.getAccountName';


const COLUMNS = [
    { label: 'Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName } } },
    { label: 'Type', sortable: true, fieldName: TYPE_FIELD.fieldApiName, type: 'text', },
    { label: 'Metro Area', sortable: true, fieldName: 'MetroArea__c', type: 'url', typeAttributes: { label: { fieldName: METROAREA_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: METROAREA_FIELD.fieldApiName } } },
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'text' },
    { label: 'Website',sortable: true, fieldName: WEBSITE_FIELD.fieldApiName, type: 'url', typeAttributes: { label: { fieldName: WEBSITE_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: WEBSITE_FIELD.fieldApiName }}}
]
export default class FaTeamChildAccountRelatedToAccount extends LightningElement {
    @api recordId;
    columns = COLUMNS;
    data;
    offset = 0;
    limit = 50;
    baseURL = '';
    recordToDel;
    accountNameLink;
    recordName;
    totalCount;
    dataSorting = false;
    fromLoadMore = false;
    infiniteLoading = false;
    isLoading = true;
    plusSign;
    totalRecords = '0';
    nullOrder = 'LAST';
    isCommunity = true;
    tempSortBy = '';
    defaultSortDirection = 'asc';;
    isLoading = false;
    listName = '';
    recordType = '';
    faTeamsList = ['Bank','Broker-Dealer','Broker Dealer'];
    sortedDirection = 'asc';
    sortedBy = 'Id';
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'FIRST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    setLinks() {
        if (this.isCommunity) {
            this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
            this.accountNameLink = "/" + this.communityName + '/s/account/Account/Default';
        } else {
            this.recordLink = '/' + this.recordId;
            this.accountNameLink = '/one/one.app#/sObject/Account/list?filterName=Recent';
        }
    }
    connectedCallback() {
        this.isLoading = true;
        this.setLinks();
        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordName = returnedAccount.Name;
                getAccountsCount({
                    recordId: this.recordId,
                    listType: ''
                }).then(returnedCount => {
                    this.totalCount = returnedCount
                    this.fetchData(this.recordId, 'Name', this.sortedDirection, this.limit, this.offset)
                }).catch(error => {
                    console.log(error);
                    this.isLoading = false;
                });
            }
        });
    }

    fetchData(recordId, tempSort, sortedDirection, limit, offset) {
        if (this.sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        getFaTeamsAllChildAccounts({
            recordId: recordId,
            sortBy: tempSort,
            sortOrder: sortedDirection,
            nullOrder: this.nullOrder,
            recordLimit: limit,
            offset: offset,

        }).then((returnRecords) => {
            if (returnRecords) {
                let len = returnRecords.length;
                let recordList = [];
                for (let i = 0; i < len; i++) {
                    let returnedData = Object.assign({}, returnRecords[i]); //cloning object

                    returnedData.Id = "/" + this.communityName + '/s/account/' + returnedData.Id;
                    if (returnedData.MetroArea__c != null)
                        returnedData.MetroArea__c = "/" + this.communityName + '/s/metro-area/' + returnedData.MetroArea__c;
                    if (returnedData.AUM__c != null) {
                        var number = parseFloat(returnedData.AUM__c);
                        returnedData.AUM__c = new Intl.NumberFormat(LOCALE, {
                            style: 'currency',
                            currency: CURRENCY,
                            currencyDisplay: 'symbol'
                        }).format(number);
                        returnedData.AUM__c = returnedData.AUM__c.replace('.00', '');
                    }


                    recordList.push(returnedData);
                }

                if (this.fromLoadMore) {
                    if (this.data)
                        this.data = this.data.concat(recordList);
                    if ((this.offset + this.limit) >= this.totalCount || (this.offset) == 0) {
                        this.offset = this.totalCount;
                        this.totalRecords = this.offset;
                    } else {
                        this.offset = parseInt(this.offset) + parseInt(this.limit);
                        this.totalRecords = this.offset + '+';
                    }

                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                    }
                    this.fromLoadMore = false;
                    this.infiniteLoading = false;
                } else {
                    this.data = recordList;
                }

                this.offset = this.data.length;
                if ((this.data.length) >= this.totalCount) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }
            } else {
                this.data = null;
            }
            this.isLoading = false;
            if (this.dataSorting) {
                this.dataSorting = false;
            }
        }).catch((error) => {
            console.log(error);
            this.isLoading = false;
            this.infiniteLoading = false;
        });
        //this.sortedDirection = 'asc';
        //this.sortedBy = CONTACT_NAME_FIELD.fieldApiName;
    }

    updateColumnSorting(event) {
        this.isLoading = true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.dataSorting = true;
        this.data = [];

        let tempSortBy = this.sortedBy;

        if(this.sortedBy === 'MetroArea__c') {
            tempSortBy = METROAREA_FIELD.fieldApiName;
        } 
        else if(this.sortedBy === 'Id') {
            tempSortBy = NAME_FIELD.fieldApiName;
        }

        //this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
    
        this.fetchData(this.recordId,tempSortBy, this.sortedDirection, this.offset, 0);
    }

    loadMoreData(event) {
        if (this.totalCount > this.offset &&  this.offset != 0 ) {
            if (this.infiniteLoading) {
                return;
            }
            if (this.dataSorting) {
                return;
            }
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if (this.data != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            this.fromLoadMore = true;
            //this.setFieldSorting();
            let tempSortBy = this.sortedBy;

            if(this.sortedBy === 'MetroArea__c') {
                tempSortBy = METROAREA_FIELD.fieldApiName;
            } 
            else if(this.sortedBy === 'Id') {
                tempSortBy = NAME_FIELD.fieldApiName;
            }
            this.fetchData(this.recordId, tempSortBy, this.sortedDirection, this.limit, this.offset);

        }
    }

    refreshTable() {
        this.offset = 0;
        this.limit = 50;
        this.plusSign = '';
        this.sortedDirection = 'asc';
        this.defaultSortDirection = 'asc';
        this.nameSortDir = this.defaultSortDirection;
        this.sortedBy = 'Id';
        this.data = [];
        refreshApex(this.connectedCallback());
    }
}