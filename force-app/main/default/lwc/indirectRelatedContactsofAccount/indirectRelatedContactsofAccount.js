import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getRelatedContactsToAccount from '@salesforce/apex/RelatedContactofAccountController.getRelatedContactsToAccount';
import getRelatedContactCount from '@salesforce/apex/RelatedContactofAccountController.getRelatedContactCount';
import isForm5500Record from '@salesforce/apex/RelatedContactofAccountController.isForm5500Record';

import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getAccountName from '@salesforce/apex/RelatedContactofAccountController.getAccountName';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import ROLES from '@salesforce/schema/AccountContactRelation.Roles';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';

const COLUMNS = [
    { label: 'Contact Name', sortable: true, fieldName: "ContactLink", type: "url", typeAttributes: { label: { fieldName: 'ContactName' }, tooltip: { fieldName: 'ContactName' }, target: '_self' } },
    { label: 'Account Name', sortable: true, fieldName: "AccountLink", type: 'url', typeAttributes: { label: { fieldName: 'AccountofContact' }, tooltip: { fieldName: 'AccountofContact' }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: 'ContactTitle', type: 'Text' },
    { label: 'Email', sortable: true, fieldName: 'ContactEmail', type: 'email' },
    { label: 'Phone', sortable: true, fieldName: 'ContactPhone', type: 'Phone' },
    { label: 'Roles', fieldName: ROLES.fieldApiName, type: 'Picklist(Multi-Select)' }
]

const FORM_5500_COLUMNS = [
    { label: 'Contact Name', sortable: true, fieldName: "ContactLink", type: "url", typeAttributes: { label: { fieldName: 'ContactName' }, tooltip: { fieldName: 'ContactName' }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: 'ContactTitle', type: 'Text' },
    { label: 'Phone', sortable: true, fieldName: 'ContactPhone', type: 'Phone' }
]

const actions = [
    { label: 'View Relationship', name: 'view' },
    { label: 'Edit Relationship', name: 'edit' },
    { label: 'Remove Relationship', name: 'delete' },
];
export default class IndirectRelatedContactsofAccount extends NavigationMixin(LightningElement) {

    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';

    @api recordId;
    @api recordName;

    newbuttonPressed = false;
    contactsRelated;
    totalRelatedContactCount = 0;
    columns = COLUMNS;
    isCommunity = false;
    offset = 0;
    limit = 10;
    plusSign = '+';
    baseURL = '';
    tempAddAction = [];
    recordToDel;
    @track isLoading = false;
    setSelectedRows = [];
    collapsed = true;
    indirectContactsExits = false;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = 'Contact.Name';
    nameSortDir = this.defaultSortDirection;
    isForm5500 = false;
    listTitle = '';

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }

    refreshTable(event) {
        return refreshApex(this.connectedCallback());
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
            case 'view':
                this.navigateToRecordViewPage(row);
                break;
            default:
        }
    }

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

    navigateToRecordEditPage(row) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });

        onError(error => {
            console.error('Received error from server SF: ', error);
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

    navigateToRecordViewPage(row) {
        let { Id } = row;

        this[NavigationMixin.Navigate]({

            type: 'standard__recordPage',
            attributes: {
                recordId: Id,
                actionName: 'view'
            }
        });
    }

    handleEvent = event => {
        this.newbuttonPressed = false;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.checkIsCommunityInstance();

        getSFBaseUrl().
            then(baseURL => {
                if (baseURL) {
                    this.baseURL = baseURL;
                }
            })
            .catch(error => {
                console.log("Error:", error);
            });
        this.refreshTable();
    }

    @api
    clearAll() {
        this.setSelectedRows = [];
    }

    connectedCallback() {
        this.isLoading = true;

        this.checkIsCommunityInstance();
        getSFBaseUrl().
            then(baseURL => {

                if (baseURL) {
                    this.baseURL = baseURL;
                }
            })
            .catch(error => {
                console.log("Error:", error);
            });

        this.sortedDirection = 'asc';
        this.sortedBy = 'Contact.Name';
        isForm5500Record({
            recordId: this.recordId,
        }).then(isForm5500 => {
            this.isForm5500 = isForm5500;
            if (this.isForm5500) {
                this.listTitle = 'Contacts ';
                this.tempAddAction = FORM_5500_COLUMNS;
            }
            else {
                this.listTitle = 'Consultant Contacts ';
                this.tempAddAction = COLUMNS;
            }
            if (!this.isCommunity) {
                this.tempAddAction = [...this.tempAddAction, {
                    type: 'action',
                    typeAttributes: { rowActions: actions },
                }];
            }
            this.columns = this.tempAddAction;
            this.getRelatedContactsToAccounts(this.recordId, this.sortedBy, this.sortedDirection);
            this.getRelatedContactCount();
        }).catch(error => {
            console.log('errorrr ', error);
        });
    }

    getRelatedContactCount() {
        getRelatedContactCount({
            recordId: this.recordId,
            isForm5500: this.isForm5500

        }).then(contactRecordCount => {
            if (contactRecordCount == 0 && (this.communityName == 'dakotaMarketplace' || this.communityName == 'marketplace2')) {
                this.indirectContactsExits = false;
            }
            else {
                this.indirectContactsExits = true;
            }
            this.totalRelatedContactCount = contactRecordCount;
            if ((this.offset) >= this.totalRelatedContactCount) {
                this.plusSign = '';
            }
            else {
                this.plusSign = '+';
            }
        }).catch(error => {
        });
    }

    getRelatedContactsToAccounts(recordId, sortedBy, sortedDirection) {
        this.isLoading = true;
        getRelatedContactsToAccount({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            isForm5500: this.isForm5500
        }).then(relatedContactsToAccount => {
            if (relatedContactsToAccount) {
                var tempContactList = [];
                for (var i = 0; i < relatedContactsToAccount.length; i++) {
                    let tempContactRecord = Object.assign({}, relatedContactsToAccount[i]); //cloning object
                    if (this.isCommunity) {
                        if (tempContactRecord.ContactId != undefined) {
                            tempContactRecord.ContactLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.ContactId;
                            tempContactRecord.ContactName = tempContactRecord.Contact.Name;
                        }
                        if (tempContactRecord.AccountId != undefined)
                                tempContactRecord.AccountLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.Contact.AccountId;
                    } else {
                        if (tempContactRecord.ContactId != undefined) {
                            tempContactRecord.ContactLink = "/" + tempContactRecord.ContactId;
                            tempContactRecord.ContactName = tempContactRecord.Contact.Name;
                        }
                        if (tempContactRecord.AccountId != undefined)
                            tempContactRecord.AccountLink = "/" + tempContactRecord.Contact.AccountId;
                    }
                    if (tempContactRecord.Contact != undefined) {
	                    if (tempContactRecord.Contact != undefined) {	
                            tempContactRecord.ContactName = tempContactRecord.Contact.Name;	
                            tempContactRecord.ContactPhone = tempContactRecord.Contact.Phone;	
                            if(!this.isForm5500 && tempContactRecord.Contact.Account != undefined)	
                            {	
                                tempContactRecord.AccountofContact = tempContactRecord.Contact.Account.Name;	
                            }	
                    }
                    }
                    tempContactRecord.ContactTitle = tempContactRecord.Contact.Title;
                    tempContactRecord.ContactEmail = tempContactRecord.Contact.Email;
                    
                    tempContactList.push(tempContactRecord);
                }
                this.contactsRelated = tempContactList;
                this.offset = this.contactsRelated.length;
                this.isLoading = false;
                if ((this.offset) >= this.totalRelatedContactCount) {
                    this.plusSign = '';
                }
                else {
                    this.plusSign = '+';
                }

                if (this.offset > 0) {
                    this.collapsed = false;
                }
                else {
                    this.collapsed = true;
                }
            }
        }).catch(error => {
            console.log('error: ', error)
            this.isLoading = false;
        });
    }

    get recordContactCountCondition() {
        if (this.totalRelatedContactCount == 10) {
            return false;
        }

        if (this.totalRelatedContactCount > 9) {
            return true;
        } else {
            return false
        }
    }

    @wire(getAccountName, { recordId: '$recordId' })
    loadMetroAreaName(AccountName) {
        if (AccountName.data) {
            this.recordName = AccountName.data[0].Name;
        }
    }

    handleShowFullRelatedList() {
        if (this.isForm5500) {
            var navigationURL = this.baseURL + '/lightning/cmp/c__RelatedContactofAccountTableView?c__recordId=' + this.recordId + '&c__recordName=' + this.recordName + '&c__totalRelatedContactRecordCount=' + this.totalRelatedContactCount + '&c__isCommunity=' + this.isCommunity;
            var url = '/plan-administrator-contacts?recordId=' + this.recordId + '&recordName=' + this.recordName + '&totalRelatedContactRecordCount=' + this.totalRelatedContactCount + '&isCommunity=' + this.isCommunity;
        }
        else {
            var navigationURL = this.baseURL + '/lightning/cmp/c__RelatedContactofAccountTableView?c__recordId=' + this.recordId + '&c__recordName=' + this.recordName + '&c__totalRelatedContactRecordCount=' + this.totalRelatedContactCount + '&c__isCommunity=' + this.isCommunity;
            var url = '/view-relatedcontactsofaccount?recordId=' + this.recordId + '&recordName=' + this.recordName + '&totalRelatedContactRecordCount=' + this.totalRelatedContactCount + '&isCommunity=' + this.isCommunity;
        }

        if (this.isCommunity) {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
        else {
            window.open(navigationURL, "_self");
        }
    }

    addRelationship(event) {

        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });

        onError(error => {
            console.error('Received error from server SF: ', error);
        });
        this.newbuttonPressed = true;
        let newContactRecord = {
            type: 'standard__objectPage',
            attributes: { objectApiName: 'AccountContactRelation', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                defaultFieldValues: "AccountId=" + this.recordId
            },
        };
        this[NavigationMixin.Navigate](newContactRecord);
    }

    /**
     * For sorting the table
     * @param {*} event 
     */
    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let tempSortBy = this.sortedBy;
        if (this.sortedBy === 'ContactLink') {
            tempSortBy = 'Contact.Name';
        } else if (this.sortedBy === 'AccountLink') {
            tempSortBy = 'Contact.Account.Name';
        }
        else if (this.sortedBy === 'ContactTitle') {
            tempSortBy = 'Contact.Title';
        } else if (this.sortedBy === 'ContactEmail') {
            tempSortBy = 'Contact.Email';
        } else if (this.sortedBy === 'ContactPhone') {
            tempSortBy = 'Contact.Phone';
        } else if (this.sortedBy === 'AssetClassCoverage') {
            tempSortBy = 'Contact.Asset_Class_Coverage__c';
        } else if (this.sortedBy === 'ContactType') {
            tempSortBy = 'Contact.Contact_Type__c';
        }

        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getRelatedContactsToAccounts(this.recordId, tempSortBy, this.sortedDirection);
    }
}