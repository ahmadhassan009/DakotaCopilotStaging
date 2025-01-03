import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from '@salesforce/apex';
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import getRelatedAccountRecords from '@salesforce/apex/MetroAreaListViewController.getRelatedAccountRecords';
import getRelatedAccountCount from '@salesforce/apex/MetroAreaListViewController.getRelatedAccountCount';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE from '@salesforce/schema/Account.Type';
import AUM from '@salesforce/schema/Account.AUM__c';
import WEBSITE from '@salesforce/schema/Account.Website';
import BILLINGCITY from '@salesforce/schema/Account.BillingCity';
import DESCRIPTION from '@salesforce/schema/Account.Description';
import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';

const COLUMNS = [
    { label: 'Account Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip: { fieldName: NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Type', sortable: true, fieldName: TYPE.fieldApiName, type: 'Picklist' },
    { label: 'Metro Area', sortable: true, fieldName: 'MetroAreaLink', type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' } },
    { label: 'AUM', sortable: true, fieldName: AUM.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: '0' } },
    { label: 'Website', sortable: true, fieldName: WEBSITE.fieldApiName, type: "url" },
    { label: 'Billing City', sortable: true, fieldName: BILLINGCITY.fieldApiName, type: 'Address' },
    { label: 'Description', fieldName: DESCRIPTION.fieldApiName, type: 'Long Text Area' },
]

export default class MetroAreaStatesAllAccountsViewAll extends NavigationMixin(LightningElement) {
    @api stateName;
    isLoading = false;
    columns = COLUMNS;
    totalRelatedAccountsCount = 0;
    relatedAccountsRecords = [];
    offset = 0;
    limit = 50;
    sortedDirection = 'desc';
    sortedBy = AUM.fieldApiName;
    fromLoadMore = false;
    fromRefresh = false;
    isSorted = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);

        this.maNameLink = "/" + this.communityName + '/s/metro-area/Metro_Area__c/Default';
        this.recordLink = "/" + this.communityName + '/s/state-detail-page?stateName=' + this.stateName;
        this.getTotalRecordCount();
        this.getRelatedAccounts(this.stateName, this.sortedBy, this.sortedDirection, this.limit, this.offset);
    }

    getTotalRecordCount() {
        //To get count of related records
        getRelatedAccountCount({
            stateName: this.stateName
        }).then(accountsCount => {
            if (accountsCount) {
                this.totalRelatedAccountsCount = accountsCount;
            }
        }).catch(error => {
            console.log('Error : ', error);
        });
    }

    getRelatedAccounts(stateName, sortedBy, sortedDirection, limit, offset) {
        // Get related records
        getRelatedAccountRecords({
            stateName: stateName,
            sortedBy: sortedBy,
            sortedDirection: sortedDirection,
            recordLimit: limit,
            offset: offset
        }).then(relatedAccounts => {
            if (relatedAccounts) {
                var tempAccountsList = [];
                for (var i = 0; i < relatedAccounts.length; i++) {
                    let tempRecord = Object.assign({}, relatedAccounts[i]); //cloning object  
                    tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                    if (tempRecord.MetroArea__c != undefined) {
                        tempRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempRecord.MetroArea__c;
                        tempRecord.MetroAreaName = tempRecord.MetroArea__r.Name;
                    }
                    tempAccountsList.push(tempRecord);
                }
                if(this.offset==0){
                    this.fromRefresh = false;
                }
                
                if ((this.offset + this.limit) >= this.totalRelatedAccountsCount ) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }
                this.offset += tempAccountsList.length;
                if(this.fromLoadMore){
                    this.relatedAccountsRecords = this.relatedAccountsRecords.concat(tempAccountsList);

                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                      }
                }
                else
                {
                    this.relatedAccountsRecords=[];
                    this.relatedAccountsRecords = tempAccountsList;
                }
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('Error : ', error);
        });
    }

    onHandleSort(event) {
        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;
        if (sortedBy == 'recordLink') {
            this.sortedBy = 'Name';
        } else if (sortedBy == 'MetroAreaLink') {
            this.sortedBy = 'MetroArea__r.Name';
        }
        else {
            this.sortedBy = sortedBy;
        }
        this.sortedDirection = sortDirection;
        this.offset = 0;
        this.isSorted = true;
        this.isLoading = true;
        this.getRelatedAccounts(this.stateName, this.sortedBy, this.sortedDirection, this.limit, this.offset);
        if (this.sortedBy == 'Name') {
            this.sortedBy = 'recordLink';
        }
        if (this.sortedBy == 'MetroArea__r.Name') {
            this.sortedBy = 'MetroAreaLink';
        }
    }

    loadMoreData(event) {
        if (this.totalRelatedAccountsCount > this.relatedAccountsRecords.length ) {
            //Display a spinner to signal that data is being loaded
            if (!this.fromRefresh) {
                if (this.relatedAccountsRecords != null && event.target) {
                    event.target.isLoading = true;
                }
                this.tableElement = event.target;
                this.fromLoadMore = true;
                if (this.sortedBy == 'recordLink') {
                    this.sortedBy = 'Name';
                } else if (this.sortedBy == 'MetroAreaLink') {
                    this.sortedBy = 'MetroArea__r.Name';
                }
                this.offset=this.relatedAccountsRecords.length;
                this.getRelatedAccounts(this.stateName, this.sortedBy, this.sortedDirection, this.limit, this.offset);

                if (this.sortedBy == 'Name') {
                    this.sortedBy = 'recordLink';
                } else if (this.sortedBy == 'MetroArea__r.Name') {
                    this.sortedBy = 'MetroAreaLink';
                }
            }
        }
    }

    refreshTable(event) {
        this.isLoading = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.fromRefresh = true;
        this.fromLoadMore = false;
        this.sortedDirection = 'desc';
        this.relatedAccountsRecords = [];
        this.sortedBy = AUM.fieldApiName;
        var table = this.template.querySelector('lightning-datatable');
        if (table != null)
            table.enableInfiniteLoading = true;
        return refreshApex(this.getRelatedAccounts(this.stateName, this.sortedBy, this.sortedDirection, this.limit, this.offset));
    }

}