import { LightningElement, api, wire ,track} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getRelatedAccountRecords from '@salesforce/apex/AccountsOfMetroAreaRelatedListController.getRelatedAccountRecords';
import getRelatedAccountCount from '@salesforce/apex/AccountsOfMetroAreaRelatedListController.getRelatedAccountCount';
import getAllRelatedAccountsRecords from '@salesforce/apex/AccountsOfMetroAreaRelatedListController.getAllRelatedAccountRecords';
import getMetroAreaName from '@salesforce/apex/AccountsOfMetroAreaRelatedListController.getMetroAreaName';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import {fireEvent,registerListener,unregisterAllListeners} from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE from '@salesforce/schema/Account.Type';
import AUM from '@salesforce/schema/Account.AUM__c';
import WEBSITE from '@salesforce/schema/Account.Website';
import BILLINGCITY from '@salesforce/schema/Account.BillingCity';
import DESCRIPTION from '@salesforce/schema/Account.Description';

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
    { label: 'Account Name', fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Type', fieldName: TYPE.fieldApiName, type: 'Picklist' },
    { label: 'AUM', fieldName: AUM.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Website', fieldName: WEBSITE.fieldApiName, type: "url"},
    { label: 'Billing City', fieldName: BILLINGCITY.fieldApiName, type: 'Address' },
    { label: 'Description', fieldName: DESCRIPTION.fieldApiName, type: 'Long Text Area' },
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];
const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];


export default class AccountsPanelMetroArea extends NavigationMixin(LightningElement) {
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    @track isLoading=false;
    @api isSalesforceInstance = false;
    accRecordId;
    columns = COLUMNS;
    tempAddAction=[];
    setSelectedRows = [];
    totalRelatedAccountsCount = 0;
    relatedAccountsRecords;
    newbuttonPressed = false;
    isCommunity = false;
    offset = 0;
    limit = 10;
    plusSign = '+';
    baseURL = '';
    recordToDel;
    collapsed = true;
    panelStyling;
    fromEditEvent = true;
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

    @api
    clearAll()
    {
        this.setSelectedRows = [];
    }

    chevronButtonClicked()
    {
        this.collapsed = !this.collapsed;
    } 

    removeFromFollowList(objPayLoad) {
        let favToBeRemovedId = objPayLoad;
        removeFromFavorites({
            favId: favToBeRemovedId
        }).then(() => {
                var tempList = [];
                this.relatedAccountsRecords.forEach((element, index) => {
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
                this.relatedAccountsRecords = [...tempList];
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

syncFollowRecord() {
    this.isLoading = true;
    getAllFavoriteRecords({}).then(returnedfavouriteRecords => {
        if (returnedfavouriteRecords != null && returnedfavouriteRecords.length > 0) {
            this.allFavoriteRecords = returnedfavouriteRecords;
            this.relatedAccountsRecords.forEach((element, index) => {
                this.relatedAccountsRecords[index].isFavorite = false;
                this.relatedAccountsRecords[index].favoriteIcon = 'utility:add';
                this.relatedAccountsRecords[index].favId = '';
                this.relatedAccountsRecords[index].favIconColor = "slds-icon-text-light addIconStyling";
                this.relatedAccountsRecords[index].iconStatus = 'Click To Follow';
            });
            //Setting the already marked favorite records.
            this.allFavoriteRecords.forEach((favElement, favIndex) => {
                this.relatedAccountsRecords.forEach((element, index) => {
                    if (element.Id == favElement.Target_Id__c) {
                        this.relatedAccountsRecords[index].isFavorite = true;
                        this.relatedAccountsRecords[index].favoriteIcon = 'utility:check';
                        this.relatedAccountsRecords[index].favId = favElement.Favorite_Id__c;
                        this.relatedAccountsRecords[index].favIconColor = "selectedFavIcon";
                        this.relatedAccountsRecords[index].iconStatus = 'Click To Unfollow';
                    }
                });
            });

            this.relatedAccountsRecords = [...this.relatedAccountsRecords];
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

    connectedCallback() {
        registerListener('updateAccountList',this.removeFromFollowList,this);
        registerListener('updateAllAccount',this.syncFollowRecord,this);
        Promise.all([
            loadStyle(this, followIconStyle)
        ]);
        this.isLoading = true;
        this.checkIsCommunityInstance(); 
        this.tempAddAction = COLUMNS;
        if(this.isCommunity)
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

        // Get related marketplace searches records
        getRelatedAccountRecords({
            recordId: this.recordId
        }) .then (relatedAccounts => {
            if (relatedAccounts) {  
                var tempAccountsList = [];  
                for (var i = 0; i < relatedAccounts.length; i++) {  
                    let tempRecord = Object.assign({}, relatedAccounts[i]); //cloning object  
                    if(this.isCommunity )
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
                this.relatedAccountsRecords = tempAccountsList;
                this.getAllFavoriteRecordsFromAPI()
                this.offset = tempAccountsList.length; 
                this.isLoading = false;
            }
        }) .catch(error => {
            this.isLoading=false;
        });

        //To get count of related records
        getRelatedAccountCount({
            recordId: this.recordId
        }) .then (searchesRecordCount => {
            if(searchesRecordCount) {
                this.totalRelatedAccountsCount = searchesRecordCount;

                //To set panel height based total number of records
                if(this.totalRelatedAccountsCount >= 10) {
                    this.panelStyling = 'height : 341px;';
                }
                else if(this.totalRelatedAccountsCount == 1)
                {
                    this.panelStyling = 'height : 64px;';
                }
                else if(this.totalRelatedAccountsCount == 2)
                {
                    this.panelStyling = 'height : 90px;';
                } 
                else if(this.totalRelatedAccountsCount == 3 )
                {
                    this.panelStyling = 'height : 115px;';
                }
                else if(this.totalRelatedAccountsCount == 4 )
                {
                    this.panelStyling = 'height : 142px;';
                }
                else if(this.totalRelatedAccountsCount == 5) {
                    this.panelStyling = 'height : 170px;';
                }
                else if(this.totalRelatedAccountsCount == 6) {
                    this.panelStyling = 'height : 196px;';
                }
                else if(this.totalRelatedAccountsCount == 7 )
                {
                    this.panelStyling = 'height : 225px;';
                }
                else if(this.totalRelatedAccountsCount == 8 )
                {
                    this.panelStyling = 'height : 250px;';
                }
                else if(this.totalRelatedAccountsCount == 9) {
                    this.panelStyling = 'height : 280px;';
                }
            }
        }) .catch(error => {});

        //To get base url of the instance
        getSFBaseUrl().then(baseURL => {
            if(baseURL) {
                this.baseURL = baseURL;
            }
        })
        .catch(error => {
            console.log("Error:" , error);
        });
    }

    loadMoreData(event) {
        if(this.totalRelatedAccountsCount > this.offset && this.newbuttonPressed == false) {
            //Display a spinner to signal that data is being loaded
            if(this.relatedAccountsRecords != null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            getAllRelatedAccountsRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset
            }) .then (relatedAccounts => {
                var tempAccountList = [];  
                for (var i = 0; i < relatedAccounts.length; i++) {  
                    let tempAccountRecord = Object.assign({}, relatedAccounts[i]); //cloning object 
                    if(this.isCommunity )
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
                    tempAccountList.push(tempAccountRecord);  
                }  
             
                if(this.relatedAccountsRecords)
                    this.relatedAccountsRecords =  this.relatedAccountsRecords.concat(tempAccountList);
                    this.getAllFavoriteRecordsFromAPI();
                if((this.offset+10) >= this.totalRelatedAccountsCount)
                {
                    this.offset = this.totalRelatedAccountsCount;
                    this.plusSign = '';
                } else {
                    this.offset = parseInt(this.offset ) + parseInt(this.limit);
                    this.plusSign = '+';
                }

                this.loadMoreStatus = '';
                if(this.tableElement){
                    this.tableElement.isLoading = false;
                }    
            }) .catch(error => {
                console.log("Error:" , error);
            });
        }
    }

    get recordAccountCountCondition() {
        if(this.totalRelatedAccountsCount == 10 )
        {
            return false;
        }

        if(this.totalRelatedAccountsCount > 10) {
            return true;
        } else {
            return false
        }
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
    /**
     * DSC-42
     * @param {*} event 
     */
    createNewRecord(event) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });
    
        onError(error => {
            console.error('Received error from server SF: ', error);
        });
        this.newbuttonPressed = true;
        let newAccountRecord = { 
            type: 'standard__objectPage', 
            attributes: { objectApiName: 'Account', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                useRecordTypeCheck:'yes',
                defaultFieldValues:"MetroArea__c="+this.recordId
            },
        };  
        this[NavigationMixin.Navigate](newAccountRecord);
        this.newbuttonPressed = true;
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
    }

    //Handler for search record selected
    accountRecordSelected(event) {
        const selectedRows = event.detail.selectedRows;
        // Display that fieldName of the selected rows
        var arrayToPassToParent = [];       
        for (let i = 0; i < selectedRows.length; i++) {
            arrayToPassToParent.push({recordId : selectedRows[i].Id, entity : 'Account'});
        }
        const selectedEvent = new CustomEvent("selectedallaccountsma", {
            detail : arrayToPassToParent    
        })
        this.dispatchEvent(selectedEvent);   
    }

    // To refresh table
    @api
    refreshTable(event)
    {
        if(!this.fromEditEvent)
        {
            var table = this.template.querySelector('lightning-datatable');
            if(table!=null)
                table.enableInfiniteLoading = true;
            this.fromEditEvent = false;
        }
        this.connectedCallback();
    }

    refreshData(){
        this.fromEditEvent = false;
        this.refreshTable();
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
        const accType = row.Type;
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
                        this.relatedAccountsRecords.forEach((element, index) => {
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
                        this.relatedAccountsRecords = [...tempList];
                        this.allFavoriteRecords.push(createdFavouriteRecord);
                        this.isLoading = false;

                        fireEvent(this.objPageReference,'updateFavList','');
                        if(accType) {
                            fireEvent(this.objPageReference,accType.replaceAll(/ /g,"_"),'');
                        }
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
                    this.relatedAccountsRecords.forEach((element, index) => {
                        let temObj = Object.assign({}, element);
                        if (element.Id == this.accRecordId) {
                            temObj.isFavorite = false;
                            temObj.favoriteIcon = 'utility:add';
                            temObj.favId = '';
                            temObj.favIconColor = "slds-icon-text-light addIconStyling";
                            temObj.iconStatus = 'Click To Follow';

                        }
                        tempList.push(temObj);
                    });
                    this.relatedAccountsRecords = [...tempList];
                    this.isLoading = false;

                //Remove the non-favourite record from the favorite list.
                for (let i = 0; i < this.allFavoriteRecords.length; i++) {
                    if (this.allFavoriteRecords[i].Target_Id__c == favToBeRemovedId) {
                        this.allFavoriteRecords.splice(i, 1);
                        break;
                    }
                }
                fireEvent(this.objPageReference,'updateFavList','');
                if(accType) {
                    fireEvent(this.objPageReference,accType.replaceAll(/ /g,"_"),'');
                }
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

    @wire(getMetroAreaName, {recordId:'$recordId'})
    loadMetroAreaName (metroAreaName) {
        if(metroAreaName.data) {
            this.recordName = metroAreaName.data;
        }
    }

    handleShowFullRelatedList() {
        var navigationURL = this.baseURL +'/lightning/cmp/c__AccountRelatedToMADataTableView?c__recordId='+this.recordId+'&c__recordName='+this.recordName+'&c__isCommunity='+ this.isCommunity;
        var url = '/view-relatedaccounts?recordId=' + this.recordId + '&recordName=' + this.recordName + '&isCommunity=' + this.isCommunity;

        if(this.isCommunity)
        {
            this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
        else
        {
            window.open(navigationURL,"_self");
        }
    }

    getAllFavoriteRecordsFromAPI() {
        getAllFavoriteRecords({}).then(returnedfavouriteRecords => {
            if (returnedfavouriteRecords != null && returnedfavouriteRecords.length > 0) {
                this.allFavoriteRecords = returnedfavouriteRecords;
                //Setting the already marked favorite records.
                this.allFavoriteRecords.forEach((favElement, favIndex) => {
                    this.relatedAccountsRecords.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.relatedAccountsRecords[index].isFavorite = true;
                            this.relatedAccountsRecords[index].favoriteIcon = 'utility:check';
                            this.relatedAccountsRecords[index].favId = favElement.Favorite_Id__c;
                            this.relatedAccountsRecords[index].favIconColor = "selectedFavIcon";
                            this.relatedAccountsRecords[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.relatedAccountsRecords = [...this.relatedAccountsRecords];
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