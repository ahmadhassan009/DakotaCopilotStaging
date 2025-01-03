import { LightningElement, api, track, wire } from 'lwc';
import getAllRelatedSortedContactsToMetroArea from '@salesforce/apex/RelatedContactsController.getAllRelatedSortedContactsToMetroArea';
import getRelatedContactCount from '@salesforce/apex/RelatedContactsController.getRelatedContactCount';
import fetchFilterRecordCount from '@salesforce/apex/RelatedContactsController.fetchFilterRecordCount';
import activeCommunities from '@salesforce/label/c.active_communities';
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import TITLE_FIELD from '@salesforce/schema/Contact.Title';
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import CONTACT_TYPE_FIELD from '@salesforce/schema/Contact.Contact_Type__c';
import ASSET_CLASS_COVERAGE_FIELD from '@salesforce/schema/Contact.Asset_Class_Coverage__c';
import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';
import {
    loadStyle,
} from 'lightning/platformResourceLoader';
import followIconStyle from '@salesforce/resourceUrl/followIconStyle';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import ACCOUNT_TYPE from "@salesforce/schema/Account.Type";

const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled: true }
];

const MASTER_RECORD_TYPE = '012000000000000AAA';

const COLUMNSFORNOTINMETROAREA = [
    {
        type: "button-icon",
        initialWidth: 50,
        typeAttributes: {
            iconName: {
                fieldName: "favoriteIcon",
            },
            name: "fav_record",
            iconClass: {
                fieldName: "favIconColor",
            },
            variant: "bare",
            title: {
                fieldName: 'iconStatus'
            }
        }
    },
    { label: 'Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Account Name', sortable: true, fieldName: "AccountId", type: 'url', typeAttributes: { label: { fieldName: 'AccountName' }, tooltip: { fieldName: 'AccountName' }, target: '_self' } },
    { label: 'Account Type', sortable: true, fieldName: 'AccountType', type: 'Picklist' },
    { label: 'Account Metro Area ', sortable: true, fieldName: 'MetroAreaName', type: 'text' },
    { label: 'Title', sortable: true, fieldName: TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Email', sortable: true, fieldName: EMAIL_FIELD.fieldApiName, type: 'email' },
    { label: 'Contact Type', sortable: true, fieldName: CONTACT_TYPE_FIELD.fieldApiName, type: 'Picklist' }
]
const COLUMNSFORMETROAREA = [
    {
        type: "button-icon",
        initialWidth: 50,
        typeAttributes: {
            iconName: {
                fieldName: "favoriteIcon",
            },
            name: "fav_record",
            iconClass: {
                fieldName: "favIconColor",
            },
            variant: "bare",
            title: {
                fieldName: 'iconStatus'
            }
        }
    },
    { label: 'Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Account Name', sortable: true, fieldName: "AccountId", type: 'url', typeAttributes: { label: { fieldName: 'AccountName' }, tooltip: { fieldName: 'AccountName' }, target: '_self' } },
    { label: 'Account Type', sortable: true, fieldName: 'AccountType', type: 'Picklist' },
    { label: 'Title', sortable: true, fieldName: TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Email', sortable: true, fieldName: EMAIL_FIELD.fieldApiName, type: 'email' },
    { label: 'Contact Type', sortable: true, fieldName: CONTACT_TYPE_FIELD.fieldApiName, type: 'Picklist' }
]
export default class ContactsRelatedToMaDataTable extends NavigationMixin(LightningElement) {

    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';

    @api recordId;
    @api homeOffice;
    @api recordName;
    @api totalRelatedContactRecordCount;
    @api isCommunity;
    conRecordId;
    @track allRelatedContactsToMa;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = 'recordLink';
    nameSortDir = this.defaultSortDirection;
    NotMetroColumns = COLUMNSFORNOTINMETROAREA;
    MetroColumns = COLUMNSFORMETROAREA;
    plusSign = null;
    checkArea;
    offset = 0;
    limit = 50;
    recordLink;
    maNameLink;
    isCommunityBoolean;
    @track isLoading = false;
    tempAddAction = [];
    @api isSalesforceInstance = false;
    @track allFavoriteRecords = [];
    infiniteLoading = false;
    toastmessage;
    title;
    alternativeText;
    iconName;
    toastMsgClasses;
    toastMsgIconClasses;
    @track showToast = false;
    maxFollowCount = Allowed_Follow_Record_Count;
    @wire(CurrentPageReference) objPageReference;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    accountTypeValue = [];
    contactTypeValue = [];
    assetClassCoverageValue = [];
    oldAccountTypeValue = [];
    oldContactTypeValue = [];
    oldAssetClassCoverageValue = [];
    accountTypeOptions = [];
    contactTypeOptions = [];
    assetClassCoverageOptions = [];
    masterRecordTypeId = '';
    @wire(getPicklistValues, { recordTypeId: '$masterRecordTypeId', fieldApiName: CONTACT_TYPE_FIELD })
    async contactPicklistValues({
        error,
        data
    }) {
        if (data) {
            const contactTypes = [];
            data?.values?.map(opt => {
                const obj = {
                    "label": opt.label,
                    "value": opt.value,
                    "selected": false
                };
                contactTypes.push(obj);
            });
            this.contactTypeOptions = contactTypes;
            this.template.querySelector('[data-id="contactType"]')?.handleListChange(this.contactTypeOptions, true);
        } else if (error) {
            console.debug('Error While Fetching Account Picklist Values', error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$masterRecordTypeId', fieldApiName: ASSET_CLASS_COVERAGE_FIELD })
    async assetClassPicklistValues({
        error,
        data
    }) {
        if (data) {
            const assetClassTypes = [];
            data?.values?.map(opt => {
                const obj = {
                    "label": opt.label,
                    "value": opt.value,
                    "selected": false
                };
                assetClassTypes.push(obj);
            });
            this.assetClassCoverageOptions = assetClassTypes;
            this.template.querySelector('[data-id="assetClassCoverage"]')?.handleListChange(this.assetClassCoverageOptions, true);
        } else if (error) {
            console.debug('Error While Fetching Asset Class Coverage Picklist Values', error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$masterRecordTypeId', fieldApiName: ACCOUNT_TYPE })
    async accountPicklistValues({
        error,
        data
    }) {
        if (data) {
            const accountTypes = [];
            data?.values?.map(opt => {
                const obj = {
                    "label": opt.label,
                    "value": opt.value,
                    "selected": false
                };
                accountTypes.push(obj);
            });
            this.accountTypeOptions = accountTypes;
            this.template.querySelector('[data-id="accountType"]')?.handleListChange(this.accountTypeOptions, true);
        } else if (error) {
            console.debug('Error While Fetching Account Picklist Values', error);
        }
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunityBoolean;
    }

    refreshTable(event) {
        this.isLoading = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.sortedDirection = 'asc';
        this.sortedBy = 'recordLink';
        this.allRelatedContactsToMa = [];
        var table = this.template.querySelector('lightning-datatable');
        this.oldAccountTypeValue = [];
        this.oldContactTypeValue = [];
        this.oldAssetClassCoverageValue = [];
        this.accountTypeValue = [];
        this.contactTypeValue = [];
        this.assetClassCoverageValue = [];
        this.assetClassCoverageOptions.forEach(val => val.selected = false);
        this.contactTypeOptions.forEach(val => val.selected = false);
        this.accountTypeOptions.forEach(val => val.selected = false);
        this.template.querySelector('[data-id="assetClassCoverage"]')?.handleListChange(this.assetClassCoverageOptions, true);
        this.template.querySelector('[data-id="contactType"]')?.handleListChange(this.contactTypeOptions, true);
        this.template.querySelector('[data-id="accountType"]')?.handleListChange(this.accountTypeOptions, true);

        if (table != null)
            table.enableInfiniteLoading = true;
        this.connectedCallback();
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
            case 'fav_record':
                this.followOrUnFollowContact(row);
            default:
        }
    }

    followOrUnFollowContact(row) {
        this.conRecordId = row.Id;
        if (!row.isFavorite) {
            if (this.allFavoriteRecords.length >= Number(this.maxFollowCount)) {
                /** Custom toast message */
                this.toastmessage = 'You cannot follow more than ' + this.maxFollowCount + ' records.';
                this.title = 'Error';
                this.alternativeText = 'Error';
                this.showToast = true;
                this.iconName = 'utility:error';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                setTimeout(() => {
                    this.showToast = false;
                }, 2000);
                console.log('Error ', error);
            }
            else {
                this.isLoading = true;
                let favTargetType = 'Record';
                //let favTargetId = this.conRecordId;
                addToFavorites({
                    recordId: this.conRecordId,
                    targetType: favTargetType
                }).then((createdFavouriteRecord) => {
                    if (createdFavouriteRecord) {
                        var tempList = [];
                        this.allRelatedContactsToMa?.forEach((element, index) => {
                            let temObj = Object.assign({}, element);
                            if (element.Id == this.conRecordId) {
                                temObj.isFavorite = true;
                                temObj.favoriteIcon = 'utility:check';
                                temObj.favId = createdFavouriteRecord.id;
                                temObj.favIconColor = "selectedFavIcon";
                                temObj.iconStatus = 'Click To Unfollow';

                            }
                            tempList.push(temObj);
                        });
                        this.allRelatedContactsToMa = [...tempList];
                        this.allFavoriteRecords.push(createdFavouriteRecord);
                        this.isLoading = false;

                        fireEvent(this.objPageReference, 'updateFavList', '');
                        //Display custom toast message for succesful favorite record created.
                        this.toastmessage = 'Successfully Followed.';
                        this.title = 'Success';
                        this.alternativeText = 'Success';
                        this.showToast = true;
                        this.iconName = 'utility:success';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_success';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-success slds-m-right_small slds-no-flex slds-align-top'
                        setTimeout(() => {
                            this.showToast = false;
                        }, 2000);
                    } else {
                        this.isLoading = false;
                        /** Custom toast message */
                        this.toastmessage = 'Cannot add this record to follow. Contact your administrator for help.';
                        this.title = 'Error';
                        this.alternativeText = 'Error';
                        this.showToast = true;
                        this.iconName = 'utility:error';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
                        setTimeout(() => {
                            this.showToast = false;
                        }, 2000);
                    }
                }).catch((error) => {
                    this.isLoading = false;
                    /** Custom toast message */
                    if (error && error.body && error.body.message && error.body.message.includes("Already added in the followed list")) {
                        this.toastmessage = 'Already following this record. Please refresh your page.';
                        this.title = 'info';
                        this.alternativeText = 'info';
                        this.showToast = true;
                        this.iconName = 'utility:info';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
                        setTimeout(() => {
                            this.showToast = false;
                        }, 2000);
                    }
                    else {
                        this.toastmessage = 'Cannot add this record to follow. Contact your administrator for help.';
                        this.title = 'Error';
                        this.alternativeText = 'Error';
                        this.showToast = true;
                        this.iconName = 'utility:error';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
                        setTimeout(() => {
                            this.showToast = false;
                        }, 2000);
                    }
                });

            }
        } else {
            //Marking record as non-favorite
            this.isLoading = true;
            let favToBeRemovedId = this.conRecordId;
            removeFromFavorites({
                favId: favToBeRemovedId
            }).then(() => {
                var tempList = [];
                this.allRelatedContactsToMa.forEach((element, index) => {
                    let temObj = Object.assign({}, element);
                    if (element.Id == this.conRecordId) {
                        temObj.isFavorite = false;
                        temObj.favoriteIcon = 'utility:add';
                        temObj.favId = '';
                        temObj.favIconColor = "slds-icon-text-light addIconStyling";
                        temObj.iconStatus = 'Click To follow';

                    }
                    tempList.push(temObj);
                });
                this.allRelatedContactsToMa = [...tempList];
                this.isLoading = false;

                //Remove the non-favourite record from the favorite list.
                for (let i = 0; i < this.allFavoriteRecords.length; i++) {
                    if (this.allFavoriteRecords[i].Target_Id__c == favToBeRemovedId) {
                        this.allFavoriteRecords.splice(i, 1);
                        break;
                    }
                }
                fireEvent(this.objPageReference, 'updateFavList', '');
                /** Custom toast message */
                this.toastmessage = 'Successfully Unfollowed.';
                this.title = 'Info';
                this.alternativeText = 'Info';
                this.showToast = true;
                this.iconName = 'utility:info';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
                setTimeout(() => {
                    this.showToast = false;
                }, 2000);

            }).catch((error) => {
                console.log('Error ', error);
                this.isLoading = false;
                /** Custom toast message */
                this.toastmessage = 'Cannot remove this record from follow. Contact your administrator for help.';
                this.title = 'Error';
                this.alternativeText = 'Error';
                this.showToast = true;
                this.iconName = 'utility:error';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                setTimeout(() => {
                    this.showToast = false;
                }, 2000);
            });
        }
    }

    removeFromFollowList(objPayLoad) {
        let favToBeRemovedId = objPayLoad;
        removeFromFavorites({
            favId: favToBeRemovedId
        }).then(() => {
            var tempList = [];
            this.allRelatedContactsToMa?.forEach((element, index) => {
                let temObj = Object.assign({}, element);
                if (element.Id == objPayLoad) {
                    temObj.isFavorite = false;
                    temObj.favoriteIcon = 'utility:add';
                    temObj.favId = '';
                    temObj.favIconColor = "slds-icon-text-light addIconStyling";
                    temObj.iconStatus = 'Click To follow';

                }
                tempList.push(temObj);
            });
            this.allRelatedContactsToMa = [...tempList];
            this.isLoading = false;

            //Remove the non-favourite record from the favorite list.
            for (let i = 0; i < this.allFavoriteRecords.length; i++) {
                if (this.allFavoriteRecords[i].Target_Id__c == favToBeRemovedId) {
                    this.allFavoriteRecords.splice(i, 1);
                    break;
                }
            }
            fireEvent(this.objPageReference, 'updateFavList', '');
            /** Custom toast message */
            this.toastmessage = 'Successfully Unfollowed.';
            this.title = 'Info';
            this.alternativeText = 'Info';
            this.showToast = true;
            this.iconName = 'utility:info';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);

        }).catch((error) => {
            console.log('Error ', error);
            this.isLoading = false;
            /** Custom toast message */
            this.toastmessage = 'Cannot remove this record from follow. Contact your administrator for help.';
            this.title = 'Error';
            this.alternativeText = 'Error';
            this.showToast = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);
        });
    }

    getAllFavoriteRecordsFromAPI() {
        getAllFavoriteRecords({}).then(returnedfavouriteRecords => {
            if (returnedfavouriteRecords != null && returnedfavouriteRecords.length > 0) {
                this.allFavoriteRecords = returnedfavouriteRecords;
                //Setting the already marked favorite records.
                this.allFavoriteRecords?.forEach((favElement, favIndex) => {
                    this.allRelatedContactsToMa?.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.allRelatedContactsToMa[index].isFavorite = true;
                            this.allRelatedContactsToMa[index].favoriteIcon = 'utility:check';
                            this.allRelatedContactsToMa[index].favId = favElement.Favorite_Id__c;
                            this.allRelatedContactsToMa[index].favIconColor = "selectedFavIcon";
                            this.allRelatedContactsToMa[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.allRelatedContactsToMa = [...this.allRelatedContactsToMa];
            }
            this.isLoading = false;
        }).catch((error) => {
            this.isLoading = false;
            /** Custom toast message */
            this.toastmessage = 'Error fetching favorite record. Contact your administrator for help.';
            this.title = 'Error';
            this.alternativeText = 'Error';
            this.showToast = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);
            console.log('Error ', error);
        });
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
        let { Id } = row;

        this[NavigationMixin.Navigate]({

            type: 'standard__recordPage',
            attributes: {
                recordId: Id,
                actionName: 'edit'
            }
        });
    }

    async handleListClose() {
        const multiPicklist = this.template.querySelectorAll('c-multi-select-combobox-custom')
        if (multiPicklist) {
            multiPicklist?.forEach((mp) => {
                mp?.handleClose();
            });
            if ((JSON.stringify(this.oldAccountTypeValue) != JSON.stringify(this.accountTypeValue) ||
                JSON.stringify(this.oldContactTypeValue) != JSON.stringify(this.contactTypeValue) ||
                JSON.stringify(this.oldAssetClassCoverageValue) != JSON.stringify(this.assetClassCoverageValue)) && this.isDropDownOpen) {
                this.isLoading = true;
                this.allRelatedContactsToMa = [];
                await this.fetchFilterRecordCount();
                await this.fetchFilterRecords();
                this.oldAccountTypeValue = this.accountTypeValue || [];
                this.oldContactTypeValue = this.contactTypeValue || [];
                this.oldAssetClassCoverageValue = this.assetClassCoverageValue || [];
            }
            this.isDropDownOpen = false;
        }
    }

    handleContactTypeChange(e) {
        this.contactTypeValue = e?.detail?.map(selectedOption => selectedOption.value) || [];
    }

    handleAccountTypeChange(e) {
        this.accountTypeValue = e?.detail?.map(selectedOption => selectedOption.value) || [];
    }

    handleAssetClassCoverageChange(e) {
        this.assetClassCoverageValue = e?.detail?.map(selectedOption => selectedOption.value) || [];
    }

    async fetchFilterRecordCount() {
        try {
            const contactRecordCount = await fetchFilterRecordCount({
                recordId: this.recordId,
                homeOffice: this.homeOffice,
                accountTypes: this.accountTypeValue,
                contactTypes: this.contactTypeValue,
                assetClassCoverage: this.assetClassCoverageValue
            });
            if (typeof contactRecordCount != 'undefined') {
                this.totalRelatedContactRecordCount = contactRecordCount;
            }
        } catch (error) {
            console.debug(error);
            this.isLoading = false;
        }
    }

    async fetchFilterRecords() {
        try {
            this.offset = 0;
            if (this.sortedBy == 'recordLink') {
                this.sortedBy = 'Name';
            } else if (this.sortedBy == 'AccountType') {
                this.sortedBy = 'Account.Type';
            } else if (this.sortedBy == 'AccountId') {
                this.sortedBy = 'Account.Name';
            }
            const filteredRecords = await getAllRelatedSortedContactsToMetroArea({
                recordId: this.recordId,
                homeOffice: this.homeOffice,
                recordLimit: this.limit,
                offset: this.offset,
                sortBy: this.sortedBy,
                sortOrder: this.sortedDirection,
                accountTypes: this.accountTypeValue,
                contactTypes: this.contactTypeValue,
                assetClassCoverage: this.assetClassCoverageValue
            });
            if (filteredRecords) {
                let tempContactList = [];
                filteredRecords?.forEach((con) => {
                    let tempContactRecord = Object.assign({}, con);
                    if (this.isCommunityBoolean) {
                        tempContactRecord.recordLink = `/${this.communityName}/s/detail/${tempContactRecord.Id}`;
                        if (tempContactRecord.AccountId) {
                            tempContactRecord.AccountId = `/${this.communityName}/s/detail/${tempContactRecord.AccountId}`;
                        }
                    } else {
                        tempContactRecord.recordLink = `/${tempContactRecord.Id}`;
                        if (tempContactRecord.AccountId)
                            tempContactRecord.AccountId = `/${tempContactRecord.AccountId}`;
                    }
                    if (tempContactRecord.Account) {
                        tempContactRecord.AccountName = tempContactRecord?.Account?.Name;
                        tempContactRecord.AccountType = tempContactRecord?.Account?.Type;
                        if (tempContactRecord.Account.MetroArea__r)
                            tempContactRecord.MetroAreaName = tempContactRecord?.Account?.MetroArea__r?.Name;
                    }
                    tempContactRecord.favoriteIcon = 'utility:add';
                    tempContactRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                    tempContactRecord.iconStatus = 'Click To Follow';
                    tempContactList.push(tempContactRecord);
                });
                this.allRelatedContactsToMa = tempContactList;
                this.offset = this.allRelatedContactsToMa.length;
                this.getAllFavoriteRecordsFromAPI();
                this.plusSign = ((this.offset) >= this.totalRelatedContactRecordCount) ? '' : '+';
                this.infiniteLoading = false;
                if (this.sortedBy == 'Name') {
                    this.sortedBy = 'recordLink';
                } else if (this.sortedBy == 'Account.Type') {
                    this.sortedBy = 'AccountType';
                } else if (this.sortedBy == 'Account.Name') {
                    this.sortedBy = 'AccountId';
                }
            }
        } catch (e) {
            console.debug(e);
            this.infiniteLoading = false;
            this.isLoading = false;
        }
    }

    storeAccountTypeOldValues(event) {
        this.oldAccountTypeValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.accountTypeValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.template.querySelector('[data-id="contactType"]')?.handleClose();
        this.template.querySelector('[data-id="assetClassCoverage"]')?.handleClose();
        this.isDropDownOpen = true;
    }

    storeContactTypeOldValues(event) {
        this.oldContactTypeValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.contactTypeValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.template.querySelector('[data-id="accountType"]')?.handleClose();
        this.template.querySelector('[data-id="assetClassCoverage"]')?.handleClose();
        this.isDropDownOpen = true;
    }

    storeAssetClassCoverageOldValues(event) {
        this.oldAssetClassCoverageValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.assetClassCoverageValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.template.querySelector('[data-id="accountType"]')?.handleClose();
        this.template.querySelector('[data-id="contactType"]')?.handleClose();
        this.isDropDownOpen = true;
    }

    connectedCallback() {
        registerListener('updateContactList', this.removeFromFollowList, this);
        Promise.all([
            loadStyle(this, followIconStyle)
        ]);
        this.masterRecordTypeId = MASTER_RECORD_TYPE;
        document?.addEventListener('click', () => {
            this.handleListClose()
        });
        this.isLoading = true;
        if (this.isCommunity == 'false' || this.isCommunity == false) {
            this.isCommunityBoolean = false;
        }
        else {
            this.isCommunityBoolean = true;
        }
        if (this.homeOffice == 'false') {
            this.checkArea = false;
        }
        else {
            this.checkArea = true;
        }
        this.checkIsCommunityInstance();

        if (this.homeOffice == 'false') {
            this.tempAddAction = null;
            this.tempAddAction = COLUMNSFORNOTINMETROAREA;
            if (this.isCommunityBoolean) {
                this.tempAddAction = [...this.tempAddAction, {
                    type: 'action',
                    typeAttributes: { rowActions: noActions },
                }];
            }
            else {
                this.tempAddAction = [...this.tempAddAction, {
                    type: 'action',
                    typeAttributes: { rowActions: actions },
                }];
            }
            this.NotMetroColumns = this.tempAddAction;
        }
        else {
            this.tempAddAction = null;
            this.tempAddAction = COLUMNSFORMETROAREA;
            if (this.isCommunityBoolean) {
                this.tempAddAction = [...this.tempAddAction, {
                    type: 'action',
                    typeAttributes: { rowActions: noActions },
                }];
            }
            else {
                this.tempAddAction = [...this.tempAddAction, {
                    type: 'action',
                    typeAttributes: { rowActions: actions },
                }];
            }
            this.MetroColumns = this.tempAddAction;
        }

        // To set links for breadcrumbs
        this.setLinks();
        getRelatedContactCount({
            recordId: this.recordId,
            homeOffice: this.homeOffice
        }).then(contactRecordCount => {
            if (contactRecordCount) {

                this.totalRelatedContactRecordCount = contactRecordCount;
            }
        }).catch(error => {
            console.log("Error:", error);
        });

        if (this.sortedBy == 'recordLink') {
            this.sortedBy = 'Name';
        }

        getAllRelatedSortedContactsToMetroArea({
            recordId: this.recordId,
            homeOffice: this.homeOffice,
            recordLimit: this.limit,
            offset: this.offset,
            sortBy: this.sortedBy,
            sortOrder: this.sortedDirection,
            accountTypes: this.accountTypeValue,
            contactTypes: this.contactTypeValue,
            assetClassCoverage: this.assetClassCoverageValue
        }).then(allRelatedContacts => {
            if (allRelatedContacts) {
                var tempContactList = [];
                for (var i = 0; i < allRelatedContacts.length; i++) {
                    let tempContactRecord = Object.assign({}, allRelatedContacts[i]); //cloning object
                    if (this.isCommunityBoolean) {
                        tempContactRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.Id;
                        if (tempContactRecord.AccountId != undefined)
                            tempContactRecord.AccountId = "/" + this.communityName + "/s/detail/" + tempContactRecord.AccountId;
                    } else {
                        tempContactRecord.recordLink = "/" + tempContactRecord.Id;
                        if (tempContactRecord.AccountId != undefined)
                            tempContactRecord.AccountId = "/" + tempContactRecord.AccountId;
                    }
                    if (tempContactRecord.Account != undefined) {
                        tempContactRecord.AccountName = tempContactRecord.Account.Name;
                        tempContactRecord.AccountType = tempContactRecord.Account.Type;
                        if (tempContactRecord.Account.MetroArea__r != undefined)
                            tempContactRecord.MetroAreaName = tempContactRecord.Account.MetroArea__r.Name;
                    }
                    tempContactRecord.favoriteIcon = 'utility:add';
                    tempContactRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                    tempContactRecord.iconStatus = 'Click To Follow';
                    tempContactList.push(tempContactRecord);
                }
                this.allRelatedContactsToMa = tempContactList;
                this.offset = this.allRelatedContactsToMa.length;
                this.getAllFavoriteRecordsFromAPI();
                // For showing + sign with count
                if ((this.offset) >= this.totalRelatedContactRecordCount) {
                    this.plusSign = '';
                }
                else {
                    this.plusSign = '+';
                }
                this.isLoading = false;
                this.infiniteLoading = false;
            }
        }).catch(error => {
            this.infiniteLoading = false;
            console.log("Error:", error);
        });

        if (this.sortedBy == 'Name') {
            this.sortedBy = 'recordLink';
        }
    }

    onHandleSort(event) {
        this.isLoading = true;
        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;

        if (sortedBy == 'recordLink') {
            this.sortedBy = 'Name';
        } else if (sortedBy == 'AccountType') {
            this.sortedBy = 'Account.Type';
        } else if (sortedBy == 'AccountId') {
            this.sortedBy = 'Account.Name';
        } else {
            this.sortedBy = sortedBy;
        }

        this.sortedDirection = sortDirection;
        this.allRelatedContactsToMa = [];
        getAllRelatedSortedContactsToMetroArea({
            recordId: this.recordId,
            homeOffice: this.homeOffice,
            recordLimit: this.offset,
            offset: 0,
            sortBy: this.sortedBy,
            sortOrder: this.sortedDirection,
            accountTypes: this.accountTypeValue,
            contactTypes: this.contactTypeValue,
            assetClassCoverage: this.assetClassCoverageValue
        }).then(allRelatedContacts => {
            if (allRelatedContacts) {
                var tempContactList = [];
                for (var i = 0; i < allRelatedContacts.length; i++) {
                    let tempContactRecord = Object.assign({}, allRelatedContacts[i]); //cloning object
                    if (this.isCommunityBoolean) {
                        tempContactRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.Id;
                        if (tempContactRecord.AccountId != undefined)
                            tempContactRecord.AccountId = "/" + this.communityName + "/s/detail/" + tempContactRecord.AccountId;
                    } else {
                        tempContactRecord.recordLink = "/" + tempContactRecord.Id;
                        if (tempContactRecord.AccountId != undefined)
                            tempContactRecord.AccountId = "/" + tempContactRecord.AccountId;
                    }
                    if (tempContactRecord.Account != undefined) {
                        tempContactRecord.AccountName = tempContactRecord.Account.Name;
                        tempContactRecord.AccountType = tempContactRecord.Account.Type;
                        if (tempContactRecord.Account.MetroArea__r != undefined)
                            tempContactRecord.MetroAreaName = tempContactRecord.Account.MetroArea__r.Name;
                    }
                    tempContactRecord.favoriteIcon = 'utility:add';
                    tempContactRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                    tempContactRecord.iconStatus = 'Click To Follow';
                    tempContactList.push(tempContactRecord);
                }
                this.allRelatedContactsToMa = tempContactList;
                this.getAllFavoriteRecordsFromAPI();
                this.offset = this.allRelatedContactsToMa.length;
            }
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });

        if (this.sortedBy == 'Name') {
            this.sortedBy = 'recordLink';
        } else if (this.sortedBy == 'Account.Type') {
            this.sortedBy = 'AccountType';
        } else if (this.sortedBy == 'Account.Name') {
            this.sortedBy = 'AccountId';
        }

    }

    loadMoreData(event) {

        if (this.totalRelatedContactRecordCount > this.offset) {
            if (this.infiniteLoading)
                return;
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if (this.allRelatedContactsToMa != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';

            if (this.sortedBy == 'recordLink') {
                this.sortedBy = 'Name';
            } else if (this.sortedBy == 'AccountType') {
                this.sortedBy = 'Account.Type';
            } else if (this.sortedBy == 'AccountId') {
                this.sortedBy = 'Account.Name';
            }

            getAllRelatedSortedContactsToMetroArea({
                recordId: this.recordId,
                homeOffice: this.homeOffice,
                recordLimit: this.limit,
                offset: this.offset,
                sortBy: this.sortedBy,
                sortOrder: this.sortedDirection,
                accountTypes: this.accountTypeValue,
                contactTypes: this.contactTypeValue,
                assetClassCoverage: this.assetClassCoverageValue
            }).then(relatedContactsToMa => {
                if (relatedContactsToMa) {
                    var tempContactList = [];
                    for (var i = 0; i < relatedContactsToMa.length; i++) {
                        let tempContactRecord = Object.assign({}, relatedContactsToMa[i]); //cloning object
                        if (this.isCommunityBoolean) {
                            tempContactRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.Id;
                            if (tempContactRecord.AccountId != undefined)
                                tempContactRecord.AccountId = "/" + this.communityName + "/s/detail/" + tempContactRecord.AccountId;
                        } else {
                            tempContactRecord.recordLink = "/" + tempContactRecord.Id;
                            if (tempContactRecord.AccountId != undefined)
                                tempContactRecord.AccountId = "/" + tempContactRecord.AccountId;
                        }
                        if (tempContactRecord.Account != undefined) {
                            tempContactRecord.AccountName = tempContactRecord.Account.Name;
                            tempContactRecord.AccountType = tempContactRecord.Account.Type;
                            if (tempContactRecord.Account.MetroArea__r != undefined)
                                tempContactRecord.MetroAreaName = tempContactRecord.Account.MetroArea__r.Name;
                        }
                        tempContactRecord.favoriteIcon = 'utility:add';
                        tempContactRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                        tempContactRecord.iconStatus = 'Click To Follow';
                        tempContactList.push(tempContactRecord);
                    }
                    if (this.allRelatedContactsToMa) {
                        this.allRelatedContactsToMa = this.allRelatedContactsToMa.concat(tempContactList);
                        this.getAllFavoriteRecordsFromAPI();
                    }
                    if ((this.offset + 50) >= this.totalRelatedContactRecordCount) {
                        this.offset = this.totalRelatedContactRecordCount;
                        this.plusSign = '';
                    }
                    else {
                        this.offset = parseInt(this.offset) + parseInt(this.limit);
                        this.plusSign = '+';
                    }
                    this.loadMoreStatus = '';
                    if (this.allRelatedContactsToMa != null && this.allRelatedContactsToMa.length >= this.totalRecordCount) {
                        this.tableElement.enableInfiniteLoading = false;
                        this.loadMoreStatus = 'No more data to load';
                    }
                    else if (this.allRelatedContactsToMa == null) {
                        this.tableElement.enableInfiniteLoading = false;
                        this.loadMoreStatus = 'No more data to load';

                    }

                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                    }
                    this.infiniteLoading = false;
                }
            }).catch(error => {
                this.infiniteLoading = false;
                console.log("Error:", error);
            });

            if (this.sortedBy == 'Name') {
                this.sortedBy = 'recordLink';
            } else if (this.sortedBy == 'Account.Type') {
                this.sortedBy = 'AccountType';
            } else if (this.sortedBy == 'Account.Name') {
                this.sortedBy = 'AccountId';
            }
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
            attributes: { objectApiName: 'Contact', actionName: 'new' },
            state: {
                useRecordTypeCheck: '2',
                defaultFieldValues: "Metro_Area__c=" + this.recordId,
                navigationLocation: 'RELATED_LIST',
            }
        };
        this[NavigationMixin.Navigate](newContactRecord);
    }

    // Set breadcrumb links
    setLinks() {
        if (this.isCommunityBoolean) {
            this.recordLink = "/" + this.communityName + "/s/metro-area/" + this.recordId;
            this.maNameLink = "/" + this.communityName + '/s/metro-area/Metro_Area__c/Default';
        } else {
            this.recordLink = '/' + this.recordId;
            this.maNameLink = '/one/one.app#/sObject/Metro_Area__c/list?filterName=Recent';
        }
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

}