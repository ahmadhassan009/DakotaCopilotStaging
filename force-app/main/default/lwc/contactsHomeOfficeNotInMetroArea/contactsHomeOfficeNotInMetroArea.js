import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getAllRelatedContactsToMetroArea from '@salesforce/apex/RelatedContactsController.getAllRelatedContactsToMetroArea';
import getRelatedContactsToMetroArea from '@salesforce/apex/RelatedContactsController.getRelatedContactsToMetroArea';
import getRelatedContactCount from '@salesforce/apex/RelatedContactsController.getRelatedContactCount';
import getMetroAreaName from '@salesforce/apex/RelatedContactsController.getMetroAreaName';
import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import {fireEvent,registerListener,unregisterAllListeners} from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import TITLE_FIELD from '@salesforce/schema/Contact.Title';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import CONTACT_TYPE_FIELD from '@salesforce/schema/Contact.Contact_Type__c';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import CONTACT_ACCOUNTMETROAREA_FIELD from '@salesforce/schema/Contact.Account.MetroArea__r.Name';
import {
    loadStyle,
} from 'lightning/platformResourceLoader';
import followIconStyle from '@salesforce/resourceUrl/followIconStyle';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';

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
    { label: 'Name', fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Account Name', fieldName: "AccountLink", type: 'url', typeAttributes: { label: { fieldName: 'AccountName' }, tooltip: { fieldName: 'AccountName' }, target: '_self' } },
    { label: 'Account Type', fieldName: 'AccountType', type: 'Picklist' },
    { label: 'Account Metro Area ', fieldName: 'MetroAreaName', type: 'text' },
    { label: 'Title', fieldName: TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Email', fieldName: EMAIL_FIELD.fieldApiName, type: 'email' },
    { label: 'Contact Type', fieldName: CONTACT_TYPE_FIELD.fieldApiName, type: 'Picklist' }
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];
const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled: true }
];

export default class ContactsHomeOfficeNotInMetroArea extends NavigationMixin(LightningElement) {

    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';

    @api recordId;
    @api recordName;
    conRecordId;
    homeOffice = false;
    @track contactsHomeOfficeNotInMa;
    totalRelatedContactCount = 0;
    fetchedContactsAccountsData = [];
    panelName = 'Contacts - Home Office not in ';
    columns = COLUMNS;
    newbuttonPressed = false;
    isCommunity;
    offset = 0;
    limit = 10;
    baseURL = '';
    plusSign = '+';
    setSelectedRows = [];
    tempAddAction = [];
    recordToDel;
    @track isLoading = false;
    @api isSalesforceInstance = false;
    @track allFavoriteRecords = [];
    collapsed = true;
    dataTableStyling;
    isCommunityBoolean;
    fromEditEvent = false;
    contactRecordsExists = false;
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

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = this.isCommunityBoolean;
    }

    @api
    clearAll() {
        this.setSelectedRows = [];
    }

    refreshTable(event) {
        if(!this.fromEditEvent)
        {
            var table = this.template.querySelector('lightning-datatable');
            if(table!=null)
                table.enableInfiniteLoading = true;
        }
        this.fromEditEvent = false;
        this.connectedCallback();
    }

    chevronButtonClicked() {
        this.collapsed = !this.collapsed;
    }

    handleEvent = event => {

        this.isLoading = true;
        this.newbuttonPressed = false;
        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.checkIsCommunityInstance();
        this.fromEditEvent = true;
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
        if(!row.isFavorite) {
            if (this.allFavoriteRecords.length >= Number(this.maxFollowCount)) {
                /** Custom toast message */
                this.toastmessage = 'You cannot follow more than '+this.maxFollowCount+' records.';
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
                        this.contactsHomeOfficeNotInMa.forEach((element, index) => {
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
                        this.contactsHomeOfficeNotInMa = [...tempList];
                        this.allFavoriteRecords.push(createdFavouriteRecord);
                        this.isLoading = false;

                        fireEvent(this.objPageReference,'updateFavList','');
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
                        this.toastmessage = 'Cannot add this record to Follow. Contact your administrator for help.';
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
                    if(error && error.body && error.body.message && error.body.message.includes("Already added in the followed list")) {
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
                    else
                    {
                        this.toastmessage = 'Cannot add this record to Follow. Contact your administrator for help.';
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
                    this.contactsHomeOfficeNotInMa.forEach((element, index) => {
                        let temObj = Object.assign({}, element);
                        if (element.Id == this.conRecordId) {
                            temObj.isFavorite = false;
                            temObj.favoriteIcon = 'utility:add';
                            temObj.favId = '';
                            temObj.favIconColor = "slds-icon-text-light addIconStyling";
                            temObj.iconStatus = 'Click To Follow';

                        }
                        tempList.push(temObj);
                    });
                    this.contactsHomeOfficeNotInMa = [...tempList];
                    this.isLoading = false;

                //Remove the non-favourite record from the favorite list.
                for (let i = 0; i < this.allFavoriteRecords.length; i++) {
                    if (this.allFavoriteRecords[i].Target_Id__c == favToBeRemovedId) {
                        this.allFavoriteRecords.splice(i, 1);
                        break;
                    }
                }
                fireEvent(this.objPageReference,'updateFavList','');
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
                this.toastmessage = 'Cannot remove this record from Follow. Contact your administrator for help.';
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
                    this.contactsHomeOfficeNotInMa.forEach((element, index) => {
                        let temObj = Object.assign({}, element);
                        if (element.Id == objPayLoad) {
                            temObj.isFavorite = false;
                            temObj.favoriteIcon = 'utility:add';
                            temObj.favId = '';
                            temObj.favIconColor = "slds-icon-text-light addIconStyling";
                            temObj.iconStatus = 'Click To Follow';

                        }
                        tempList.push(temObj);
                    });
                    this.contactsHomeOfficeNotInMa = [...tempList];
                    this.isLoading = false;

                //Remove the non-favourite record from the favorite list.
                for (let i = 0; i < this.allFavoriteRecords.length; i++) {
                    if (this.allFavoriteRecords[i].Target_Id__c == favToBeRemovedId) {
                        this.allFavoriteRecords.splice(i, 1);
                        break;
                    }
                }
                fireEvent(this.objPageReference,'updateFavList','');
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
                this.toastmessage = 'Cannot remove this record from Follow. Contact your administrator for help.';
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
                this.allFavoriteRecords.forEach((favElement, favIndex) => {
                    this.contactsHomeOfficeNotInMa.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.contactsHomeOfficeNotInMa[index].isFavorite = true;
                            this.contactsHomeOfficeNotInMa[index].favoriteIcon = 'utility:check';
                            this.contactsHomeOfficeNotInMa[index].favId = favElement.Favorite_Id__c;
                            this.contactsHomeOfficeNotInMa[index].favIconColor = "selectedFavIcon";
                            this.contactsHomeOfficeNotInMa[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.contactsHomeOfficeNotInMa = [...this.contactsHomeOfficeNotInMa];
            }
            this.isLoading = false;
        }).catch((error) => {
            this.isLoading = false;
            /** Custom toast message */
            this.toastmessage = 'Error fetching follow record. Contact your administrator for help.';
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


    loadMoreData(event) {

        if (this.totalRelatedContactCount > this.offset && this.newbuttonPressed == false) {
            //Display a spinner to signal that data is being loaded
            if (this.contactsHomeOfficeNotInMa != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';

            getAllRelatedContactsToMetroArea({
                recordId: this.recordId,
                homeOffice: this.homeOffice,
                recordLimit: this.limit,
                offset: this.offset
            }).then(relatedContactsToMa => {

                var tempContactList = [];
                for (var i = 0; i < relatedContactsToMa.length; i++) {
                    let tempContactRecord = Object.assign({}, relatedContactsToMa[i]); //cloning object 
                    if (this.isCommunity) {
                        tempContactRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.Id;
                        if (tempContactRecord.AccountId != undefined)
                            tempContactRecord.AccountLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.AccountId;
                    } else {
                        tempContactRecord.recordLink = "/" + tempContactRecord.Id;
                        if (tempContactRecord.AccountId != undefined)
                            tempContactRecord.AccountLink = "/" + tempContactRecord.AccountId;
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

                if (this.contactsHomeOfficeNotInMa) {
                    this.contactsHomeOfficeNotInMa = this.contactsHomeOfficeNotInMa.concat(tempContactList);
                    this.getAllFavoriteRecordsFromAPI();
                }
                if ((this.offset + 10) >= this.totalRelatedContactCount) {
                    this.offset = this.totalRelatedContactCount;
                    this.plusSign = '';
                }
                else {
                    this.offset = parseInt(this.offset) + parseInt(this.limit);
                    this.plusSign = '+';
                }
                this.loadMoreStatus = '';
                if (this.contactsHomeOfficeNotInMa != null && this.contactsHomeOfficeNotInMa.length >= this.totalRelatedContactCount) {
                    this.tableElement.enableInfiniteLoading = false;
                    this.loadMoreStatus = 'No more data to load';
                }
                else if (this.contactsHomeOfficeNotInMa == null) {
                    this.tableElement.enableInfiniteLoading = false;
                    this.loadMoreStatus = 'No more data to load';

                }
                if (this.tableElement) {
                    this.tableElement.isLoading = false;
                }
            }).catch(error => {
                console.log("Error:", error);
            });
        }
    }

    connectedCallback() {

        registerListener('updateContactList',this.removeFromFollowList,this);
        Promise.all([
            loadStyle(this, followIconStyle)
        ]);
        this.isLoading = true;
        if (this.isCommunity == 'false' || this.isCommunity == false) {
            this.isCommunityBoolean = false;
        }
        else {
            this.isCommunityBoolean = true;
        }

        this.checkIsCommunityInstance();
        this.tempAddAction = null;
        this.tempAddAction = COLUMNS;
        if (this.isCommunity) {
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
        this.columns = this.tempAddAction;

        getSFBaseUrl().
            then(baseURL => {
                if (baseURL) {
                    this.baseURL = baseURL;
                }
            })
            .catch(error => {
                console.log("Error:", error);
            });


        getRelatedContactsToMetroArea({
            recordId: this.recordId,
            homeOffice: this.homeOffice
        }).then(relatedContactsToMa => {
            if (relatedContactsToMa) {
                var tempContactList = [];
                this.fetchedContactsAccountsData = relatedContactsToMa;
                for (var i = 0; i < relatedContactsToMa.length; i++) {
                    let tempContactRecord = Object.assign({}, relatedContactsToMa[i]);
                    if (this.isCommunity) {
                        tempContactRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.Id;
                        if (tempContactRecord.AccountId != undefined)
                            tempContactRecord.AccountLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.AccountId;
                    } else {
                        tempContactRecord.recordLink = "/" + tempContactRecord.Id;
                        if (tempContactRecord.AccountId != undefined)
                            tempContactRecord.AccountLink = "/" + tempContactRecord.AccountId;
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
                if ((this.offset + 10) >= this.totalRelatedContactCount) {
                    this.plusSign = '';
                }
                else {
                    this.plusSign = '+';
                }
                this.contactsHomeOfficeNotInMa = tempContactList;
                this.getAllFavoriteRecordsFromAPI();
                this.offset = tempContactList.length;
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });

        getRelatedContactCount({
            recordId: this.recordId,
            homeOffice: this.homeOffice
        }).then(contactRecordCount => {
            if (contactRecordCount) {
                this.totalRelatedContactCount = contactRecordCount;
                if ((this.offset) >= this.totalRelatedContactCount) {
                    this.plusSign = '';
                }
                else {
                    this.plusSign = '+';
                }

                //To set panel height based total number of records 
                if (this.totalRelatedContactCount >= 10) {
                    this.dataTableStyling = 'height : 340px;';
                }
                else if (this.totalRelatedContactCount == 1) {
                    this.panelStyling = 'height : 62px;';
                }
                else if (this.totalRelatedContactCount == 2) {
                    this.panelStyling = 'height : 90px;';
                }
                else if (this.totalRelatedContactCount == 3) {
                    this.panelStyling = 'height : 115px;';
                }
                else if (this.totalRelatedContactCount == 4) {
                    this.panelStyling = 'height : 142px;';
                }
                else if (this.totalRelatedContactCount == 5) {
                    this.panelStyling = 'height : 170px;';
                }
                else if (this.totalRelatedContactCount == 6) {
                    this.panelStyling = 'height : 196px;';
                }
                else if (this.totalRelatedContactCount == 7) {
                    this.panelStyling = 'height : 225px;';
                }
                else if (this.totalRelatedContactCount == 8) {
                    this.panelStyling = 'height : 250px;';
                }
                else if (this.totalRelatedContactCount == 9) {
                    this.panelStyling = 'height : 280px;';
                }
            }
        }).catch(error => {
            console.log("Error:", error);
        });
    }
    contactSelected(event) {
        const selectedRows = event.detail.selectedRows;
        // Display that fieldName of the selected rows
        var arrayToPassToParent = [];
        for (let i = 0; i < selectedRows.length; i++) {
            arrayToPassToParent.push({ recordId: selectedRows[i].Id, entity: 'Contact' });
        }
        const selectedEvent = new CustomEvent("selectedcontacts", {
            detail: arrayToPassToParent
        })
        this.dispatchEvent(selectedEvent);
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


    @wire(getMetroAreaName, { recordId: '$recordId' })
    loadMetroAreaName(metroAreaName) {

       if(JSON.stringify(metroAreaName) != '{}')
       {
           if(metroAreaName.data !== undefined && metroAreaName.data != null) {
               if(metroAreaName.data.length != 0)
               {
                    this.recordName = metroAreaName.data[0].Name;
                    this.panelName += this.recordName;
               }
           }
       }
       
    };

    handleShowFullRelatedList() {

        var navigationURL = this.baseURL + '/lightning/cmp/c__ContactsRelatedToMaDataTableView?c__recordId=' + this.recordId + '&c__homeOffice=' + this.homeOffice + '&c__recordName=' + this.recordName + '&c__totalRelatedContactRecordCount=' + this.totalRelatedContactCount + '&c__isCommunity=' + this.isCommunity;
        var url = '/view-contactshomeoffice?recordId=' + this.recordId + '&homeOffice=' + this.homeOffice + '&recordName=' + this.recordName + '&totalRelatedContactRecordCount=' + this.totalRelatedContactCount + '&isCommunity=' + this.isCommunity;


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

    /**
     * DSC-42 : New button in Salesforce
     * @param {*} event 
     */
    createNewRecord(event) {

        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });

        onError(error => {
            console.error('Received error from server: ', error);
        });

        this.newbuttonPressed = true;
        let newContactRecord = {
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Contact', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                useRecordTypeCheck: '2',
                defaultFieldValues: "Metro_Area__c=" + this.recordId
            }
        };
        this[NavigationMixin.Navigate](newContactRecord);
    }
    disconnectedCallback() {
        unregisterAllListeners(this);
    }

}