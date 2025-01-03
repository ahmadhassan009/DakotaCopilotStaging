import { LightningElement, api,track,wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation"
import getAllRelatedAccountRecords from '@salesforce/apex/AccountsOfMetroAreaRelatedListController.getAllRelatedAccountRecords';
import getRelatedAccountCount from '@salesforce/apex/AccountsOfMetroAreaRelatedListController.getRelatedAccountCount';
import getAllRelatedSortedAccountsRecords from '@salesforce/apex/AccountsOfMetroAreaRelatedListController.getAllRelatedSortedAccountsRecords';
import getMetroAreaNameObj from '@salesforce/apex/AccountsOfMetroAreaRelatedListController.getMetroAreaNameObj';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import activeCommunities from '@salesforce/label/c.active_communities';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE from '@salesforce/schema/Account.Type';
import AUM from '@salesforce/schema/Account.AUM__c';
import WEBSITE from '@salesforce/schema/Account.Website';
import BILLINGCITY from '@salesforce/schema/Account.BillingCity';
import DESCRIPTION from '@salesforce/schema/Account.Description';

import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import {fireEvent,registerListener,unregisterAllListeners} from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';
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
    { label: 'Account Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Type', fieldName: TYPE.fieldApiName, type: 'Picklist' , sortable: true},
    { label: 'AUM', fieldName: AUM.fieldApiName, type: 'currency', sortable: true, typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Website', fieldName: WEBSITE.fieldApiName, type: "url", sortable: true},
    { label: 'Billing City', fieldName: BILLINGCITY.fieldApiName, type: 'Address', sortable: true },
    { label: 'Description', fieldName: DESCRIPTION.fieldApiName, type: 'Long Text Area'},
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];
const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];

export default class AccountsViewAllPanel extends NavigationMixin(LightningElement) {
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    @api isCommunity;
    recordLink;
    maNameLink;
    relatedAccountRecords;
    totalRelatedAccountsCount;
    columns = COLUMNS;
    tempAddAction = [];
    isCommunityBoolean;
    offset = 0;
    limit = 50;
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = AUM.fieldApiName;
    plusSign;
    @track isLoading=false;
    RelatedAccounts;
    newbuttonPressed = false;
    infiniteLoading = false;
    maxFollowCount = Allowed_Follow_Record_Count;
    @track allFavoriteRecords = [];
    toastmessage;
    title;
    alternativeText;
    iconName;
    toastMsgClasses;
    toastMsgIconClasses;
    @track showToast = false;

    @wire(CurrentPageReference) objPageReference;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    removeFromFollowList(objPayLoad) {
        let favToBeRemovedId = objPayLoad;
        removeFromFavorites({
            favId: favToBeRemovedId
        }).then(() => {
                var tempList = [];
                this.relatedAccountRecords.forEach((element, index) => {
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
                this.relatedAccountRecords = [...tempList];
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
    connectedCallback() {
        this.isLoading = true;
        registerListener('updateAccountList',this.removeFromFollowList,this);

        Promise.all([
            loadStyle(this, followIconStyle)
        ]);
        this.isCommunityBoolean = this.isCommunity == 'false' ? false : true;
        // To set links for breadcrumbs
        this.setLinks();

        this.tempAddAction = COLUMNS;
        if(this.isCommunityBoolean)
        {
            this.tempAddAction=[...this.tempAddAction,{
                type: 'action',
                typeAttributes: { rowActions: noActions },
            }];
        }
        else
        {
            this.tempAddAction=[...this.tempAddAction,{
             type: 'action',
             typeAttributes: { rowActions: actions },
            }];
        }
        this.columns = this.tempAddAction;

        //To get count of related records
        getRelatedAccountCount({
            recordId: this.recordId
        }) .then (accountsRecordCount => {
            if(accountsRecordCount) {
                this.totalRelatedAccountsCount = accountsRecordCount;
            }
        }) .catch(error => {});

        // Get related marketplace searches records
        getAllRelatedAccountRecords({
            recordId: this.recordId,
            recordLimit: this.limit,
            offset: this.offset, 
        }) .then (relatedAccounts => {
            if (relatedAccounts) { 
                var tempAccountsList = [];  
                for (var i = 0; i < relatedAccounts.length; i++) {  
                    let tempRecord = Object.assign({}, relatedAccounts[i]); //cloning object  
                    if(this.isCommunityBoolean)
                    {
                        tempRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempRecord.Id;
                    }
                    else
                    {
                        tempRecord.recordLink = "/" + tempRecord.Id;

                    }
                    tempRecord.favoriteIcon = 'utility:add';
                    tempRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                    tempRecord.iconStatus = 'Click To Follow';
                    tempAccountsList.push(tempRecord);             
                }
                this.relatedAccountRecords = tempAccountsList;
                this.getAllFavoriteRecordsFromAPI();
                this.offset = tempAccountsList.length; 
                this.isLoading = false;
                // For showing + sign with count
                if((this.offset) >= this.totalRelatedAccountsCount || (this.offset) == 0)
                {
                    this.plusSign = '';
                }
                else
                {
                    this.plusSign = '+';
                }
                this.infiniteLoading = false;
            }
        }) .catch(error => {
            this.isLoading=false;
            this.infiniteLoading = false;
            console.log("Error:" , error);
        });

        getMetroAreaNameObj({
            recordId : this.recordId
        }).then(returnedMetroArea => {
            if(returnedMetroArea != null)
            {
                this.recordName = returnedMetroArea.Name;
            }
        });
    
    
    }

    onHandleSort(event) {

        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;

        if (sortedBy == 'recordLink') {
            this.sortedBy = 'Name';
        } else if (sortedBy == 'Type') {
            this.sortedBy = 'Type';
        } else if (sortedBy == 'AUM__c') {
            this.sortedBy = 'AUM__c';
        } else if (sortedBy == 'Website') {
            this.sortedBy = 'Website';
        } else if (sortedBy == 'BillingCity') {
            this.sortedBy = 'BillingCity';
        } else {
            this.sortedBy = 'AUM__c';
        }

        this.sortedDirection = sortDirection;

        // Get related Account records
        getAllRelatedSortedAccountsRecords({
            recordId: this.recordId,
            recordLimit: this.offset,
            offset: 0,
            sortBy: this.sortedBy,
            sortOrder: this.sortedDirection
        }).then (relatedSortedAccounts => {
            if (relatedSortedAccounts) { 
                var tempSortedSearchesList = [];  
                for (var i = 0; i < relatedSortedAccounts.length; i++) {  
                    let tempAccountRecord = Object.assign({}, relatedSortedAccounts[i]); //cloning object  
                    if(this.isCommunityBoolean)
                    {
                        tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;  
                    }
                    else
                    {
                        tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;     
                    }
                    tempAccountRecord.favoriteIcon = 'utility:add';
                    tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                    tempAccountRecord.iconStatus = 'Click To Follow';
                    tempSortedSearchesList.push(tempAccountRecord);             
                }
                this.relatedAccountRecords = tempSortedSearchesList;
                this.getAllFavoriteRecordsFromAPI();
                this.offset = tempSortedSearchesList.length; 
                this.isLoading = false;
            }
        }) .catch(error => {
            this.isLoading=false;
        });

        if (this.sortedBy == 'Name') {
            this.sortedBy = 'recordLink';
        }
    }

    loadMoreData(event) {
        if(this.totalRelatedAccountsCount > this.offset) {
            if (this.infiniteLoading) 
                return;
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if(this.relatedAccountRecords != null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';

            if (this.sortedBy == 'recordLink') {
                this.sortedBy = 'Name';
            }

            getAllRelatedSortedAccountsRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset,
                sortBy: this.sortedBy,
                sortOrder: this.sortedDirection
            }).then (relatedAccounts => {
                if (relatedAccounts) { 
                    var tempSearchList = [];  
                    for (var i = 0; i < relatedAccounts.length; i++) {  
                        let tempAccountRecord = Object.assign({}, relatedAccounts[i]); //cloning object  
                        if(this.isCommunityBoolean)
                        {
                            tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;  
                        }
                        else
                        {
                            tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;     
                        }
                        tempAccountRecord.favoriteIcon = 'utility:add';
                        tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                        tempAccountRecord.iconStatus = 'Click To Follow';
                        tempSearchList.push(tempAccountRecord);             
                    }
                    if(this.relatedAccountRecords)
                        this.relatedAccountRecords =  this.relatedAccountRecords.concat(tempSearchList);
                        this.getAllFavoriteRecordsFromAPI();
                    if((this.offset + this.limit) >= this.totalRelatedAccountsCount || (this.offset) == 0)
                    {
                        this.offset = this.totalRelatedAccountsCount;
                        this.plusSign = '';
                    } else 
                    {
                        this.offset = parseInt(this.offset ) + parseInt(this.limit);
                        this.plusSign = '+';
                    }

                    this.loadMoreStatus = '';
                    if(this.tableElement){
                        this.tableElement.isLoading = false;
                    }    
                    this.infiniteLoading = false;
                }
            }) .catch(error => {
                this.infiniteLoading = false;
                console.log("Error:" , error);
            });

            if (this.sortedBy == 'Name') {
                this.sortedBy = 'recordLink';
            }
        }
    }

    // To create new record
    createNewRecord(event) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });
    
        onError(error => {
            console.error('Received error from server SF: ', error);
        });
        this.newbuttonPressed = true;
        let newSearchRecord = { 
            type: 'standard__objectPage', 
            attributes: { objectApiName: 'Account', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                useRecordTypeCheck:'yes',
                defaultFieldValues:"MetroArea__c="+this.recordId
            },
        };  
        this[NavigationMixin.Navigate](newSearchRecord);
        this.newbuttonPressed = true;
    }

    handleEvent = event => {

        const refreshRecordEvent = event.data.payload;
        this.newbuttonPressed = false;
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
        this.sortedDirection = 'desc';
        this.sortedBy = AUM.fieldApiName;
        this.RelatedAccounts = null;
        this.relatedAccountRecords = null;
        var table = this.template.querySelector('lightning-datatable');
        table.enableInfiniteLoading=true;
        return refreshApex(this.connectedCallback());

    }

    //Handle row actions for datatable
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
        this.accRecordId = row.Id;
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
                addToFavorites({
                    recordId: this.accRecordId,
                    targetType: favTargetType
                }).then((createdFavouriteRecord) => {
                    if (createdFavouriteRecord) {
                        var tempList = [];
                        this.relatedAccountRecords.forEach((element, index) => {
                            let temObj = Object.assign({}, element);
                            if (element.Id == this.accRecordId) {
                                temObj.isFavorite = true;
                                temObj.favoriteIcon = 'utility:check';
                                temObj.favId = createdFavouriteRecord.id;
                                temObj.favIconColor = "selectedFavIcon";
                                temObj.iconStatus = 'Click To Unfollow';

                            }
                            tempList.push(temObj);
                        });
                        this.relatedAccountRecords = [...tempList];
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
            let favToBeRemovedId = this.accRecordId;
            removeFromFavorites({
                favId: favToBeRemovedId
            }).then(() => {
                    var tempList = [];
                    this.relatedAccountRecords.forEach((element, index) => {
                        let temObj = Object.assign({}, element);
                        if (element.Id == this.accRecordId) {
                            temObj.isFavorite = false;
                            temObj.favoriteIcon = 'utility:add';
                            temObj.favId = '';
                            temObj.favIconColor = "slds-icon-text-light addIconStyling";
                            temObj.iconStatus = 'Click To follow';

                        }
                        tempList.push(temObj);
                    });
                    this.relatedAccountRecords = [...tempList];
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

    //Deletion handler
    deleteRow(row) {
        this.isLoading=true;
        this.recordToDel= JSON.stringify(row.Id).replace(/['"]+/g, '');

        deleteRecord(this.recordToDel)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record deleted',
                        variant: 'success'
                    })

                );
                this.isLoading=false;
                this.refreshTable();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: 'Error Occured While Deleting The Record',
                        variant: 'error'
                    })
                );
                this.isLoading=false;
            });
    }

    //Edit handler
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

    // Set breadcrumb links
    setLinks() {
        if(this.isCommunityBoolean) {  
            this.recordLink = "/"+this.communityName+"/s/metro-area/" + this.recordId;
            this.maNameLink = "/"+this.communityName + '/s/metro-area/Metro_Area__c/Default';
        } else {
            this.recordLink = '/'+this.recordId;
            this.maNameLink = '/one/one.app#/sObject/Metro_Area__c/list?filterName=Recent';
        }  
    }

    getAllFavoriteRecordsFromAPI() {
        getAllFavoriteRecords({}).then(returnedfavouriteRecords => {
            if (returnedfavouriteRecords != null && returnedfavouriteRecords.length > 0) {
                this.allFavoriteRecords = returnedfavouriteRecords;
                //Setting the already marked favorite records.
                this.allFavoriteRecords.forEach((favElement, favIndex) => {
                    this.relatedAccountRecords.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.relatedAccountRecords[index].isFavorite = true;
                            this.relatedAccountRecords[index].favoriteIcon = 'utility:check';
                            this.relatedAccountRecords[index].favId = favElement.Favorite_Id__c;
                            this.relatedAccountRecords[index].favIconColor = "selectedFavIcon";
                            this.relatedAccountRecords[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.relatedAccountRecords = [...this.relatedAccountRecords];
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

    disconnectedCallback() {
        unregisterAllListeners(this);
    }
}