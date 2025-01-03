import { LightningElement, api,track,wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getJobChanges from '@salesforce/apex/jobAndRoleChangesController.getJobChanges';
import getJobRecordsCount from '@salesforce/apex/jobAndRoleChangesController.getJobRecordsCount';
import getRoleRecordsCount from '@salesforce/apex/jobAndRoleChangesController.getRoleRecordsCount';
import getRoleChanges from '@salesforce/apex/jobAndRoleChangesController.getRoleChanges';
import DATE_FIELD from '@salesforce/schema/Update__c.Last_Updated_Date__c';
import TITLE_FIELD from '@salesforce/schema/Update__c.New_Title__c';
import FIRM_JOINED_FIELD from '@salesforce/schema/Update__c.Firm_Joined_Name__c';
import CONTACT_FIELD from '@salesforce/schema/Update__c.Contact_Name__c';
import FIRM_JOINED_INVESTMENT_FOCUS_FIELD from '@salesforce/schema/Update__c.Firm_Joined_Investment_Focus__c';
import FIRM_LEFT_INVESTMENT_FOCUS_FIELD from '@salesforce/schema/Update__c.Firm_Left_Investment_Focus__c';
import INVESTMENT_FOCUS_FIELD from '@salesforce/schema/Update__c.Investment_Focus__c';
import OLD_TITLE_FIELD from '@salesforce/schema/Update__c.Old_Title__c';
import activeCommunities from '@salesforce/label/c.active_communities';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import { loadStyle } from 'lightning/platformResourceLoader';
import jobAndRoleChangesWrapText from '@salesforce/resourceUrl/jobAndRoleChangesWrapText';
import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import {fireEvent,registerListener,unregisterAllListeners} from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';
import followIconStyle from '@salesforce/resourceUrl/followIconStyle';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';

const JOBCOLUMNS = [
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
    { label: 'Contact Name', sortable: true, fieldName: CONTACT_FIELD.fieldApiName, type: 'richText', wrapText: true },
    { label: 'Firm Left', sortable: true, fieldName: "firmLeftId", type: 'url', wrapText: true, typeAttributes: { label: { fieldName: 'firmLeftName' }, tooltip: { fieldName: 'firmLeftName' }, target: '_self' } },
    { label: 'Firm Joined', sortable: true, fieldName: FIRM_JOINED_FIELD.fieldApiName, type: 'richText', wrapText: true },
    { label: 'New Title', sortable: true, fieldName: TITLE_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'Last Updated Date', sortable: true, fieldName: DATE_FIELD.fieldApiName, type: 'text' },
    {
        type: "button-icon",
        initialWidth: 50,
        cellAttributes: {
            class: 'cstm_styling'
        },
        typeAttributes: {
            iconName: {
                fieldName: "shareIcon",
            },
            name: "shared_record",
            iconClass: {
                fieldName: "shareIconColor",
            },
            variant: "bare",
            title: {
                fieldName: 'shareIconStatus'
            }
        }
    },
]

const TALENTJOBCOLUMNS = [

    { label: 'Contact Name', sortable: true, fieldName: CONTACT_FIELD.fieldApiName, type: 'richText', wrapText: true },
    { label: 'Firm Left', sortable: true, fieldName: "firmLeftId", type: 'url', wrapText: true, typeAttributes: { label: { fieldName: 'firmLeftName' }, tooltip: { fieldName: 'firmLeftName' }, target: '_self' } },
    { label: 'Firm Joined', sortable: true, fieldName: FIRM_JOINED_FIELD.fieldApiName, type: 'richText', wrapText: true },
    { label: 'New Title', sortable: true, fieldName: TITLE_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'Firm Joined Investment Focus', sortable: true, fieldName: FIRM_JOINED_INVESTMENT_FOCUS_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'Firm Left Investment Focus', sortable: true, fieldName: FIRM_LEFT_INVESTMENT_FOCUS_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'Last Updated Date', sortable: true, fieldName: DATE_FIELD.fieldApiName, type: 'text' }
]

const ROLECOLUMNS = [
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
    { label: 'Contact Name', sortable: true, fieldName: CONTACT_FIELD.fieldApiName, type: 'richText', wrapText: true },
    { label: 'Account Name', sortable: true, fieldName: "accountId", type: 'url', wrapText: true, typeAttributes: { label: { fieldName: 'accountName' }, tooltip: { fieldName: 'accountName' }, target: '_self' } },
    { label: 'Old Title', sortable: true, fieldName: OLD_TITLE_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'New Title', sortable: true, fieldName: TITLE_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'Last Updated Date', sortable: true, fieldName: DATE_FIELD.fieldApiName, type: 'text' },
    {
        type: "button-icon",
        initialWidth: 50,
        cellAttributes: {
            class: 'cstm_styling'
        },
        typeAttributes: {
            iconName: {
                fieldName: "shareIcon",
            },
            name: "shared_record",
            iconClass: {
                fieldName: "shareIconColor",
            },
            variant: "bare",
            title: {
                fieldName: 'shareIconStatus'
            }
        }
    },
]

const TALENTROLECOLUMNS = [

    { label: 'Contact Name', sortable: true, fieldName: CONTACT_FIELD.fieldApiName, type: 'richText', wrapText: true },
    { label: 'Account Name', sortable: true, fieldName: "accountId", type: 'url', wrapText: true, typeAttributes: { label: { fieldName: 'accountName' }, tooltip: { fieldName: 'accountName' }, target: '_self' } },
    { label: 'Old Title', sortable: true, fieldName: OLD_TITLE_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'New Title', sortable: true, fieldName: TITLE_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'Investment Focus', sortable: true, fieldName: INVESTMENT_FOCUS_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'Last Updated Date', sortable: true, fieldName: DATE_FIELD.fieldApiName, type: 'text' }
]

export default class JobAndRoleChanges extends NavigationMixin(LightningElement) {
    @api type;
    @api page;
    offset = 0;
    limit = 50;
    conRecordId;
    plusSign;
    isLoading = false;
    columns;
    totalChangesCount = 0;
    totalRecords = '0';
    nullOrder = 'LAST';
    defaultSortDirection = 'desc';
    sortedBy = DATE_FIELD.fieldApiName;
    sortedDirection = 'desc';
    nameSortDir = this.defaultSortDirection;
    tempSortBy = '';
    @track data;
    @track allFavoriteRecords = [];
    dataSorting = false;
    fromLoadMore = false;
    infiniteLoading = false;
    tableElement;
    tableHeight = '';
    searchValue = '';
    showSearch = false;
    headerTitle;
    timeZone = TIME_ZONE;
    toastmessage;
    title;
    alternativeText;
    iconName;
    toastMsgClasses;
    toastMsgIconClasses;
    @track showToast = false;
    sharePopup = false;
    @wire(CurrentPageReference) objPageReference;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    isNotHomePage = false;
    maxFollowCount = Allowed_Follow_Record_Count;
    selectedIds=[];
    selectedContactIds = [];

    connectedCallback() {
        registerListener('updateContactList',this.removeFromFollowList,this);
        Promise.all([
            loadStyle(this, jobAndRoleChangesWrapText)
        ]);
        this.isNotHomePage = (this.page != 'Home');
        this.setRecordsInInitialState();
    }

    /**
     * Row Action Handler
     * @param {Object} event 
     */
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName == 'fav_record') {
            this.followOrUnFollowContact(row);
        }
        else if (actionName == 'shared_record') {
            this.conRecordId = row.Contact__c;
            if (this.conRecordId) {
                this.sharePopup = true;
            } else {
                this.toastmessage = 'Contact unavailable. Try sharing another one.';
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
            this.isLoading = false;
        }
    }

    removeSpinner() 
    {
        this.isLoading = false;
    }

    handleclosepopup()
    {
        this.sharePopup = false;
    }

    followOrUnFollowContact(row) {
        this.conRecordId = row.Contact__c;
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
                        this.data.forEach((element, index) => {
                            let temObj = Object.assign({}, element);
                            if (element.Contact__c == this.conRecordId) {
                                temObj.isFavorite = true;
                                temObj.favoriteIcon = 'utility:check';
                                temObj.favId = createdFavouriteRecord.id;
                                temObj.favIconColor = "selectedFavIcon";
                                temObj.iconStatus = 'Click To Unfollow';

                            }
                            tempList.push(temObj);
                        });
                        this.data = [...tempList];
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
                        this.toastmessage = 'Contact unavailable. Try following another one.';
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
                        this.toastmessage = 'Contact unavailable. Try following another one.';
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
                    this.data.forEach((element, index) => {
                        let temObj = Object.assign({}, element);
                        if (element.Contact__c == this.conRecordId) {
                            temObj.isFavorite = false;
                            temObj.favoriteIcon = 'utility:add';
                            temObj.favId = '';
                            temObj.favIconColor = "slds-icon-text-light addIconStyling";
                            temObj.iconStatus = 'Click To Follow';

                        }
                        tempList.push(temObj);
                    });
                    this.data = [...tempList];
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
        this.isLoading = true;
            let favToBeRemovedId = objPayLoad;
            removeFromFavorites({
                favId: favToBeRemovedId
            }).then(() => {
                    var tempList = [];
                    this.data.forEach((element, index) => {
                        let temObj = Object.assign({}, element);
                        if (element.Contact__c == objPayLoad) {
                            temObj.isFavorite = false;
                            temObj.favoriteIcon = 'utility:add';
                            temObj.favId = '';
                            temObj.favIconColor = "slds-icon-text-light addIconStyling";
                            temObj.iconStatus = 'Click To Follow';

                        }
                        tempList.push(temObj);
                    });
                    this.data = [...tempList];
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
                this.allFavoriteRecords.forEach((favElement, favIndex) => {
                    this.data.forEach((element, index) => {
                        if (element.Contact__c == favElement.Target_Id__c) {
                            this.data[index].isFavorite = true;
                            this.data[index].favoriteIcon = 'utility:check';
                            this.data[index].favId = favElement.Favorite_Id__c;
                            this.data[index].favIconColor = "selectedFavIcon";
                            this.data[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.data = [...this.data];
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



    setRecordsInInitialState() {
        this.isLoading = true;
        this.headerTitle = this.type + ' Changes';

        if (this.page == 'Home') {
            this.tableHeight = 'dataTableHeightHomeJR';
            this.showSearch = false;
        }
        else {
            this.tableHeight = 'customViewAll';
            this.showSearch = true;
        }

        if (this.type == 'Job') {
            if (this.communityName == 'marketplace2') {
                this.columns = TALENTJOBCOLUMNS;
            }
            else {
                this.columns = JOBCOLUMNS;
            }

            getJobRecordsCount({
                search: this.searchValue
            }).then(jobCount => {
                if (jobCount) {
                    this.totalChangesCount = jobCount;
                }
                this.setFieldSorting();
                this.getJobChanges(this.searchValue, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
                this.sortedDirection = 'desc';
                this.sortedBy = DATE_FIELD.fieldApiName;
            }).catch(error => {
                console.log("Error in fetching total count of Job Changes records : ", error);
            });
        }
        else {
            if (this.communityName == 'marketplace2') {
                this.columns = TALENTROLECOLUMNS;
            }
            else {
                this.columns = ROLECOLUMNS;
            }

            getRoleRecordsCount({
                search: this.searchValue
            }).then(roleCount => {
                if (roleCount) {
                    this.totalChangesCount = roleCount;
                }
                this.setFieldSorting();
                this.getRoleChanges(this.searchValue, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
                this.sortedDirection = 'desc';
                this.sortedBy = DATE_FIELD.fieldApiName;
            }).catch(error => {
                console.log("Error in fetching total count of Role Changes records : ", error);
            });

        }
    }

    setFieldSorting() {
        this.tempSortBy = this.sortedBy;
        if (this.sortedBy === 'firmLeftId') {
            this.tempSortBy = 'Firm_Left__r.Name';
        }
        else if (this.sortedBy === 'accountId') {
            this.tempSortBy = 'Account__r.Name';
        }
    }

    getJobChanges(search, sortedBy, sortedDirection, limit, offset) {
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }


        getJobChanges({
            search: search,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            recLimit: limit,
            offset: offset,
            nullOrder: this.nullOrder
        })
            .then((jobChangesRecords) => {
                if (jobChangesRecords) {
                    let len = jobChangesRecords.length;
                    let jobChangesList = [];
                    for (let i = 0; i < len; i++) {
                        let returnedData = Object.assign({}, jobChangesRecords[i]); //cloning object
                        if (returnedData.Firm_Left__c && returnedData.Firm_Left__r) {
                            returnedData.firmLeftId = "/" + this.communityName + '/s/account/' + returnedData.Firm_Left__c;
                            returnedData.firmLeftName = returnedData.Firm_Left__r.Name;
                        }
                        if (returnedData.Last_Updated_Date__c) {
                            returnedData.Last_Updated_Date__c = this.updateDateFormate(returnedData.Last_Updated_Date__c);
                        }
                        returnedData.favoriteIcon = 'utility:add';
                        returnedData.shareIcon = 'utility:share';
                        returnedData.favIconColor = 'slds-icon-text-light addIconStyling';
                        returnedData.iconStatus = 'Click To Follow';
                        returnedData.shareIconColor = 'slds-icon-text-light';
                        returnedData.shareIconStatus = 'Click To Share';

                        jobChangesList.push(returnedData);
                    }

                    if (this.fromLoadMore) {
                        if (this.data)
                            this.data = this.data.concat(jobChangesList);
                        if ((this.offset + this.limit) >= this.totalChangesCount || (this.offset) == 0) {
                            this.offset = this.totalChangesCount;
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
                        this.data = [];
                        this.data = jobChangesList;
                    }

                    this.offset = this.data.length;
                    if ((this.data.length) >= this.totalChangesCount) {
                        this.plusSign = '';
                    } else {
                        this.plusSign = '+';
                    }
                } else {
                    this.data = null;
                }
                this.getAllFavoriteRecordsFromAPI();
                this.isLoading = false;
                if (this.dataSorting) {
                    this.dataSorting = false;
                }
            })
            .catch((error) => {
                console.log('Error in fetching job changes records : ', error);
                this.isLoading = false;
                this.infiniteLoading = false;
            });
    }

    getRoleChanges(search, sortedBy, sortedDirection, limit, offset) {
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }

        getRoleChanges({
            search: search,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            recLimit: limit,
            offset: offset,
            nullOrder: this.nullOrder
        })
            .then((roleChangesRecords) => {
                if (roleChangesRecords) {
                    let len = roleChangesRecords.length;
                    let roleChangesList = [];
                    for (let i = 0; i < len; i++) {
                        let returnedData = Object.assign({}, roleChangesRecords[i]); //cloning object
                        if (returnedData.Account__c && returnedData.Account__r) {
                            returnedData.accountId = "/" + this.communityName + '/s/account/' + returnedData.Account__c;
                            returnedData.accountName = returnedData.Account__r.Name;
                        }
                        if (returnedData.Last_Updated_Date__c) {
                            returnedData.Last_Updated_Date__c = this.updateDateFormate(returnedData.Last_Updated_Date__c);
                        }
                        returnedData.favoriteIcon = 'utility:add';
                        returnedData.favIconColor = 'slds-icon-text-light addIconStyling';
                        returnedData.iconStatus = 'Click To Follow';

                        returnedData.shareIcon = 'utility:share';

                        returnedData.shareIconColor = 'slds-icon-text-light';
                        returnedData.shareIconStatus = 'Click To Share';
                        roleChangesList.push(returnedData);
                    }

                    if (this.fromLoadMore) {
                        if (this.data)
                            this.data = this.data.concat(roleChangesList);
                        if ((this.offset + this.limit) >= this.totalChangesCount || (this.offset) == 0) {
                            this.offset = this.totalChangesCount;
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
                        this.data = [];
                        this.data = roleChangesList;
                    }

                    this.offset = this.data.length;
                    if ((this.data.length) >= this.totalChangesCount) {
                        this.plusSign = '';
                    } else {
                        this.plusSign = '+';
                    }
                } else {
                    this.data = null;
                }
                this.getAllFavoriteRecordsFromAPI();
                this.isLoading = false;
                if (this.dataSorting) {
                    this.dataSorting = false;
                }
            })
            .catch((error) => {
                console.log('Error in fetching role changes records : ', error);
                this.isLoading = false;
                this.infiniteLoading = false;
            });
    }

    updateDateFormate(dateWithComma) {
        let dateTime = new Date(dateWithComma);
        let options = { hour12: true, day: '2-digit', month: '2-digit', year: 'numeric',  timeZone: this.timeZone };
        return dateTime.toLocaleString('en', options).replace(',', '');
    }

    searchUpdatesOnEnter(event) {
        if (event.keyCode == 13) {
            this.isLoading = true;
            this.offset = 0;
            this.plusSign = '';
            this.totalChangesCount = 0;
            this.searchValue = this.template.querySelector('[data-id="searchValue"]').value;
            this.setRecordsInInitialState();
        }
    }

    updateColumnSorting(event) {
        this.isLoading = true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.dataSorting = true;

        this.setFieldSorting();

        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        if (this.type == 'Job') {
            this.getJobChanges(this.searchValue, this.tempSortBy, this.sortedDirection, this.offset, 0);
        }
        else {
            this.getRoleChanges(this.searchValue, this.tempSortBy, this.sortedDirection, this.offset, 0);
        }
    }

    loadMoreData(event) {
        if (this.totalChangesCount > this.offset) {
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
            this.setFieldSorting();
            if (this.type == 'Job') {
                this.getJobChanges(this.searchValue, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
            }
            else {
                this.getRoleChanges(this.searchValue, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
            }
        }
    }

    refreshTable() {
        this.isLoading = true;
        this.totalChangesCount = 0;
        this.offset = 0;
        this.limit = 50;
        this.plusSign = '';
        this.sortedDirection = 'desc';
        this.defaultSortDirection = 'desc';
        this.nameSortDir = this.defaultSortDirection;
        this.sortedBy = DATE_FIELD.fieldApiName;
        this.searchValue = this.template.querySelector('[data-id="searchValue"]').value;
        this.setRecordsInInitialState();
    }
    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    handleFollowUpdates(){
        let objChild = this.template.querySelector('c-mass-follow-list');

        if(this.selectedIds.length == 0)
        {
            objChild.showFollowToastMessage();
        }
        else
        {
            objChild.recordIdList = this.selectedIds;
            objChild.objectName = this.headerTitle;
            objChild.recordExist = 'true';
            objChild.redirectToListView();
        }
    }

    hanldeRecordSelected(event) {
        this.selectedIds=[];
        this.selectedContactIds=[];
        let selectedRows = event.detail.selectedRows;    
        selectedRows.forEach((element)=> {
            this.selectedIds.push(element.Id);
            if(element?.Contact__c)
            {
                this.selectedContactIds.push(element?.Contact__c);
            }
        });
        
    }

    handleShareUpdates()
    {
        let objChild = this.template.querySelector('c-mass-share-list-view-popup');

        if(this.selectedContactIds.length == 0)
        {
            objChild.showToastMessage();
        }
        else
        {
            objChild.recordIdList = this.selectedContactIds;
            objChild.sharePopup = true;
        }
    }
}