import { LightningElement, api,track, wire} from 'lwc';
import getAllRelatedAccounts from '@salesforce/apex/RelatedAccountsController.getAllRelatedAccounts';
import getAllRelatedSortedAccounts from '@salesforce/apex/RelatedAccountsController.getAllRelatedSortedAccounts';
import getSortedAccByNameOrPhone from '@salesforce/apex/RelatedAccountsController.getSortedAccByNameOrPhone';
import activeCommunities from '@salesforce/label/c.active_communities';
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';
import INVESTMENT_FOCUS_FIELD from '@salesforce/schema/Account.Investment_Focus_single__c';
import WEBSITE_FIELD from '@salesforce/schema/Account.Website';
import CITY_FIELD from '@salesforce/schema/Account.BillingCity';
import DESCRIPTION_FIELD from '@salesforce/schema/Account.Description';
import DRAFT_SALES_CYCLE_C_FIELD from '@salesforce/schema/Account.Draft_Sales_Cycle__c';
import getAccountTypeCount from '@salesforce/apex/RelatedAccountsController.getAccountTypeCount';
import getMetroAreaNameObj from '@salesforce/apex/RelatedAccountsController.getMetroAreaNameObj';
import getProfileName from '@salesforce/apex/RelatedAccountsMetaController.getProfileName';
import softwareSalesProfile from '@salesforce/label/c.Software_Sales_Profile';
import FORM_5500_FIELD from '@salesforce/schema/Account.Form_5500__c';

import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';

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

const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

 const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];

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
    { label: 'Account Name', fieldName: "recordLink", sortable: true, type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip: { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'currency', initialWidth: 150, typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Website', sortable: true, fieldName: WEBSITE_FIELD.fieldApiName, type: 'url' },
    { label: 'Billing City', sortable: true, fieldName: CITY_FIELD.fieldApiName, type: 'Text' },
    { label: 'Description',sortable: false, fieldName: DESCRIPTION_FIELD.fieldApiName, type: 'Long Text Area', initialWidth: 500 }
];

//DSC-817: Metro Area - DC Plan, DSC-845: CPP Columns same as DC Plan columns
const DC_PLAN_COLUMNS = [
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
    { label: 'Account Name', fieldName: "recordLink", sortable: true, type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip: { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}, initialWidth: 260},
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'currency', initialWidth: 150, typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Billing City', sortable: true, fieldName: CITY_FIELD.fieldApiName, type: 'Text' },
    { label: 'Contact Name', sortable: true, fieldName: 'ContactName', type: 'Text' },
    { label: 'Contact Phone', sortable: true, fieldName: 'ContactPhone', type: 'phone' },
    { label: 'Form 5500', sortable: true, fieldName: FORM_5500_FIELD.fieldApiName, type: 'url' },
];

const EVEREST_COLUMNS1 = [
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
    { label: 'Account Name', fieldName: "recordLink", sortable: true, type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip: { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'currency', initialWidth: 150, typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Website', sortable: true, fieldName: WEBSITE_FIELD.fieldApiName, type: 'url' },
    { label: 'Billing City', sortable: true, fieldName: CITY_FIELD.fieldApiName, type: 'Text' }
];

const EVEREST_COLUMNS = [
    { label: 'Account Name', fieldName: "recordLink", sortable: true, type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip: { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'currency', initialWidth: 150, typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Website', sortable: true, fieldName: WEBSITE_FIELD.fieldApiName, type: 'url' },
    { label: 'Billing City', sortable: true, fieldName: CITY_FIELD.fieldApiName, type: 'Text' }
];

const EVEREST_INTERNAL_COLUMNS = [
    { label: 'Account Name', fieldName: "recordLink", sortable: true, type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip: { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'currency', initialWidth: 150, typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Marketplace Sales Cycle',sortable: true, fieldName: DRAFT_SALES_CYCLE_C_FIELD.fieldApiName, type: 'Picklist', initialWidth: 150 },
    { label: 'Billing City', sortable: true, fieldName: CITY_FIELD.fieldApiName, type: 'Text' },
    { label: 'Description',sortable: false, fieldName: DESCRIPTION_FIELD.fieldApiName, type: 'Long Text Area', initialWidth: 500 }
];

const WIREHOUSEMORGANCOLUMNS = [
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
    { label: 'Account Name', fieldName: "recordLink", sortable: true, type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip: { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Parent Account', sortable: true,fieldName: "ParentAccountLink", type: 'url', typeAttributes: {label: { fieldName: 'ParentAccountName' },tooltip:  { fieldName: 'ParentAccountName' }, target: '_self' }},
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'currency', initialWidth: 150, typeAttributes: { minimumFractionDigits: '0' } },
    { label: 'Billing City', sortable: true, fieldName: CITY_FIELD.fieldApiName, type: 'Text' },
    { label: 'Description',sortable: false, fieldName: DESCRIPTION_FIELD.fieldApiName, type: 'Long Text Area', initialWidth: 500  }
];
export default class AccountRelatedDataTable extends NavigationMixin(LightningElement) {

    
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api accountType;
    @api accountTypeLabel;
    @api recordName;
    @api totalRecordCount;
    @api isCommunity;
    @api subAccountType;
    @track isLoading=false;
    allRelatedAccounts;
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = AUM_FIELD.fieldApiName;
    columns = COLUMNS; 
    offset = 0;
    limit = 50;
    recordLink;
    maNameLink;
    plusSign = null;
    isCommunityBoolean;
    tempAddAction=[];
    @api isSalesforceInstance = false;
    profileName = '';
    maxFollowCount = Allowed_Follow_Record_Count;
    @track allFavoriteRecords = [];
    toastmessage;
    title;
    alternativeText;
    iconName;
    toastMsgClasses;
    toastMsgIconClasses;
    accRecordId;
    @track showToast = false;

    @wire(CurrentPageReference) objPageReference;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunityBoolean;
    }

    refreshTable(event)
    {
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.sortedDirection = 'desc';
        this.sortedBy = AUM_FIELD.fieldApiName;
        this.allRelatedAccounts= null;
         var table = this.template.querySelector('lightning-datatable');
         if(table!=null)
            table.enableInfiniteLoading = true;
        return refreshApex(this.connectedCallback());
    }
    handleEvent = event => {
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        }); 
        this.allRelatedAccounts= null;
        if(this.isCommunity == 'false' || this.isCommunity == false)
        {
            this.isCommunityBoolean = false;   
        }
        else
        {
            this.isCommunityBoolean = true;   
        }
        if(this.accountTypeLabel=='Wirehouse Teams' || this.accountType=='Morgan Stanley Teams' || this.accountTypeLabel == 'Merrill Lynch Teams' || this.accountTypeLabel =='UBS Teams')
        {
            this.tempAddAction = null;
            this.tempAddAction = WIREHOUSEMORGANCOLUMNS;
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
        }
        else
        {
            this.tempAddAction = null;
            this.tempAddAction = COLUMNS;
            if(this.isCommunityBoolean)
            {
                if((this.communityName == 'marketplace2' || this.accountTypeLabel.startsWith('InvestmentFocus-')) && this.accountType != 'DC Plan' && this.accountType != 'Corporate Pension Plan' && this.accountType != 'Taft-Hartley Plan (ERISA)')
                {
                    this.tempAddAction = EVEREST_COLUMNS;
                    if(this.communityName != 'marketplace2') 
                    {
                        this.tempAddAction = EVEREST_COLUMNS1;
                    }
                    //DSC-817: Metro Area - DC Plan, DSC-845: CPP Columns same as DC Plan columns
                } else if (this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' || this.accountType == 'Taft-Hartley Plan (ERISA)') {
                    this.tempAddAction = DC_PLAN_COLUMNS;
                }
                
                this.tempAddAction=[...this.tempAddAction,{
                    type: 'action',
                    typeAttributes: { rowActions: noActions },
                }];
            }
            else
            {
                if(this.profileName != '' && this.profileName == softwareSalesProfile) {
                    this.tempAddAction = EVEREST_INTERNAL_COLUMNS;
                    this.tempAddAction = [...this.tempAddAction, {
                        type: 'action',
                        typeAttributes: {
                            rowActions: actions
                        },
                    }];
                }
                else {
                    if (this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' || this.accountType == 'Taft-Hartley Plan (ERISA)') {  //DSC-817: Metro Area - DC Plan, DSC-845: CPP Columns same as DC Plan columns
                        this.tempAddAction = DC_PLAN_COLUMNS;
                    }
                    this.tempAddAction = [...this.tempAddAction, {
                        type: 'action',
                        typeAttributes: {
                            rowActions: actions
                        },
                    }];
                }
            }
        }
        this.columns = this.tempAddAction;  
        this.setLinks();
	    getAccountTypeCount({
            recordId: this.recordId,
            accountType: this.accountType,
            subAccountType: this.subAccountType
        }) .then (recordCount => {
            if(recordCount) {
                this.totalRecordCount = recordCount;
            }
        })
        .then(result=>{
            this.allRelatedAccounts=null;
            if(this.offset<=50)
            {
                this.offset = 0;
                this.limit = 50;
            }
            else
            {
                this.offset = 0;
                this.limit = this.totalRecordCount;
            }

            getAllRelatedAccounts({
                recordId: this.recordId,
                accountType: this.accountType,
                recordLimit: this.limit,
                offset: this.offset
            }) .then (allRelatedAccounts => {
             
                if (allRelatedAccounts) {  
                    var tempAccList = [];  
                    for (var i = 0; i < allRelatedAccounts.length; i++) {  
                        let tempAccountRecord = Object.assign({}, allRelatedAccounts[i]); //cloning object
                        if(this.accountTypeLabel=='Wirehouse Teams' || this.accountTypeLabel=='Morgan Stanley Teams' || this.accountTypeLabel == 'Merrill Lynch Teams' || this.accountTypeLabel =='UBS Teams') 
                        {
                            if(this.isCommunityBoolean)
                            {
                                tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                                if( tempAccountRecord.Parent!=undefined)
                                    tempAccountRecord.ParentAccountLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.ParentId;
                            }
                            else
                            {
                                tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                                if( tempAccountRecord.Parent!=undefined)
                                    tempAccountRecord.ParentAccountLink = "/" + tempAccountRecord.ParentId;
                            }
                            if( tempAccountRecord.Parent!=undefined)
                                tempAccountRecord.ParentAccountName = tempAccountRecord.Parent.Name;
                            tempAccList.push(tempAccountRecord);  
                        } 
                        else
                        {
                            if(this.isCommunityBoolean)
                            {
                                tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                            }
                            else
                            {
                                tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                            }
                            if((this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' || this.accountType == 'Taft-Hartley Plan (ERISA)') && 
                            tempAccountRecord.Form_5500_Additional_Information__r != undefined) {
                                tempAccountRecord.ContactName = tempAccountRecord.Form_5500_Additional_Information__r[0]?.Plan_Administrator_Contact_Name__c;
                                tempAccountRecord.ContactPhone = tempAccountRecord.Form_5500_Additional_Information__r[0]?.Spons_DFE_Phone_Num__c;
                            }
                            tempAccList.push(tempAccountRecord);
                        }  
                    }  
                    this.allRelatedAccounts = tempAccList;
                    this.offset = this.allRelatedAccounts.length;
                    // For showing + sign with count
                    if((this.offset) >= this.totalRecordCount)
                    {
                        this.plusSign = '';
                    }
                    else
                    {
                        this.plusSign = '+';
                    }
                }
            }) .catch(error => {
                console.log("Error:" , error);
            });

        })
        .catch(error => {
            console.log("Error:" , error);
        });

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
                        this.allRelatedAccounts.forEach((element, index) => {
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
                        this.allRelatedAccounts = [...tempList];
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
                    this.allRelatedAccounts.forEach((element, index) => {
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
                    this.allRelatedAccounts = [...tempList];
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
                this.offset = 0;
                this.limit = 50;
                var table = this.template.querySelector('lightning-datatable');
                table.enableInfiniteLoading=true;
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
   
    removeFromFollowList(objPayLoad) {
        let favToBeRemovedId = objPayLoad;
        removeFromFavorites({
            favId: favToBeRemovedId
        }).then(() => {
                var tempList = [];
                this.allRelatedAccounts.forEach((element, index) => {
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
                this.allRelatedAccounts = [...tempList];
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
        registerListener('updateAccountList',this.removeFromFollowList,this);
        Promise.all([
            loadStyle(this, followIconStyle)
        ]);
        this.isLoading=true;
        if(this.isCommunity == 'false' || this.isCommunity == false)
        {
            this.isCommunityBoolean = false;   
        }
        else
        {
            this.isCommunityBoolean = true;   
        }
        this.checkIsCommunityInstance();  
        getProfileName().
            then(profileName => {
            if (profileName != null && profileName != undefined) {
                this.profileName = profileName;
            }
            if(this.accountTypeLabel=='Wirehouse Teams' || this.accountTypeLabel=='Morgan Stanley Teams' || this.accountTypeLabel == 'Merrill Lynch Teams' || this.accountTypeLabel =='UBS Teams')
            {
                this.tempAddAction = null;
                this.tempAddAction = WIREHOUSEMORGANCOLUMNS;
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
            }
            else
            {
                this.tempAddAction = null;
                this.tempAddAction = COLUMNS;
                if(this.isCommunityBoolean)
                {
                    if((this.communityName == 'marketplace2' || this.accountType.startsWith('InvestmentFocus-')) && this.accountType != 'RIA' && this.accountType != 'DC Plan' && this.accountType != 'Corporate Pension Plan' && this.accountType != 'Taft-Hartley Plan (ERISA)')
                    {
                        this.tempAddAction = EVEREST_COLUMNS;
                        if(this.communityName != 'marketplace2') 
                    {
                        this.tempAddAction = EVEREST_COLUMNS1;
                    }
                        //DSC-817: Metro Area - DC Plan, DSC-845: CPP Columns same as DC Plan columns
                    } else if (this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' || this.accountType == 'Taft-Hartley Plan (ERISA)') {
                        this.tempAddAction = DC_PLAN_COLUMNS;
                    }
                    this.tempAddAction=[...this.tempAddAction,{
                        type: 'action',
                        typeAttributes: { rowActions: noActions },
                    }];
                }
                else
                {
                    if(this.profileName != '' && this.profileName == softwareSalesProfile) {
                        this.tempAddAction = EVEREST_INTERNAL_COLUMNS;
                        this.tempAddAction = [...this.tempAddAction, {
                            type: 'action',
                            typeAttributes: {
                                rowActions: actions
                            },
                        }];
                    }
                    else {
                        if (this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' || this.accountType == 'Taft-Hartley Plan (ERISA)') {  //DSC-817: Metro Area - DC Plan, DSC-845: CPP Columns same as DC Plan columns
                            this.tempAddAction = DC_PLAN_COLUMNS;
                        }
                        this.tempAddAction = [...this.tempAddAction, {
                            type: 'action',
                            typeAttributes: {
                                rowActions: actions
                            },
                        }];
                    }
                }
            }  
            this.columns = this.tempAddAction;
            this.setLinks();
            // To get total count
            getAccountTypeCount({
                recordId: this.recordId,
                accountType: this.accountType,
                subAccountType: this.subAccountType
            }) .then (recordCount => {
                if(recordCount) {
                    
                    this.totalRecordCount = recordCount;
                }
            })
            .catch(error => {
                console.log("Error:" , error);
            });
            
            getMetroAreaNameObj({
                recordId : this.recordId
            }).then(returnedMetroArea =>{
                if(returnedMetroArea != null)
                {
                    this.recordName = returnedMetroArea.Name;
                }
            })
       
            getAllRelatedAccounts({
                recordId: this.recordId,
                accountType: this.accountType,
                recordLimit: this.limit,
                offset: this.offset,
                subAccountType: this.subAccountType
            }) .then (allRelatedAccounts => {
                if (allRelatedAccounts) {  
                    var tempAccList = []; 
                    
                    for (var i = 0; i < allRelatedAccounts.length; i++) {  
                        let tempAccountRecord = Object.assign({}, allRelatedAccounts[i]); //cloning object
                  
                        if(this.accountTypeLabel=='Wirehouse Teams' || this.accountTypeLabel=='Morgan Stanley Teams' || this.accountTypeLabel == 'Merrill Lynch Teams' || this.accountTypeLabel =='UBS Teams') 
                        {
          
                            if(this.isCommunityBoolean)
                            {
                                tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                                if( tempAccountRecord.Parent!=undefined)
                                    tempAccountRecord.ParentAccountLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.ParentId;
                            }
                            else
                            {
                                tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                                if( tempAccountRecord.Parent!=undefined)
                                    tempAccountRecord.ParentAccountLink = "/" + tempAccountRecord.ParentId;
                            }
                            if( tempAccountRecord.Parent!=undefined)
                                tempAccountRecord.ParentAccountName = tempAccountRecord.Parent.Name;

                                tempAccountRecord.favoriteIcon = 'utility:add';
                                tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                                tempAccountRecord.iconStatus = 'Click To Follow';
                            tempAccList.push(tempAccountRecord);  
                        } 
                        else
                        {
                            if(this.isCommunityBoolean)
                            {
                                tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                            }
                            else
                            {
                                tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                            }
                            if((this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' || this.accountType == 'Taft-Hartley Plan (ERISA)') && 
                            tempAccountRecord.Form_5500_Additional_Information__r != undefined) {
                                tempAccountRecord.ContactName = tempAccountRecord.Form_5500_Additional_Information__r[0]?.Plan_Administrator_Contact_Name__c;
                                tempAccountRecord.ContactPhone = tempAccountRecord.Form_5500_Additional_Information__r[0]?.Spons_DFE_Phone_Num__c;
                            }

                            tempAccountRecord.favoriteIcon = 'utility:add';
                            tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                            tempAccountRecord.iconStatus = 'Click To Follow';
                            tempAccList.push(tempAccountRecord);
                        }  
                    }  
                    this.allRelatedAccounts = tempAccList;
                    this.getAllFavoriteRecordsFromAPI();
                    this.offset = this.allRelatedAccounts.length;
                    if((this.offset) >= this.totalRecordCount)
                    {
                        this.plusSign = '';
                    }
                    else
                    {
                        this.plusSign = '+';
                    }
                    this.isLoading=false;
                    this.infiniteLoading = false;
                }
            }) .catch(error => {
                this.infiniteLoading = false;
                this.isLoading=false;
                console.log("Error:" , error);
            });
        })
        .catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });
    }
   
    onHandleSort(event) {
        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;

        if (sortedBy == 'ParentAccountLink') {
            this.sortedBy = 'Parent.Name';
        } else if (sortedBy == 'recordLink') {
            this.sortedBy = 'Name';
        } else {
            this.sortedBy = sortedBy;
        }
        this.sortedDirection = sortDirection;

        if(sortedBy=='ContactName' || sortedBy=='ContactPhone')
        {
            getSortedAccByNameOrPhone({
                recordId: this.recordId,
                accountType: this.accountType,
                recordLimit: this.offset,
                offset: 0,
                sortBy: this.sortedBy,
                sortOrder : this.sortedDirection,
                subAccountType: this.subAccountType
            }) .then (allRelatedAccounts => {
                if (allRelatedAccounts) {  
                    var tempAccList = [];  
                    for (var i = 0; i < allRelatedAccounts.length; i++) {  
                        let tempAccountRecord = Object.assign({}, allRelatedAccounts[i]); //cloning object  
                        if(this.isCommunityBoolean)
                            {
                                tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                            }
                            else
                            {
                                tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                            }
                            if(tempAccountRecord.contactName) {
                                tempAccountRecord.ContactName = tempAccountRecord.contactName;
                            }
                            if(tempAccountRecord.contactPhone)
                            {
                                tempAccountRecord.ContactPhone = tempAccountRecord.contactPhone;
                            }
                            if(tempAccountRecord.AUM)
                            {
                                tempAccountRecord.AUM__c = tempAccountRecord.AUM;
                            }
                            if(tempAccountRecord.BillingCity)
                            {
                                tempAccountRecord.BillingCity = tempAccountRecord.BillingCity;
                            }
                            if(tempAccountRecord.Form5500)
                            {
                                tempAccountRecord.Form_5500_PDF__c = tempAccountRecord.Form5500;
                            }
                            tempAccountRecord.favoriteIcon = 'utility:add';
                                tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                                tempAccountRecord.iconStatus = 'Click To Follow';
                            tempAccList.push(tempAccountRecord);
                    }  
                    this.getAllFavoriteRecordsFromAPI();
                    this.allRelatedAccounts = tempAccList;
                }
            }) .catch(error => {
                console.log("Error:" , error);
            });
        }
        else
        {
            getAllRelatedSortedAccounts({
                recordId: this.recordId,
                accountType: this.accountType,
                recordLimit: this.offset,
                offset: 0,
                sortBy: this.sortedBy,
                sortOrder : this.sortedDirection,
                subAccountType: this.subAccountType
            }) .then (allRelatedAccounts => {
                if (allRelatedAccounts) {  
                    var tempAccList = [];  
                    for (var i = 0; i < allRelatedAccounts.length; i++) {  
                        let tempAccountRecord = Object.assign({}, allRelatedAccounts[i]); //cloning object  
                        if(this.accountTypeLabel=='Wirehouse Teams' || this.accountTypeLabel=='Morgan Stanley Teams' || this.accountTypeLabel == 'Merrill Lynch Teams' || this.accountTypeLabel =='UBS Teams') 
                        {
                            if(this.isCommunityBoolean)
                            {
                                tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                                if( tempAccountRecord.Parent!=undefined)
                                    tempAccountRecord.ParentAccountLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.ParentId;
                            }
                            else
                            {
                                tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                                if( tempAccountRecord.Parent!=undefined)
                                    tempAccountRecord.ParentAccountLink = "/" + tempAccountRecord.ParentId;
                            }
                            if( tempAccountRecord.Parent!=undefined)
                                tempAccountRecord.ParentAccountName = tempAccountRecord.Parent.Name;


                                tempAccountRecord.favoriteIcon = 'utility:add';
                                tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                                tempAccountRecord.iconStatus = 'Click To Follow';
                            tempAccList.push(tempAccountRecord);  
                        } 
                        else
                        {
                            if(this.isCommunityBoolean)
                            {
                                tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                            }
                            else
                            {
                                tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                            }
                            if((this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' || this.accountType == 'Taft-Hartley Plan (ERISA)') && 
                            tempAccountRecord.Form_5500_Additional_Information__r != undefined) {
                                tempAccountRecord.ContactName = tempAccountRecord.Form_5500_Additional_Information__r[0]?.Plan_Administrator_Contact_Name__c;
                                tempAccountRecord.ContactPhone = tempAccountRecord.Form_5500_Additional_Information__r[0]?.Spons_DFE_Phone_Num__c;
                            }

                            tempAccountRecord.favoriteIcon = 'utility:add';
                                tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                                tempAccountRecord.iconStatus = 'Click To Follow';
                            tempAccList.push(tempAccountRecord);
                        }
                    }  
                    this.getAllFavoriteRecordsFromAPI();
                    this.allRelatedAccounts = tempAccList;
                }
            }) .catch(error => {
                console.log("Error:" , error);
            });
        }

        if (this.sortedBy == 'Parent.Name') {
            this.sortedBy = 'ParentAccountLink';
        } else if(this.sortedBy == 'Name') {
            this.sortedBy = 'recordLink';
        }
    }

    loadMoreData(event) {
        if(this.totalRecordCount > this.offset) {
            if (this.infiniteLoading) 
                return;
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if(this.allRelatedAccounts!=null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';

            if (this.sortedBy == 'ParentAccountLink') {
                this.sortedBy = 'Parent.Name';
            } else if (this.sortedBy == 'recordLink') {
                this.sortedBy = 'Name';
            }

            if(this.sortedBy=='ContactName' || this.sortedBy=='ContactPhone')
            {
                var limit2=this.allRelatedAccounts.length+50;
                getSortedAccByNameOrPhone({
                    recordId: this.recordId,
                    accountType: this.accountType,
                    recordLimit: limit2,
                    offset: this.offset,
                    sortBy: this.sortedBy,
                    sortOrder : this.sortedDirection
                }) .then (allRelatedAccounts => {
                    if (allRelatedAccounts) {  
                        var tempAccList = [];  
                        for (var i = 0; i < allRelatedAccounts.length; i++) {  
                            let tempAccountRecord = Object.assign({}, allRelatedAccounts[i]); //cloning object  
                            if(this.isCommunityBoolean)
                                {
                                    tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                                }
                                else
                                {
                                    tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                                }
                                if(tempAccountRecord.contactName) {
                                    tempAccountRecord.ContactName = tempAccountRecord.contactName;
                                }
                                if(tempAccountRecord.contactPhone)
                                {
                                    tempAccountRecord.ContactPhone = tempAccountRecord.contactPhone;
                                }
                                if(tempAccountRecord.AUM)
                                {
                                    tempAccountRecord.AUM__c = tempAccountRecord.AUM;
                                }
                                if(tempAccountRecord.BillingCity)
                                {
                                    tempAccountRecord.BillingCity = tempAccountRecord.BillingCity;
                                }
                                if(tempAccountRecord.Form5500)
                                {
                                    tempAccountRecord.Form_5500_PDF__c = tempAccountRecord.Form5500;
                                }
                                tempAccountRecord.favoriteIcon = 'utility:add';
                                tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                                tempAccountRecord.iconStatus = 'Click To Follow';
                                tempAccList.push(tempAccountRecord);
                        }  
                        if(this.allRelatedAccounts)
                        {
                            this.allRelatedAccounts=[];
                            this.allRelatedAccounts=tempAccList;
                        }
                        if((this.offset + this.limit)>=this.totalRecordCount)
                        {
                            this.offset = this.totalRecordCount;
                            this.plusSign = '';
                        }
                        else
                        {
                            this.offset = parseInt(this.offset ) + parseInt(this.limit);
                            this.plusSign = '+';
                        }
                        this.loadMoreStatus = '';
                        if (this.allRelatedAccounts!=null && this.allRelatedAccounts.length  >= this.totalRecordCount) {
                            this.tableElement.enableInfiniteLoading = false;
                            this.loadMoreStatus = 'No more data to load';
                        }
                        else if(this.allRelatedAccounts==null)
                        {
                            this.tableElement.enableInfiniteLoading = false;
                            this.loadMoreStatus = 'No more data to load';
    
                        }
    
                        if(this.tableElement){
                            this.tableElement.isLoading = false;
                        }    
                        this.getAllFavoriteRecordsFromAPI();
                        this.infiniteLoading = false;
                    }
                }) .catch(error => {
                    console.log("Error:" , error);
                });            
            }
            else
            {
                getAllRelatedSortedAccounts({
                    recordId: this.recordId,
                    accountType: this.accountType,
                    recordLimit: this.limit,
                    offset: this.offset,
                    sortBy: this.sortedBy,
                    sortOrder : this.sortedDirection,
                    subAccountType: this.subAccountType
                }) .then (nextChunkOfAccounts => {
                    if (nextChunkOfAccounts) {  
                        var tempAccList = [];  
                        for (var i = 0; i < nextChunkOfAccounts.length; i++) {  
                            let tempAccountRecord = Object.assign({}, nextChunkOfAccounts[i]); //cloning object  
                            if(this.accountTypeLabel=='Wirehouse Teams' || this.accountTypeLabel=='Morgan Stanley Teams' || this.accountTypeLabel == 'Merrill Lynch Teams' || this.accountTypeLabel =='UBS Teams') 
                            {
                                if(this.isCommunityBoolean)
                                {
                                    tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                                    if( tempAccountRecord.Parent!=undefined)
                                        tempAccountRecord.ParentAccountLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.ParentId;
                                }
                                else
                                {
                                    tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                                    if( tempAccountRecord.Parent!=undefined)
                                        tempAccountRecord.ParentAccountLink = "/" + tempAccountRecord.ParentId;
                                }
                                if( tempAccountRecord.Parent!=undefined)
                                    tempAccountRecord.ParentAccountName = tempAccountRecord.Parent.Name;


                                    tempAccountRecord.favoriteIcon = 'utility:add';
                                    tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                                    tempAccountRecord.iconStatus = 'Click To Follow';
                                tempAccList.push(tempAccountRecord);  
                            } 
                            else
                            {
                                if(this.isCommunityBoolean)
                                {
                                    tempAccountRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempAccountRecord.Id;
                                }
                                else
                                {
                                    tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                                }
                                if((this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' || this.accountType == 'Taft-Hartley Plan (ERISA)') && 
                                tempAccountRecord.Form_5500_Additional_Information__r != undefined) {
                                    tempAccountRecord.ContactName = tempAccountRecord.Form_5500_Additional_Information__r[0]?.Plan_Administrator_Contact_Name__c;
                                    tempAccountRecord.ContactPhone = tempAccountRecord.Form_5500_Additional_Information__r[0]?.Spons_DFE_Phone_Num__c;
                                }
                                tempAccountRecord.favoriteIcon = 'utility:add';
                                tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                                tempAccountRecord.iconStatus = 'Click To Follow';
                                tempAccList.push(tempAccountRecord);
                            }
                        }  
                        if(this.allRelatedAccounts)
                            this.allRelatedAccounts =  this.allRelatedAccounts.concat(tempAccList);
                        this.getAllFavoriteRecordsFromAPI();
                        if((this.offset + this.limit)>=this.totalRecordCount)
                        {
                            this.offset = this.totalRecordCount;
                            this.plusSign = '';
                        }
                        else
                        {
                            this.offset = parseInt(this.offset ) + parseInt(this.limit);
                            this.plusSign = '+';
                        }
                        this.loadMoreStatus = '';
                        if (this.allRelatedAccounts!=null && this.allRelatedAccounts.length  >= this.totalRecordCount) {
                            this.tableElement.enableInfiniteLoading = false;
                            this.loadMoreStatus = 'No more data to load';
                        }
                        else if(this.allRelatedAccounts==null)
                        {
                            this.tableElement.enableInfiniteLoading = false;
                            this.loadMoreStatus = 'No more data to load';
    
                        }
    
                        if(this.tableElement){
                            this.tableElement.isLoading = false;
                        }    
                        this.infiniteLoading = false;
                    }
                }) .catch(error => {
                    this.infiniteLoading = false;
                    console.log("Error:" , error);
                });
            }

            

            if (this.sortedBy == 'Parent.Name') {
                this.sortedBy = 'ParentAccountLink';
            } else if(this.sortedBy == 'Name') {
                this.sortedBy = 'recordLink';
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
        var splitedAccountTypeValues= this.accountType.split(',');
     
        if(splitedAccountTypeValues.length==1)
        {
            let newAccountRecord = { 
                type: 'standard__objectPage', 
                attributes: { objectApiName: 'Account', actionName: 'new' },
                state: {
                    navigationLocation: "RELATED_LIST",
                    useRecordTypeCheck: '2',
                    defaultFieldValues:"MetroArea__c="+this.recordId+",Type="+this.accountType
                }
            };
            this[NavigationMixin.Navigate](newAccountRecord);
        }
        else
        {
            let newAccountRecord = { 
                type: 'standard__objectPage', 
                attributes: { objectApiName: 'Account', actionName: 'new' },
                state: {
                    navigationLocation: "RELATED_LIST",
                    useRecordTypeCheck: '2',
                    defaultFieldValues:"MetroArea__c="+this.recordId
                }
            };
            this[NavigationMixin.Navigate](newAccountRecord);
        }
    }
    
    getAllFavoriteRecordsFromAPI() {
        getAllFavoriteRecords({}).then(returnedfavouriteRecords => {
            if (returnedfavouriteRecords != null && returnedfavouriteRecords.length > 0) {
                this.allFavoriteRecords = returnedfavouriteRecords;
                //Setting the already marked favorite records.
                this.allFavoriteRecords.forEach((favElement, favIndex) => {
                    this.allRelatedAccounts.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.allRelatedAccounts[index].isFavorite = true;
                            this.allRelatedAccounts[index].favoriteIcon = 'utility:check';
                            this.allRelatedAccounts[index].favId = favElement.Favorite_Id__c;
                            this.allRelatedAccounts[index].favIconColor = "selectedFavIcon";
                            this.allRelatedAccounts[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.allRelatedAccounts = [...this.allRelatedAccounts];
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

    setLinks() {
        if(this.isCommunityBoolean) {  
            this.recordLink = "/"+this.communityName+"/s/metro-area/" + this.recordId;
            this.maNameLink = "/"+this.communityName + '/s/metro-area/Metro_Area__c/Default';
        } else {
            this.recordLink = '/'+this.recordId;
            this.maNameLink = '/one/one.app#/sObject/Metro_Area__c/list?filterName=Recent';
        }  
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }
}