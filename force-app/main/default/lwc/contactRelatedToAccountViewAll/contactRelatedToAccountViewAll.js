import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation"
import getAccountRelatedContactCount from '@salesforce/apex/ContactRelatedToAccountController.getAccountRelatedContactCount';
import getAllAccountRelatedContactRecords from '@salesforce/apex/ContactRelatedToAccountController.getAllAccountRelatedContactRecords';
import getAccountName from '@salesforce/apex/ContactRelatedToAccountController.getAccountName';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import activeCommunities from '@salesforce/label/c.active_communities';
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import CONTACT_TITLE_FIELD from '@salesforce/schema/Contact.Title';
import CONTACT_ASSET_CLASS_COVERAGE_FIELD from '@salesforce/schema/Contact.Asset_Class_Coverage__c';
import CONTACT_TYPE_FIELD from '@salesforce/schema/Contact.Contact_Type__c';
import CONTACT_EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import getUserDetails from '@salesforce/apex/ContactRelatedToAccountController.getUserDetails';
import userId from '@salesforce/user/Id';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';
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
    { label: 'Title', sortable: true, fieldName: CONTACT_TITLE_FIELD.fieldApiName, type: 'text' },
    { label: 'Email', sortable: true, fieldName: CONTACT_EMAIL_FIELD.fieldApiName, type: 'email' },
    { label: 'Asset Class Coverage', sortable: true, fieldName: 'Asset_Class_Coverage', type: 'text' },
    { label: 'Contact Type', sortable: true, fieldName: 'Contact_Type', type: 'Picklist' },
    { label: 'Metro Area', sortable: true, fieldName: "MetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' } },
    { label: 'College', sortable: false, fieldName: "ContactEducationCollegeLink", type: 'url', typeAttributes: { label: { fieldName: 'ContactEducationCollegeName' }, tooltip: { fieldName: 'ContactEducationCollegeName' }, target: '_self' } }
]

export default class ContactRelatedToAccountViewAll extends NavigationMixin(LightningElement) {

    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    recordType = '';
    relatedListName = 'Contacts';
    faTeamsList = ['Bank', 'Broker-Dealer', 'Broker Dealer'];
    recNameAvailable = false;
    recordLink;
    accountNameLink;
    relatedContactRecords
    totalRelatedContactsCount;
    columns = COLUMNS;
    tempAddAction = [];
    offset = 0;
    limit = 50;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortDirection;
    nameSortDir = this.defaultSortDirection;
    sortedBy = 'recordLink';
    plusSign = null;
    @track isLoading = false;
    @track isLoadingCreateCon = false;
    @track showModal = false;
    @track showToast = false;
    userId = userId;
    @track userFirstName = '';
    @track error;
    @track areDetailsVisible = false;
    infiniteLoading = false;

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
    maxFollowCount = Allowed_Follow_Record_Count;
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
                        this.relatedContactRecords.forEach((element, index) => {
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
                        this.relatedContactRecords = [...tempList];
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
                this.relatedContactRecords.forEach((element, index) => {
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
                this.relatedContactRecords = [...tempList];
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
                    this.relatedContactRecords.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.relatedContactRecords[index].isFavorite = true;
                            this.relatedContactRecords[index].favoriteIcon = 'utility:check';
                            this.relatedContactRecords[index].favId = favElement.Favorite_Id__c;
                            this.relatedContactRecords[index].favIconColor = "selectedFavIcon";
                            this.relatedContactRecords[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.relatedContactRecords = [...this.relatedContactRecords];
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
            this.relatedContactRecords.forEach((element, index) => {
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
            this.relatedContactRecords = [...tempList];
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
        registerListener('updateContactList', this.removeFromFollowList, this);
        Promise.all([
            loadStyle(this, followIconStyle)
        ]);

        this.isLoading = true;
        this.setLinks();

        //To get count of related Contact records


        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordType = returnedAccount.Type;
                if (this.recordType && this.faTeamsList.includes(this.recordType)) {
                    this.relatedListName = 'Research Contacts';
                }
                this.recordName = returnedAccount.Name;
                this.recNameAvailable = true;
            }

            getAccountRelatedContactCount({
                recordId: this.recordId,
                relatedListName: this.relatedListName
            }).then(contactRecordCount => {
                if (contactRecordCount) {
                    this.totalRelatedContactsCount = contactRecordCount;
                    // Get related Contact records
                    getAllAccountRelatedContactRecords({
                        recordId: this.recordId,
                        recordLimit: this.limit,
                        offset: this.offset,
                        relatedListName: this.relatedListName
                    }).then(relatedContacts => {
                        if (relatedContacts) {
                            var tempContactList = [];
                            for (let i = 0; i < relatedContacts.length; i++) {
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
                            this.relatedContactRecords = tempContactList;
                            this.getAllFavoriteRecordsFromAPI();
                            this.offset = tempContactList.length;
                            this.isLoading = false;
                            // For showing + sign with count
                            if ((this.offset) >= this.totalRelatedContactsCount || (this.offset) == 0) {
                                this.plusSign = '';
                            }
                            else {
                                this.plusSign = '+';
                            }
                            this.sortedDirection = 'asc';
                            this.sortedBy = 'recordLink';
                            // this.sortData(this.sortedBy,this.sortDirection);
                            this.infiniteLoading = false;
                        }

                    }).catch(error => {
                        this.infiniteLoading = false;
                        this.isLoading = false;
                        console.log("Error:", error);
                    });
                }
                else {
                    this.isLoading = false;
                }
                
            })



        });
    }

    // Set breadcrumb links
    setLinks() {
        this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
        this.accountNameLink = "/" + this.communityName + '/s/account/Account/Default';
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

    // To refresh table
    refreshTable(event) {
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.relatedContactRecords = null;
        this.connectedCallback();
    }

    /**
    * For sorting the table
    * @param {*} event 
    */
    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }

    /**
     * Helper function to sort the table
     * @param {*} fieldname 
     * @param {*} direction 
     */
    sortData(fieldname, direction) {
        // serialize the data before calling sort function
        let parseData = JSON.parse(JSON.stringify(this.relatedContactRecords));

        // Return the value stored in the field  
        if (fieldname == 'recordLink') {
            fieldname = CONTACT_NAME_FIELD.fieldApiName;
        }
        else if (fieldname == 'MetroAreaLink') {
            fieldname = 'MetroAreaName';
        }
        let keyValue = (a) => {
            return a[fieldname];
        };

        // checking reverse direction 
        let isReverse = direction === 'asc' ? 1 : -1;

        // sorting data 
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x).toLowerCase() : ''; // handling null values
            y = keyValue(y) ? keyValue(y).toLowerCase() : '';

            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });

        // set the sorted data to data table data
        this.relatedContactRecords = parseData;
    }

    loadMoreData(event) {
        if (this.totalRelatedContactsCount > this.offset) {
            if (this.infiniteLoading)
                return;
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if (this.relatedContactRecords != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            getAllAccountRelatedContactRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset,
                relatedListName: this.relatedListName
            }).then(relatedContacts => {
                var tempSearchList = [];
                for (var i = 0; i < relatedContacts.length; i++) {
                    let tempContactRecord = Object.assign({}, relatedContacts[i]); //cloning object 
                    tempContactRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.Id;
                    if (tempContactRecord.metroAreaId != undefined)
                        tempContactRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.metroAreaId;

                    if (tempContactRecord.metroAreaId != undefined)
                        tempContactRecord.MetroAreaName = tempContactRecord.metroAreaName;
                    if (tempContactRecord.ContactEducationCollege) {
                        tempContactRecord.ContactEducationCollegeLink = "/" + this.communityName + "/s/university-alumni/" + tempContactRecord.ContactEducationCollege;
                    }
                    tempContactRecord.favoriteIcon = 'utility:add';
                    tempContactRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                    tempContactRecord.iconStatus = 'Click To Follow';
                    tempSearchList.push(tempContactRecord);
                }

                if (this.relatedContactRecords)
                    this.relatedContactRecords = this.relatedContactRecords.concat(tempSearchList);
                this.getAllFavoriteRecordsFromAPI();
                if ((this.offset + 50) >= this.totalRelatedContactsCount || (this.offset) == 0) {
                    this.offset = this.totalRelatedContactsCount;
                    this.plusSign = '';
                } else {
                    this.offset = parseInt(this.offset) + parseInt(this.limit);
                    this.plusSign = '+';
                }
                if (this.sortedBy != undefined && this.sortedDirection != undefined) {
                    this.sortData(this.sortedBy, this.sortedDirection);
                }
                this.loadMoreStatus = '';
                if (this.tableElement) {
                    this.tableElement.isLoading = false;
                }
                this.infiniteLoading = false;
            }).catch(error => {
                this.infiniteLoading = false;
                console.log("Error:", error);
            });
        }
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

    handleLoad(event) {

        window.console.time("LDS call");
        const recUi = event.detail;
        this.areDetailsVisible = true;
        window.console.timeEnd("LDS call");
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }
}