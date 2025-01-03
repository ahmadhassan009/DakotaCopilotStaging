import { LightningElement, api, track } from 'lwc';
import getAllRelatedSortedContactsofAccount from '@salesforce/apex/RelatedContactofAccountController.getAllRelatedSortedContactsofAccount';
import getRelatedContactCount from '@salesforce/apex/RelatedContactofAccountController.getRelatedContactCount';
import isForm5500Record from '@salesforce/apex/RelatedContactofAccountController.isForm5500Record';
import activeCommunities from '@salesforce/label/c.active_communities';
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import ROLES from '@salesforce/schema/AccountContactRelation.Roles';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';

const actions = [
    { label: 'View Relationship', name: 'view' },
    { label: 'Edit Relationship', name: 'edit' },
    { label: 'Remove Relationship', name: 'delete' },
];

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

export default class IndirectRelatedContactsofAccountViewAll extends NavigationMixin(LightningElement) {

    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';

    @api recordId;
    @api recordName;
    @api totalRelatedContactRecordCount;
    @api isCommunity;
    allRelatedContacts;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = 'ContactLink';
    nameSortDir = this.defaultSortDirection;
    columns;
    plusSign = null;
    offset = 0;
    limit = 50;
    recordLink;
    maNameLink;
    isCommunityBoolean;
    isTableRefresh = false;
    @track isLoading = false;
    tempAddAction = [];
    @api isSalesforceInstance = false;
    fieldsMapping;
    infiniteLoading = false;
    listTitle = '';
    isForm5500 = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunityBoolean;
    }

    refreshTable(event) {
        this.isTableRefresh = true;
        this.offset = 0;
        this.limit = 50;
        if (event != undefined && event.currentTarget.name == 'refreshButton') {
            this.sortedBy = 'ContactLink';
            this.sortedDirection = 'asc';
        }

        this.allRelatedContacts = null;
        var table = this.template.querySelector('lightning-datatable');
        if (table != null)
            table.enableInfiniteLoading = true;
        return refreshApex(this.connectedCallback());
    }

    handleEvent = event => {

        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.refreshTable();

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
                this.offset = 0;
                this.limit = 50;
                var table = this.template.querySelector('lightning-datatable');
                table.enableInfiniteLoading = true;
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
            console.error('Received error from server: ', error);
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

    connectedCallback() {
        // Define Field Mappings for URL Fields
        const fieldsMapping = new Map();
        fieldsMapping.set("AccountLink", 'Contact.Account.Name');
        fieldsMapping.set("ContactLink", 'Contact.Name');
        fieldsMapping.set("ContactTitle", 'Contact.Title');
        fieldsMapping.set("ContactEmail", 'Contact.Email');
        fieldsMapping.set("ContactPhone", 'Contact.Phone');
        this.fieldsMapping = fieldsMapping;

        this.isLoading = true;
        if (this.isCommunity == 'false' || this.isCommunity == false) {
            this.isCommunityBoolean = false;
        }
        else {
            this.isCommunityBoolean = true;
        }
        this.checkIsCommunityInstance();
        this.tempAddAction = null;

        // To set links for breadcrumbs
        this.setLinks();

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
            if (!this.isCommunityBoolean) {
                this.tempAddAction = [...this.tempAddAction, {
                    type: 'action',
                    typeAttributes: { rowActions: actions },
                }];
            }
            this.columns = this.tempAddAction;
            getRelatedContactCount({
                recordId: this.recordId,
                isForm5500: this.isForm5500

            }).then(contactRecordCount => {
                if (contactRecordCount) {

                    this.totalRelatedContactRecordCount = contactRecordCount;
                }
            }).catch(error => {
                console.log("Error:", error);
            });

            let sortingField = this.sortedBy;
            if (this.fieldsMapping.has(this.sortedBy)) {
                sortingField = this.fieldsMapping.get(this.sortedBy);
            } else if (this.sortedBy === 'AssetClassCoverage') {
                sortingField = 'Contact.Asset_Class_Coverage__c';
            } else if (this.sortedBy === 'ContactType') {
                sortingField = 'Contact.Contact_Type__c';
            }
            if (this.sortedDirection == 'desc') {
                this.nullOrder = 'LAST';
            }
            else {
                this.nullOrder = 'FIRST';
            }

            getAllRelatedSortedContactsofAccount({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset,
                sortBy: sortingField,
                sortOrder: this.sortedDirection,
                isForm5500: this.isForm5500
            }).then(allRelatedContacts => {
                if (allRelatedContacts) {
                    var tempContactList = [];
                    for (var i = 0; i < allRelatedContacts.length; i++) {
                        let tempContactRecord = Object.assign({}, allRelatedContacts[i]); //cloning object
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
                                tempContactRecord.ContactName = tempContactRecord.Contact.Name;
                                tempContactRecord.ContactPhone = tempContactRecord.Contact.Phone;
                                if(!this.isForm5500 && tempContactRecord.Contact.Account != undefined)
                                {
                                    tempContactRecord.AccountofContact = tempContactRecord.Contact.Account.Name;
                                }
                        }
                        tempContactRecord.ContactTitle = tempContactRecord.Contact.Title;
                        tempContactRecord.ContactEmail = tempContactRecord.Contact.Email;
                        
                        tempContactList.push(tempContactRecord);
                    }
                    this.allRelatedContacts = tempContactList;
                    this.offset = this.allRelatedContacts.length;

                    // For showing + sign with count
                    if ((this.offset) >= this.totalRelatedContactRecordCount) {
                        this.plusSign = '';
                    }
                    else {
                        this.plusSign = '+';
                    }
                    this.isLoading = false;
                    this.infiniteLoading = false;
                    this.isTableRefresh = false;
                }
            }).catch(error => {
                this.infiniteLoading = false;
                console.log("Error:", error);
            });
        }).catch(error => {
            console.log('errorrr ', error);
        });
    }

    onHandleSort(event) {
        this.infiniteLoading = true;
        var sortedField = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.sortedBy = sortedField;
        this.refreshTable();
    }

    loadMoreData(event) {
        if (this.totalRelatedContactRecordCount > this.offset) {
            if (this.infiniteLoading)
                return;
            this.infiniteLoading = true;

            //Display a spinner to signal that data is being loaded
            if (this.allRelatedContacts != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            let sortingField = this.sortedBy;
            if (this.fieldsMapping.has(this.sortedBy)) {
                sortingField = this.fieldsMapping.get(this.sortedBy);
            }
            getAllRelatedSortedContactsofAccount({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset,
                sortBy: sortingField,
                sortOrder: this.sortedDirection,
                isForm5500: this.isForm5500
            }).then(relatedContacts => {
                var tempContactList = [];
                for (var i = 0; i < relatedContacts.length; i++) {
                    let tempContactRecord = Object.assign({}, relatedContacts[i]); //cloning object
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
                            tempContactRecord.ContactName = tempContactRecord.Contact.Name;
                            tempContactRecord.ContactPhone = tempContactRecord.Contact.Phone;
                            if(!this.isForm5500 && tempContactRecord.Contact.Account != undefined)
                            {
                                tempContactRecord.AccountofContact = tempContactRecord.Contact.Account.Name;
                            }
                    }
                    tempContactRecord.ContactTitle = tempContactRecord.Contact.Title;
                    tempContactRecord.ContactEmail = tempContactRecord.Contact.Email;
                    
                    tempContactList.push(tempContactRecord);
                }

                if (this.allRelatedContacts)
                    this.allRelatedContacts = this.allRelatedContacts.concat(tempContactList);
                if (!this.isTableRefresh) {
                    if ((this.offset + 50) >= this.totalRelatedContactRecordCount) {
                        this.offset = this.totalRelatedContactRecordCount;
                        this.plusSign = '';
                    }
                    else {
                        this.offset = parseInt(this.offset) + parseInt(this.limit);
                        this.plusSign = '+';
                    }
                }

                this.loadMoreStatus = '';
                if (this.allRelatedContacts != null && this.allRelatedContacts.length >= this.totalRecordCount) {
                    this.tableElement.enableInfiniteLoading = false;
                    this.loadMoreStatus = 'No more data to load';
                }
                else if (this.allRelatedContacts == null) {
                    this.tableElement.enableInfiniteLoading = false;
                    this.loadMoreStatus = 'No more data to load';

                }
                this.infiniteLoading = false;
                if (this.tableElement) {
                    this.tableElement.isLoading = false;
                }

            }).catch(error => {
                this.infiniteLoading = false;
            });
        }

    }

    createNewRecord(event) {

        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });

        onError(error => {
            console.error('Received error from server: ', error);
        });

        let newContactRecord = {
            type: 'standard__objectPage',
            attributes: { objectApiName: 'AccountContactRelation', actionName: 'new' },
            state: {
                defaultFieldValues: "AccountId=" + this.recordId,
                navigationLocation: 'RELATED_LIST'
            }
        };
        this[NavigationMixin.Navigate](newContactRecord);
    }

    // Set breadcrumb links
    setLinks() {
        if (this.isCommunityBoolean) {
            this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
            this.maNameLink = "/" + this.communityName + '/s/account/Account/Default';
        } else {
            this.recordLink = '/' + this.recordId;
            this.maNameLink = '/one/one.app#/sObject/Account/list?filterName=Recent';
        }
    }
}