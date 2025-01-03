import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getAccountRelatedContactRecords from '@salesforce/apex/ContactRelatedToAccountController.getAccountRelatedContactRecords';
import getAccountRelatedContactCount from '@salesforce/apex/ContactRelatedToAccountController.getAccountRelatedContactCount';
import isInvestmentAllocatorAccount from '@salesforce/apex/ContactRelatedToAccountController.isInvestmentAllocatorAccount';
import getAccountDetails from '@salesforce/apex/ContactRelatedToAccountController.getAccountDetails';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';
import getAccountName from '@salesforce/apex/ContactRelatedToAccountController.getAccountName';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import CONTACT_TITLE_FIELD from '@salesforce/schema/Contact.Title';
import CONTACT_ASSET_CLASS_COVERAGE_FIELD from '@salesforce/schema/Contact.Asset_Class_Coverage__c';
import CONTACT_TYPE_FIELD from '@salesforce/schema/Contact.Contact_Type__c';
import CONTACT_EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import CONTACT_CHANNEL_FOCUS_FIELD from '@salesforce/schema/Contact.Channel_Focus__c';
import getUserDetails from '@salesforce/apex/ContactRelatedToAccountController.getUserDetails';
import userId from '@salesforce/user/Id';

import {
    loadStyle,
} from 'lightning/platformResourceLoader';
import followIconStyle from '@salesforce/resourceUrl/followIconStyle';
import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';

const COLUMNS = [
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
    { label: 'Contact Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: CONTACT_TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Email', sortable: true, fieldName: CONTACT_EMAIL_FIELD.fieldApiName, type: 'email' },
    { label: 'Asset Class Coverage', sortable: true, fieldName: 'Asset_Class_Coverage', type: 'Picklist' },
    { label: 'Contact Type', sortable: true, fieldName: 'Contact_Type', type: 'Picklist' },
    { label: 'Metro Area', sortable: true, fieldName: "MetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' } },
    { label: 'College', sortable: false, fieldName: "ContactEducationCollegeLink", type: 'url', typeAttributes: { label: { fieldName: 'ContactEducationCollegeName' }, tooltip: { fieldName: 'ContactEducationCollegeName' }, target: '_self' } },
]

const EVEREST_COLUMNS_Inv_Alloc = [
    { label: 'Contact Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: CONTACT_TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Contact Type', sortable: true, fieldName: 'Contact_Type', type: 'Picklist' },
    { label: 'Metro Area', sortable: true, fieldName: "MetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' } },
    { label: 'Email', sortable: true, fieldName: CONTACT_EMAIL_FIELD.fieldApiName, type: 'email' }
]

const EVEREST_COLUMNS_Inv_Focus = [
    { label: 'Contact Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: CONTACT_TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Contact Type', sortable: true, fieldName: 'Contact_Type', type: 'Picklist' },
    { label: 'Metro Area', sortable: true, fieldName: "MetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' } },
    { label: 'Email', sortable: true, fieldName: CONTACT_EMAIL_FIELD.fieldApiName, type: 'email' }
]

const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled: true }
];

export default class ContactRelatedToAccount extends NavigationMixin(LightningElement) {

    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    recordType = '';
    relatedListName = 'Contacts'
    @track isLoading = false;
    @track isLoadingCreateCon = false;
    @api isSalesforceInstance = false;
    columns = COLUMNS;
    tempAddAction = [];
    setSelectedRows = [];
    totalRelatedContactsCount = 0;
    relatedContactsRecords;
    newbuttonPressed = false;
    offset = 0;
    limit = 10;
    plusSign = '';
    baseURL = '';
    recordToDel;
    collapsed = true;
    @track showModal = false;
    @track showToast = false;
    userId = userId;
    @track userFirstName = '';
    @track error;
    @track areDetailsVisible = false;
    displayRecords = false;
    displayNewAction = false;
    headerClass = 'header-position';
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = 'Name';
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'FIRST';
    invFirmRecord = false;
    faTeamsList = ['Bank','Broker-Dealer','Broker Dealer'];
    maxFollowCount = Allowed_Follow_Record_Count;
    @track allFavoriteRecords = [];
    setSelectedRows = [];
    panelStyling;
    isCommunityBoolean;
    fromEditEvent = false;
    user;
    toastmessage;
    title;
    alternativeText;
    iconName;
    toastMsgClasses;
    toastMsgIconClasses;
    @track showToast2 = false;

    @wire(CurrentPageReference) objPageReference;

    @wire(getUserDetails, {
        recId: '$userId'
    })
    wiredUser({
        error,
        data
    }) {
        if (data) {
            let userData = data;
            if (userData.FirstName) {
                this.userFirstName = ' ' + userData.FirstName;
            }

        } else if (error) {
            this.error = error;
        }
    }

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {
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
                this.toastmessage = 'You cannot follow more than '+this.maxFollowCount+' records.';
                this.title = 'Error';
                this.alternativeText = 'Error';
                this.showToast2 = true;
                this.iconName = 'utility:error';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                setTimeout(() => {
                    this.showToast2 = false;
                }, 2000);
                console.log('Error ', error);
            }
            else {
                this.isLoading = true;
                let favTargetType = 'Record';
                addToFavorites({
                    recordId: this.conRecordId,
                    targetType: favTargetType
                }).then((createdFavouriteRecord) => {
                    if (createdFavouriteRecord) {
                        var tempList = [];
                        this.relatedContactsRecords.forEach((element, index) => {
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
                        this.relatedContactsRecords = [...tempList];
                        this.allFavoriteRecords.push(createdFavouriteRecord);
                        this.isLoading = false;

                        fireEvent(this.objPageReference, 'updateFavList', '');
                        //Display custom toast message for succesful favorite record created.
                        this.toastmessage = 'Successfully Followed.';
                        this.title = 'Success';
                        this.alternativeText = 'Success';
                        this.showToast2 = true;
                        this.iconName = 'utility:success';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_success';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-success slds-m-right_small slds-no-flex slds-align-top'
                        setTimeout(() => {
                            this.showToast2 = false;
                        }, 2000);
                    } else {
                        this.isLoading = false;
                        /** Custom toast message */
                        this.toastmessage = 'Cannot add this record to follow. Contact your administrator for help.';
                        this.title = 'Error';
                        this.alternativeText = 'Error';
                        this.showToast2 = true;
                        this.iconName = 'utility:error';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
                        setTimeout(() => {
                            this.showToast2 = false;
                        }, 2000);
                    }
                }).catch((error) => {
                    this.isLoading = false;
                    /** Custom toast message */
                    if (error && error.body && error.body.message && error.body.message.includes("Already added in the followed list")) {
                        this.toastmessage = 'Already following this record. Please refresh your page.';
                        this.title = 'info';
                        this.alternativeText = 'info';
                        this.showToast2 = true;
                        this.iconName = 'utility:info';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
                        setTimeout(() => {
                            this.showToast2 = false;
                        }, 2000);
                    }
                    else {
                        this.toastmessage = 'Cannot add this record to follow. Contact your administrator for help.';
                        this.title = 'Error';
                        this.alternativeText = 'Error';
                        this.showToast2 = true;
                        this.iconName = 'utility:error';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
                        setTimeout(() => {
                            this.showToast2 = false;
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
                this.relatedContactsRecords.forEach((element, index) => {
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
                this.relatedContactsRecords = [...tempList];
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
                this.showToast2 = true;
                this.iconName = 'utility:info';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
                setTimeout(() => {
                    this.showToast2 = false;
                }, 2000);

            }).catch((error) => {
                console.log('Error ', error);
                this.isLoading = false;
                /** Custom toast message */
                this.toastmessage = 'Cannot remove this record from follow. Contact your administrator for help.';
                this.title = 'Error';
                this.alternativeText = 'Error';
                this.showToast2 = true;
                this.iconName = 'utility:error';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                setTimeout(() => {
                    this.showToast2 = false;
                }, 2000);
            });
        }
    }


    getAllFavoriteRecordsFromAPI() {
        getAllFavoriteRecords({}).then(returnedfavouriteRecords => {
            if (returnedfavouriteRecords != null && returnedfavouriteRecords.length > 0) {
                this.allFavoriteRecords = returnedfavouriteRecords;
                //Setting the already marked favorite records.
                this.allFavoriteRecords.forEach((favElement, favIndex) => {
                    this.relatedContactsRecords.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.relatedContactsRecords[index].isFavorite = true;
                            this.relatedContactsRecords[index].favoriteIcon = 'utility:check';
                            this.relatedContactsRecords[index].favId = favElement.Favorite_Id__c;
                            this.relatedContactsRecords[index].favIconColor = "selectedFavIcon";
                            this.relatedContactsRecords[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.relatedContactsRecords = [...this.relatedContactsRecords];
            }
            this.isLoading = false;
        }).catch((error) => {
            this.isLoading = false;
            /** Custom toast message */
            this.toastmessage = 'Error fetching follow record. Contact your administrator for help.';
            this.title = 'Error';
            this.alternativeText = 'Error';
            this.showToast2 = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast2 = false;
            }, 2000);
            console.log('Error ', error);
        });
    }

    removeFromFollowList(objPayLoad) {
        let favToBeRemovedId = objPayLoad;
        removeFromFavorites({
            favId: favToBeRemovedId
        }).then(() => {
            var tempList = [];
            this.relatedContactsRecords.forEach((element, index) => {
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
            this.relatedContactsRecords = [...tempList];
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
            this.showToast2 = true;
            this.iconName = 'utility:info';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast2 = false;
            }, 2000);

        }).catch((error) => {
            console.log('Error ', error);
            this.isLoading = false;
            /** Custom toast message */
            this.toastmessage = 'Cannot remove this record from follow. Contact your administrator for help.';
            this.title = 'Error';
            this.alternativeText = 'Error';
            this.showToast2 = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast2 = false;
            }, 2000);
        });
    }

    connectedCallback() {

        registerListener('updateContactList',this.removeFromFollowList,this);
        Promise.all([
            loadStyle(this, followIconStyle)
        ]);
        if (this.communityName != 'marketplace2') {
            // this.displayRecords = true;
            this.displayNewAction = true;

            getAccountDetails({
                recordId: this.recordId,
            }).then(returnedAccount => {
                if (returnedAccount) {
                    this.recordType = returnedAccount.Type;
                    if(this.recordType && this.faTeamsList.includes(this.recordType)) {
                        this.relatedListName = 'Research Contacts';
                    }
                    this.displayRecords = true;
                    this.displayNewAction = returnedAccount.RecordType.DeveloperName != 'Dakota_360_Account' ? true : false;
                    this.invFirmRecord = !this.displayNewAction;
                    this.isLoading = true;
                    this.getAccountRelatedContactRecords(this.recordId, this.sortedBy, this.sortedDirection);

                    if (this.invFirmRecord) {
                        isInvestmentAllocatorAccount({
                            recordId: this.recordId,
                        }).then(isInvAllocAcc => {
                            if (isInvAllocAcc) {
                                this.columns = EVEREST_COLUMNS_Inv_Alloc;
                            }
                            else {
                                this.columns = EVEREST_COLUMNS_Inv_Focus;
                            }
                        }).catch(error => {
                            console.log('Error:', error)
                            this.isLoading = false;
                        });
                    }
                }
            }).catch(error => {
                console.log('Error:', error)
                this.isLoading = false;
            });
        }

        else if (this.communityName == 'marketplace2') {


            isInvestmentAllocatorAccount({
                recordId: this.recordId,
            }).then(isInvAllocAcc => {
                if (isInvAllocAcc) {
                    this.columns = EVEREST_COLUMNS_Inv_Alloc;
                }
                else {
                    this.columns = EVEREST_COLUMNS_Inv_Focus;
                }
            }).catch(error => {
                console.log('Error:', error)
                this.isLoading = false;
            });

        }
        this.isLoading = true;

        //this.getAccountRelatedContactRecords(this.recordId, this.sortedBy, this.sortedDirection);
        this.sortedDirection = 'asc';
        this.sortedBy = 'Name';

        //To get base url of the instance
        getSFBaseUrl().then(baseURL => {
            if (baseURL) {
                this.baseURL = baseURL;
            }
        })
            .catch(error => {
                console.log("Error:", error);
            });

        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordName = returnedAccount.Name;
                this.recNameAvailable = true;
            }
        });
    }

    // Get related Contacts records for account
    getAccountRelatedContactRecords(recordId, sortedBy, sortedDirection) {
        this.isLoading = true;
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        getAccountRelatedContactRecords({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            nullOrder: this.nullOrder,
            relatedListName: this.relatedListName
        }).then(relatedContacts => {
            if (relatedContacts) {
                if (relatedContacts != null && relatedContacts.length > 0 && this.communityName == 'marketplace2') {
                    this.displayRecords = true;
                    this.headerClass = 'slds-media__body slds-grid';
                }
                var tempContactList = [];
                for (var i = 0; i < relatedContacts.length; i++) {
                    let tempRecord = Object.assign({}, relatedContacts[i]); //cloning object 
                    tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                    if (tempRecord.metroAreaId != undefined)
                        tempRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempRecord.metroAreaId;

                    if (tempRecord.metroAreaId != undefined)
                        tempRecord.MetroAreaName = tempRecord.metroAreaName;

                    if (tempRecord.ContactEducationCollege) {
                        tempRecord.ContactEducationCollegeLink = "/" + this.communityName + "/s/university-alumni/" + tempRecord.ContactEducationCollege;
                    }
                    tempRecord.favoriteIcon = 'utility:add';
                    tempRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                    tempRecord.iconStatus = 'Click To Follow';
                    tempContactList.push(tempRecord);
                }
                this.relatedContactsRecords = tempContactList;
                this.getAllFavoriteRecordsFromAPI();
                this.offset = this.relatedContactsRecords.length;
                this.isLoading = false;
                if (this.offset > 0) {
                    this.collapsed = false;
                }
                else {
                    this.collapsed = true;
                }

                //To get count of related contacts records
                getAccountRelatedContactCount({
                    recordId: this.recordId,
                    relatedListName: this.relatedListName
                }).then(contactsRecordCount => {
                    this.totalRelatedContactsCount = contactsRecordCount;
                    if (this.offset >= this.totalRelatedContactsCount) {
                        this.plusSign = '';
                    }
                    else {
                        this.plusSign = '+';
                    }
                }).catch(error => { });
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    // To refresh table
    refreshTable(event) {
        this.connectedCallback();
    }

    openModal() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    handleCancel() {
        closeModel();
    }

    handleSuccess() {
        this.isLoadingCreateCon = false;
        this.showModal = false;
        this.showToast = true;
        setTimeout(() => { this.showToast = false; }, 10000);
    }
    closeToast() {
        this.showToast = false;
    }

    handlesubmit(event) {
        this.isLoadingCreateCon = true;
    }

    handleEvent = event => {

        this.isLoading = true;
        this.newbuttonPressed = false;
        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.refreshTable();
    }

    handleShowFullRelatedList() {
        if (this.communityName != 'marketplace2' && this.invFirmRecord == false) {
            var url = '/view-accountrelatedcontacts?recordId=' + this.recordId + '&recordName=' + this.recordName;

            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url,
                }
            });
        }
        else {
            var viewAllUrl = '/account/related/' + this.recordId + '/Contacts';
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: viewAllUrl
                }
            });
        }
    }

    handleLoad(event) {

        window.console.time("LDS call");
        const recUi = event.detail;
        this.areDetailsVisible = true;
        window.console.timeEnd("LDS call");
    }

    /**
     * For sorting the table
     * @param {*} event 
     */
    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let tempSortBy = this.sortedBy;

        if (this.sortedBy === 'recordLink') {
            tempSortBy = CONTACT_NAME_FIELD.fieldApiName;
        }
        else if (this.sortedBy === 'Title') {
            tempSortBy = CONTACT_TITLE_FIELD.fieldApiName;
        }
        else if (this.sortedBy === 'Asset_Class_Coverage') {
            tempSortBy = CONTACT_ASSET_CLASS_COVERAGE_FIELD.fieldApiName;
        }
        else if (this.sortedBy === 'Contact_Type') {
            tempSortBy = CONTACT_TYPE_FIELD.fieldApiName;
        }
        else if (this.sortedBy === 'MetroAreaLink') {
            tempSortBy = 'Metro_Area__r.Name';
        }
        else if (this.sortedBy === 'Email') {
            tempSortBy = CONTACT_EMAIL_FIELD.fieldApiName;
        }

        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getAccountRelatedContactRecords(this.recordId, tempSortBy, this.sortedDirection);
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }
}