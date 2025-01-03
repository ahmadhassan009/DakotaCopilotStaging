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
import getFaTeamsAccounts from '@salesforce/apex/ChildAccountsInAccountsController.getFaTeamsAccounts';

const COLUMNS = [
    { label: 'Contact Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    //{ label: 'Account Name', sortable: true, fieldName: "accountLink", type: "url", typeAttributes: { label: { fieldName: 'accountName'}, tooltip: { fieldName: 'accountName' }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: CONTACT_TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Email', sortable: true, fieldName: CONTACT_EMAIL_FIELD.fieldApiName, type: 'email' },
    { label: 'Asset Class Coverage', sortable: true, fieldName: CONTACT_ASSET_CLASS_COVERAGE_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Contact Type', sortable: true, fieldName: CONTACT_TYPE_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Metro Area', sortable: true, fieldName: "MetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' } },
]

export default class FaTeamsRelatedToAccount extends NavigationMixin(LightningElement) {

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
    recordType = '';
    faTeamsList = ['Bank','Broker-Dealer','Broker Dealer'];
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = 'recordLink';
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'FIRST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordType = returnedAccount.Type;
                if (this.recordType && this.faTeamsList.includes(this.recordType)) {
                    this.listName = 'FA Contacts';
                    this.fetchData('Name');
                }
            }
        });
    }

    fetchData(tempSortBy) {
        this.isLoading = true;
        getFaTeamsAccountsCount({
            recordId: this.recordId
        }).then(returnedCount => {
            if (returnedCount > 0 && this.recordType && this.faTeamsList.includes(this.recordType)) {
                this.recordsExists = true;
            }
            else {
                this.recordsExists = false;
            }
            if (returnedCount > 10) {
                this.totalRecords = '10+';
            }
            else {
                this.totalRecords = returnedCount;
            }
            if (returnedCount > 0) {
                if (this.sortedDirection == 'desc') {
                    this.nullOrder = 'LAST';
                }
                else {
                    this.nullOrder = 'FIRST';
                }
                getFaTeamsAccounts({
                    recordId: this.recordId,
                    sortBy: tempSortBy,
                    sortOrder: this.sortedDirection,
                    nullOrder: this.nullOrder
                }).then(returnedData => {
                    if (returnedData) {
                        for (var i = 0; i < returnedData.length; i++) {
                            returnedData[i].recordLink = "/" + this.communityName + "/s/detail/" + returnedData[i].Id;
                            if (returnedData[i].Metro_Area__c) {
                                returnedData[i].MetroAreaLink = "/" + this.communityName + "/s/detail/" + returnedData[i].Metro_Area__c;
                                returnedData[i].MetroAreaName = returnedData[i].Metro_Area__r.Name;
                            }
                            if (returnedData[i].AccountId) {
                                returnedData[i].accountLink = "/" + this.communityName + "/s/detail/" + returnedData[i].AccountId;
                                returnedData[i].accountName = returnedData[i].Account.Name;
                            }
                        }
                        this.data = returnedData;
                        this.isLoading = false;
                    }
                    else {
                        this.data = null;
                        this.isLoading = false;
                    }
                }).catch(error => {
                    this.isLoading = false;
                });
            }
        }).catch(error => {
            console.log(error);
            this.isLoading = false;
        });
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
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
        this.fetchData(tempSortBy);
    }

    handleShowFullRelatedList() {
        var url = '/view-fateamaccounts?recordId=' + this.recordId;

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url,
            }
        });
    }

}