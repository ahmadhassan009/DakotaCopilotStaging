import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import CONTACT_TITLE_FIELD from '@salesforce/schema/Contact.Title';
import CONTACT_ASSET_CLASS_COVERAGE_FIELD from '@salesforce/schema/Contact.Asset_Class_Coverage__c';
import CONTACT_TYPE_FIELD from '@salesforce/schema/Contact.Contact_Type__c';
import CONTACT_EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import activeCommunities from '@salesforce/label/c.active_communities';
import getAccountName from '@salesforce/apex/ContactRelatedToAccountController.getAccountName';
import getFaTeamsAccountsCount from '@salesforce/apex/ChildAccountsInAccountsController.getFaTeamsAccountsCount';
import getFaTeamsAllAccounts from '@salesforce/apex/ChildAccountsInAccountsController.getFaTeamsAllAccounts';
import { refreshApex } from '@salesforce/apex';

const COLUMNS = [
    { label: 'Contact Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    //{ label: 'Account Name', sortable: true, fieldName: "accountLink", type: "url", typeAttributes: { label: { fieldName: 'accountName'}, tooltip: { fieldName: 'accountName' }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: CONTACT_TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Email', sortable: true, fieldName: CONTACT_EMAIL_FIELD.fieldApiName, type: 'email' },
    { label: 'Asset Class Coverage', sortable: true, fieldName: CONTACT_ASSET_CLASS_COVERAGE_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Contact Type', sortable: true, fieldName: CONTACT_TYPE_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Metro Area', sortable: true, fieldName: "MetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' } },
]

export default class FaTeamsRelatedToAccountViewAll extends LightningElement {
    @api recordId;
    recordsExists = false;
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
    sortedBy = 'recordLink';
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
        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordName = returnedAccount.Name;
                this.recordType = returnedAccount.Type;
                this.setLinks();
                if (this.recordType && this.faTeamsList.includes(this.recordType)) {
                    this.listName = 'FA Contacts';
                    getFaTeamsAccountsCount({
                        recordId: this.recordId
                    }).then(count => {
                        if (count) {
                            this.totalCount =  count;
                            this.fetchData(this.recordId,'Name', this.sortedDirection, this.limit, this.offset);
                            
                        }
                    }).catch(error => {
                        console.log( error);
                    });
                }
            }
        });
    }

    fetchData(recordId,tempSort,sortedDirection,limit,offset) {
        if (this.sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        getFaTeamsAllAccounts({
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

                    returnedData.recordLink = "/" + this.communityName + "/s/detail/" + returnedData.Id;
                    if (returnedData.Metro_Area__c) {
                        returnedData.MetroAreaLink = "/" + this.communityName + "/s/detail/" + returnedData.Metro_Area__c;
                        returnedData.MetroAreaName = returnedData.Metro_Area__r.Name;
                    }
                    if (returnedData.AccountId) {
                        returnedData.accountLink = "/" + this.communityName + "/s/detail/" + returnedData.AccountId;
                        returnedData.accountName = returnedData.Account.Name;
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

        if (this.sortedBy === 'recordLink') {
            tempSortBy = CONTACT_NAME_FIELD.fieldApiName;
        }
        else if (this.sortedBy === 'MetroAreaLink') {
            tempSortBy = 'Metro_Area__r.Name';
        }
        else if (this.sortedBy === 'accountLink') {
            tempSortBy = 'Account.Name';
        }

        this.nameSortDir = this.sortedDirection;
    
        this.fetchData(this.recordId,tempSortBy, this.sortedDirection, this.offset, 0);
    }
    loadMoreData(event) {
        if (this.totalCount > this.offset && this.offset != 0) {
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

        if (this.sortedBy === 'recordLink') {
            tempSortBy = CONTACT_NAME_FIELD.fieldApiName;
        }
        else if (this.sortedBy === 'MetroAreaLink') {
            tempSortBy = 'Metro_Area__r.Name';
        }
        else if (this.sortedBy === 'accountLink') {
            tempSortBy = 'Account.Name';
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
        this.sortedBy = 'recordLink';
        this.data = [];
        refreshApex(this.connectedCallback());
    }
}