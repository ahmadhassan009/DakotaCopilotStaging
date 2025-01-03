import {
    LightningElement,
    api,
    track,
    wire
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getRelatedAccounts from '@salesforce/apex/RelatedAccountsController.getRelatedAccounts';
import getAllRelatedAccounts from '@salesforce/apex/RelatedAccountsController.getAllRelatedAccounts';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getAccountTypeCount from '@salesforce/apex/RelatedAccountsController.getAccountTypeCount';
import getProfileName from '@salesforce/apex/RelatedAccountsMetaController.getProfileName';
import softwareSalesProfile from '@salesforce/label/c.Software_Sales_Profile';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INVESTMENT_FOCUS_FIELD from '@salesforce/schema/Account.Investment_Focus_single__c';
import {
    refreshApex
} from '@salesforce/apex';
import {
    ShowToastEvent
} from 'lightning/platformShowToastEvent';
import {
    deleteRecord
} from 'lightning/uiRecordApi';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';
import WEBSITE_FIELD from '@salesforce/schema/Account.Website';
import DAKOTA_CITY_FIELD from '@salesforce/schema/Account.BillingCity';
import DESCRIPTION_FIELD from '@salesforce/schema/Account.Description';
import DRAFT_SALES_CYCLE__C_FIELD from '@salesforce/schema/Account.Draft_Sales_Cycle__c';
import FORM_5500_FIELD from '@salesforce/schema/Account.Form_5500_PDF__c';
import {
    subscribe,
    unsubscribe,
    onError
} from 'lightning/empApi';
import {
    fireEvent,registerListener,unregisterAllListeners
} from 'c/pubsub';
import {
    CurrentPageReference
} from 'lightning/navigation';

import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';
import {
    loadStyle,
} from 'lightning/platformResourceLoader';
import followIconStyle from '@salesforce/resourceUrl/followIconStyle';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';

const actions = [{
        label: 'Edit',
        name: 'edit'
    },
    {
        label: 'Delete',
        name: 'delete'
    },
];
const noActions = [{
    label: 'No actions availble',
    name: 'No actions availble',
    disabled: true
}];

const COLUMNS = [{
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
    {
        label: 'Account Name',
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: NAME_FIELD.fieldApiName
            },
            tooltip: {
                fieldName: NAME_FIELD.fieldApiName
            },
            target: '_self'
        }
    },
    {
        label: 'AUM',
        fieldName: AUM_FIELD.fieldApiName,
        type: 'currency',
        initialWidth: 150,
        typeAttributes: {
            minimumFractionDigits: '0'
        }
    },
    {
        label: 'Website',
        fieldName: WEBSITE_FIELD.fieldApiName,
        type: 'url'
    },
    {
        label: 'Billing City',
        fieldName: DAKOTA_CITY_FIELD.fieldApiName,
        type: 'Text'
    },
    {
        label: 'Description',
        fieldName: DESCRIPTION_FIELD.fieldApiName,
        type: 'Long Text Area',
        initialWidth: 500
    },
]

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
    {
    label: 'Account Name',
    fieldName: "recordLink",
    type: "url",
    typeAttributes: {
        label: {
            fieldName: NAME_FIELD.fieldApiName
        },
        tooltip: {
            fieldName: NAME_FIELD.fieldApiName
        },
        target: '_self'
    },
    initialWidth: 260
    },
    {
        label: 'AUM',
        fieldName: AUM_FIELD.fieldApiName,
        type: 'currency',
        initialWidth: 150,
        typeAttributes: {
            minimumFractionDigits: '0'
        },
    },
    {
        label: 'Billing City',
        fieldName: DAKOTA_CITY_FIELD.fieldApiName,
        type: 'Text'
    },
    {
        label: 'Contact Name',
        fieldName: 'ContactName',
        type: 'Text'
    },
    {
        label: 'Contact Phone',
        fieldName: 'ContactPhone',
        type: 'phone'
    },
    {
        label: 'Form 5500 PDF',
        fieldName: FORM_5500_FIELD.fieldApiName,
        type: 'richText'
    }
]

const EVEREST_COLUMNS = [{
        label: 'Account Name',
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: NAME_FIELD.fieldApiName
            },
            tooltip: {
                fieldName: NAME_FIELD.fieldApiName
            },
            target: '_self'
        }
    },
    {
        label: 'AUM',
        fieldName: AUM_FIELD.fieldApiName,
        type: 'currency',
        initialWidth: 150,
        typeAttributes: {
            minimumFractionDigits: '0'
        }
    },
    {
        label: 'Website',
        fieldName: WEBSITE_FIELD.fieldApiName,
        type: 'url'
    },
    {
        label: 'Billing City',
        fieldName: DAKOTA_CITY_FIELD.fieldApiName,
        type: 'Text'
    }
];
const EVEREST_COLUMNS_INTERNAL = [{
    label: 'Account Name',
    fieldName: "recordLink",
    type: "url",
    typeAttributes: {
        label: {
            fieldName: NAME_FIELD.fieldApiName
        },
        tooltip: {
            fieldName: NAME_FIELD.fieldApiName
        },
        target: '_self'
    }
},
{
    label: 'AUM',
    fieldName: AUM_FIELD.fieldApiName,
    type: 'currency',
    initialWidth: 150,
    typeAttributes: {
        minimumFractionDigits: '0'
    }
},
{
    label: 'Marketplace Sales Cycle',
    fieldName: DRAFT_SALES_CYCLE__C_FIELD.fieldApiName,
    type: 'Picklist',
    initialWidth: 200
},
{
    label: 'Billing City',
    fieldName: DAKOTA_CITY_FIELD.fieldApiName,
    type: 'Text'
},
{
    label: 'Description',
    fieldName: DESCRIPTION_FIELD.fieldApiName,
    type: 'Long Text Area',
    initialWidth: 500
},
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
    {
    label: 'Account Name',
    fieldName: "recordLink",
    type: "url",
    typeAttributes: {
        label: {
            fieldName: NAME_FIELD.fieldApiName
        },
        tooltip: {
            fieldName: NAME_FIELD.fieldApiName
        },
        target: '_self'
    }
},
{
    label: 'AUM',
    fieldName: AUM_FIELD.fieldApiName,
    type: 'currency',
    initialWidth: 150,
    typeAttributes: {
        minimumFractionDigits: '0'
    }
},
{
    label: 'Website',
    fieldName: WEBSITE_FIELD.fieldApiName,
    type: 'url'
},
{
    label: 'Billing City',
    fieldName: DAKOTA_CITY_FIELD.fieldApiName,
    type: 'Text'
}
];

const WIREHOUSE_MORGAN_COLUMNS = [
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
    {
        label: 'Account Name',
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: NAME_FIELD.fieldApiName
            },
            tooltip: {
                fieldName: NAME_FIELD.fieldApiName
            },
            target: '_self'
        }
    },
    {
        label: 'Parent Account',
        fieldName: "ParentAccountLink",
        type: 'url',
        typeAttributes: {
            label: {
                fieldName: 'ParentAccountName'
            },
            tooltip: {
                fieldName: 'ParentAccountName'
            },
            target: '_self'
        }
    },
    {
        label: 'AUM',
        fieldName: AUM_FIELD.fieldApiName,
        type: 'currency',
        initialWidth: 150,
        typeAttributes: {
            minimumFractionDigits: '0'
        }
    },
    {
        label: 'Billing City',
        fieldName: DAKOTA_CITY_FIELD.fieldApiName,
        type: 'Text'
    },
    {
        label: 'Description',
        fieldName: DESCRIPTION_FIELD.fieldApiName,
        type: 'Long Text Area',
        initialWidth: 500
    },
];
export default class SpecificAccountTypeList extends NavigationMixin(LightningElement) {

    @wire(CurrentPageReference) pageRef;

    refreshQuickLinksPanel() {
        fireEvent(this.pageRef, 'pageRefreshed', 'event');
    }

    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    maxFollowCount = Allowed_Follow_Record_Count;
    @api accountMeta;
    @api recordId;
    @api recordName;
    @api paddingLeft;
    @track isLoading = false;
    @api isSalesforceInstance = false;
    setSelectedRows = [];
    relatedAccounts;
    columns = COLUMNS;
    newbuttonPressed = false;
    totalRecordCount = 0;
    iconColor;
    isCommunity = false;
    plusSign = '+';
    offset = 0;
    limit = 10;
    baseURL = '';
    tempAddAction = [];
    recordToDel;
    collapsed = true;
    panelStyling;
    fromEditEvent = false;
    profileName = '';

    @track allFavoriteRecords = [];
    toastmessage;
    title;
    alternativeText;
    iconName;
    toastMsgClasses;
    toastMsgIconClasses;
    accRecordId;
    @track showToast = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        subscribe('/event/refreshComponents__e', -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });

        Promise.all([
            loadStyle(this, followIconStyle)
        ]);
        registerListener('updateAccountList',this.removeFromFollowList,this);
        if(this.accountMeta?.AccountTypeValues) {
            if(this.accountMeta?.AccountTypeValues.includes(",")) {
                const myArray = this.accountMeta?.AccountTypeValues.split(",");
                for (let i = 0; i < myArray.length; i++) {
                    let text = myArray[i].replaceAll(/ /g,"_");
                    registerListener(text,this.syncFollowRecord,this);
                  }
                
            }
            else {
            const text = this.accountMeta?.AccountTypeValues.replaceAll(/ /g,"_");
            registerListener(text,this.syncFollowRecord,this);
            }
        }

        this.isLoading = true;
        this.checkIsCommunityInstance();
        this.checkInstance();

        if(this.isCommunity == true) {
            this.setColumns();
            this.getSalesforceBaseURL();
            this.getCountOfAccounts();
            this.getRelatedAccountRecords();
        }
        else {
            getProfileName().
                then(profileName => {
                if (profileName != null && profileName != undefined) {
                    this.profileName = profileName;
                    this.setColumns();
                    this.getSalesforceBaseURL();
                    this.getCountOfAccounts();
                    this.getRelatedAccountRecords();
                }
            })
            .catch(error => {
                this.isLoading = false;
                console.log("Error:", error);
            });
        }
    }

    removeFromFollowList(objPayLoad) {
        let favToBeRemovedId = objPayLoad;
        removeFromFavorites({
            favId: favToBeRemovedId
        }).then(() => {
                var tempList = [];
                this.relatedAccounts.forEach((element, index) => {
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
                this.relatedAccounts = [...tempList];
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
                this.relatedAccounts.forEach((element, index) => {
                    this.relatedAccounts[index].isFavorite = false;
                    this.relatedAccounts[index].favoriteIcon = 'utility:add';
                    this.relatedAccounts[index].favId = '';
                    this.relatedAccounts[index].favIconColor = "slds-icon-text-light addIconStyling";
                    this.relatedAccounts[index].iconStatus = 'Click To Follow';
                });
                //Setting the already marked favorite records.
                this.allFavoriteRecords.forEach((favElement, favIndex) => {
                    this.relatedAccounts.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.relatedAccounts[index].isFavorite = true;
                            this.relatedAccounts[index].favoriteIcon = 'utility:check';
                            this.relatedAccounts[index].favId = favElement.Favorite_Id__c;
                            this.relatedAccounts[index].favIconColor = "selectedFavIcon";
                            this.relatedAccounts[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.relatedAccounts = [...this.relatedAccounts];
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
    setColumns() {
        if (this.accountMeta.SubPanelColumns.includes('ParentId')) {

            this.tempAddAction = null;
            this.tempAddAction = WIREHOUSE_MORGAN_COLUMNS;
            if (this.isCommunity) {
                this.tempAddAction = [...this.tempAddAction, {
                    type: 'action',
                    typeAttributes: {
                        rowActions: noActions
                    },
                }];
            } else {
                this.tempAddAction = [...this.tempAddAction, {
                    type: 'action',
                    typeAttributes: {
                        rowActions: actions
                    },
                }];
            }
        } else {
            this.tempAddAction = null;
            this.tempAddAction = COLUMNS;
            if (this.isCommunity) {
                if ((this.communityName == 'marketplace2' || this.accountMeta.AccountTypeValues.startsWith('InvestmentFocus-')) && this.accountMeta.AccountTypeValues != 'DC Plan' && this.accountMeta.AccountTypeValues != 'Corporate Pension Plan' && this.accountMeta.AccountTypeValues != 'Taft-Hartley Plan (ERISA)' ) {

                    this.tempAddAction = EVEREST_COLUMNS;
                    if(this.communityName != 'marketplace2') 
                    {
                        this.tempAddAction = EVEREST_COLUMNS1;
                    }

                    //DSC-817: Metro Area - DC Plan, DSC-845: CPP Columns same as DC Plan columns
                }  else if (this.accountMeta.AccountTypeValues == 'DC Plan' || this.accountMeta.AccountTypeValues == 'Corporate Pension Plan' || this.accountMeta.AccountTypeValues == 'Taft-Hartley Plan (ERISA)') {
                    this.tempAddAction = DC_PLAN_COLUMNS;
                }
                this.tempAddAction = [...this.tempAddAction, {
                    type: 'action',
                    typeAttributes: {
                        rowActions: noActions
                    },
                }];
            }
            else {
                if(this.profileName != '' && this.profileName == softwareSalesProfile) {
                    this.tempAddAction = EVEREST_COLUMNS_INTERNAL;
                    this.tempAddAction = [...this.tempAddAction, {
                        type: 'action',
                        typeAttributes: {
                            rowActions: actions
                        },
                    }];
                }
                else {
                    if (this.accountMeta.AccountTypeValues == 'DC Plan' || this.accountMeta.AccountTypeValues == 'Corporate Pension Plan' || this.accountMeta.AccountTypeValues == 'Taft-Hartley Plan (ERISA)') {//DSC-817: Metro Area - DC Plan, DSC-845: CPP Columns same as DC Plan columns
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

        this.iconColor = this.accountMeta.PanelIconColor !== '' && this.accountMeta.PanelIconColor !== null && typeof this.accountMeta.PanelIconColor != 'undefined' ? 'background-color: ' + this.accountMeta.PanelIconColor : 'background-color: #555;';
    }

    renderedCallback() {
        this.dispatchEvent(
            new CustomEvent('itemregister', {
                bubbles: true,
                composed: true,
                detail: {
                    callbacks: {
                        clearAll: this.clearAll
                    },
                    template: this.template,
                    type: this.accountMeta.AccountTypeValues,
                    name: 'c-specific-account-type-list'
                }
            })
        );
    }

    getCountOfAccounts() {
        getAccountTypeCount({
            recordId: this.recordId,
            accountType: this.accountMeta.AccountTypeValues,
            subAccountType: this.accountMeta.SubAccountTypeValues
        }).then(recordCount => {
            if (recordCount) {
                this.totalRecordCount = recordCount;
                if ((this.offset) >= this.totalRecordCount) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }

                //To set panel height based total number of records
                if (this.totalRecordCount >= 10) {
                    this.panelStyling = 'height : 343px;';
                } else if (this.totalRecordCount == 1) {
                    this.panelStyling = 'height : 64px;';
                } else if (this.totalRecordCount == 2) {
                    this.panelStyling = 'height : 95px;';
                } else if (this.totalRecordCount == 3) {
                    this.panelStyling = 'height : 126px;';
                } else if (this.totalRecordCount == 4) {
                    this.panelStyling = 'height : 157px;';
                } else if (this.totalRecordCount == 5) {
                    this.panelStyling = 'height : 188px;';
                } else if (this.totalRecordCount == 6) {
                    this.panelStyling = 'height : 219px;';
                } else if (this.totalRecordCount == 7) {
                    this.panelStyling = 'height : 250px;';
                } else if (this.totalRecordCount == 8) {
                    this.panelStyling = 'height : 281px;';
                } else if (this.totalRecordCount == 9) {
                    this.panelStyling = 'height : 312px;';
                }
            }

        }).catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });
    }

    getRelatedAccountRecords() {
        getRelatedAccounts({
            recordId: this.recordId,
            accountType: this.accountMeta.AccountTypeValues,
            subAccountType: this.accountMeta.SubAccountTypeValues
        }).then(relatedAccountsTypes => {
            if (relatedAccountsTypes) {
                var tempAccountList = [];
                for (var i = 0; i < relatedAccountsTypes.length; i++) {
                    let tempRecord = Object.assign({}, relatedAccountsTypes[i]); //cloning object  
                    if (this.accountMeta.SubPanelColumns.includes('ParentId')) {
                        if (this.isCommunity) {
                            tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                            if (tempRecord.Parent != undefined)
                                tempRecord.ParentAccountLink = "/" + this.communityName + "/s/detail/" + tempRecord.ParentId;
                        } else {
                            tempRecord.recordLink = "/" + tempRecord.Id;
                            if (tempRecord.Parent != undefined)
                                tempRecord.ParentAccountLink = "/" + tempRecord.ParentId;
                        }
                        if (tempRecord.Parent != undefined)
                            tempRecord.ParentAccountName = tempRecord.Parent.Name;

                        tempRecord.favoriteIcon = 'utility:add';
                        tempRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                        tempRecord.iconStatus = 'Click To Follow';
                        tempAccountList.push(tempRecord);
                    } else {
                        if (this.isCommunity) {
                            tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                        } else {
                            tempRecord.recordLink = "/" + tempRecord.Id;
                        }
                        if((this.accountMeta.AccountTypeValues == 'DC Plan' || this.accountMeta.AccountTypeValues == 'Corporate Pension Plan' || this.accountMeta.AccountTypeValues == 'Taft-Hartley Plan (ERISA)') && 
                        tempRecord.Form_5500_Additional_Information__r != undefined) {
                            tempRecord.ContactName = tempRecord.Form_5500_Additional_Information__r[0]?.Plan_Administrator_Contact_Name__c;
                            tempRecord.ContactPhone = tempRecord.Form_5500_Additional_Information__r[0]?.Spons_DFE_Phone_Num__c;
                        }
                        tempRecord.favoriteIcon = 'utility:add';
                        tempRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                        tempRecord.iconStatus = 'Click To Follow';
                        tempAccountList.push(tempRecord);
                    }
                }
                if ((this.offset + 10) >= this.totalRecordCount) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }
                this.relatedAccounts = tempAccountList;
                this.getAllFavoriteRecordsFromAPI();
                this.offset = tempAccountList.length;
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });
    }

    getSalesforceBaseURL() {
        getSFBaseUrl().
            then(baseURL => {
                if (baseURL) {
                    this.baseURL = baseURL;
                }
            })
            .catch(error => {
                this.isLoading = false;
                console.log("Error:", error);
            });
    }

    clearAll = (data) => {
        this.setSelectedRows = [];
    }

    chevronButtonClicked() {
        this.collapsed = !this.collapsed;
    }

    accountSelected(event) {

        const selectedRows = event.detail.selectedRows;
        var arrayToPassToParent = [];
        for (let i = 0; i < selectedRows.length; i++) {
            var dataToPush = {};
            dataToPush.location = {
                Latitude: selectedRows[i].BillingLatitude,
                Longitude: selectedRows[i].BillingLongitude
            };
            dataToPush.title = selectedRows[i].Name;
            dataToPush.description = `Coords: ${selectedRows[i].BillingLatitude}, ${selectedRows[i].BillingLongitude}`;
            arrayToPassToParent.push({
                mapMarker: dataToPush,
                recordId: selectedRows[i].Id,
                accountType: this.accountMeta.AccountTypeValues,
                entity: 'Account'
            });

        }

        arrayToPassToParent.accountType = this.accountMeta.AccountTypeValues;
        const selectedEvent = new CustomEvent("selectedaccounts", {
            detail: arrayToPassToParent
        })
        this.dispatchEvent(selectedEvent);
    }


    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
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
        let {
            Id
        } = row;

        this[NavigationMixin.Navigate]({

            type: 'standard__recordPage',
            attributes: {
                recordId: Id,
                actionName: 'edit'
            }
        });
    }

    handleEvent = event => {

        const refreshRecordEvent = event.data.payload;
        this.refreshQuickLinksPanel();
        this.newbuttonPressed = false;
        this.fromEditEvent = true;
        this.refreshTable();
    }

    refreshTable(event) {
        if (!this.fromEditEvent) {
            var table = this.template.querySelector('lightning-datatable');
            if (table != null)
                table.enableInfiniteLoading = true;
        }
        this.fromEditEvent = false;
        this.connectedCallback();
    }


    loadMoreData(event) {
        if (this.totalRecordCount > this.offset && this.newbuttonPressed == false) {
            //Display a spinner to signal that data is being loaded
            if (this.relatedAccounts != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';

            getAllRelatedAccounts({
                recordId: this.recordId,
                accountType: this.accountMeta.AccountTypeValues,
                recordLimit: this.limit,
                offset: this.offset,
                subAccountType: this.accountMeta.SubAccountTypeValues
            }).then(nextChunkOfAccounts => {
                var tempAccList = [];
                for (var i = 0; i < nextChunkOfAccounts.length; i++) {
                    let tempAccountRecord = Object.assign({}, nextChunkOfAccounts[i]); //cloning object
                    if (this.accountMeta.SubPanelColumns.includes('ParentId')) {
                        if (this.isCommunity) {
                            tempAccountRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempAccountRecord.Id;
                            if (tempAccountRecord.Parent != undefined)
                                tempAccountRecord.ParentAccountLink = "/" + this.communityName + "/s/detail/" + tempAccountRecord.ParentId;
                        } else {
                            tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                            if (tempAccountRecord.Parent != undefined)
                                tempAccountRecord.ParentAccountLink = "/" + tempAccountRecord.ParentId;
                        }
                        if (tempAccountRecord.Parent != undefined)
                            tempAccountRecord.ParentAccountName = tempAccountRecord.Parent.Name;

                        tempAccountRecord.favoriteIcon = 'utility:add';
                        tempAccountRecord.favIconColor = 'slds-icon-text-light addIconStyling';
                        tempAccountRecord.iconStatus = 'Click To Follow';
                        tempAccList.push(tempAccountRecord);
                    } else {
                        if (this.isCommunity) {
                            tempAccountRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempAccountRecord.Id;
                        } else {
                            tempAccountRecord.recordLink = "/" + tempAccountRecord.Id;
                        }
                        if((this.accountMeta.AccountTypeValues == 'DC Plan' || this.accountMeta.AccountTypeValues == 'Corporate Pension Plan' || this.accountMeta.AccountTypeValues == 'Taft-Hartley Plan (ERISA)') && 
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
                if (this.relatedAccounts)
                    this.relatedAccounts = this.relatedAccounts.concat(tempAccList);
                    this.getAllFavoriteRecordsFromAPI();
                if ((this.offset + 10) >= this.totalRecordCount) {
                    this.offset = this.totalRecordCount;
                    this.plusSign = '';
                } else {
                    this.offset = parseInt(this.offset) + parseInt(this.limit);
                    this.plusSign = '+';
                }
                this.loadMoreStatus = '';
                if (this.relatedAccounts != null && this.relatedAccounts.length >= this.totalRecordCount) {
                    this.tableElement.enableInfiniteLoading = false;
                    this.loadMoreStatus = 'No more data to load';
                } else if (this.relatedAccounts == null) {
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

    get recordCountCondition() {
        if (this.totalRecordCount == 10) {
            return false;
        }
        if (this.totalRecordCount > 9) {
            return true;
        } else {
            return false
        }
    }

    handleGotoRelatedList() {
        var url = '/view-all?recordId=' + this.recordId + '&accountType=' + this.accountMeta.AccountTypeValues+ '&subAccountType=' + this.accountMeta.SubAccountTypeValues+ '&accountTypeLabel=' + this.accountMeta.MasterLabel + '&recordName=' + this.recordName + '&totalRecordCount=' + this.totalRecordCount + '&isCommunity=' + this.isCommunity;
        var navigationURL = this.baseURL + '/lightning/cmp/c__AccountRelatedDataTableView?c__recordId=' + this.recordId + '&c__accountType=' + this.accountMeta.AccountTypeValues + '&c__accountTypeLabel=' + this.accountMeta.MasterLabel + '&c__recordName=' + this.recordName + '&c__totalRecordCount=' + this.totalRecordCount + '&c__isCommunity=' + this.isCommunity;

        if (this.isCommunity) {

            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        } else {
            window.open(navigationURL, "_self");
        }
    }

    checkInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
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
            console.error('Received error from server: ', error);
        });
        this.newbuttonPressed = true;
        var splitedAccountTypeValues = this.accountMeta.AccountTypeValues.split(',');

        if (splitedAccountTypeValues.length == 1) {
            let newAccountRecord = {
                type: 'standard__objectPage',
                attributes: {
                    objectApiName: 'Account',
                    actionName: 'new'
                },
                state: {
                    navigationLocation: "RELATED_LIST",
                    useRecordTypeCheck: '2',
                    defaultFieldValues: "MetroArea__c=" + this.recordId + ",Type=" + this.accountMeta.AccountTypeValues
                }
            };
            this[NavigationMixin.Navigate](newAccountRecord);
        } else {
            let newAccountRecord = {
                type: 'standard__objectPage',
                attributes: {
                    objectApiName: 'Account',
                    actionName: 'new'
                },
                state: {
                    navigationLocation: "RELATED_LIST",
                    useRecordTypeCheck: '2',
                    defaultFieldValues: "MetroArea__c=" + this.recordId
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
                    this.relatedAccounts.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.relatedAccounts[index].isFavorite = true;
                            this.relatedAccounts[index].favoriteIcon = 'utility:check';
                            this.relatedAccounts[index].favId = favElement.Favorite_Id__c;
                            this.relatedAccounts[index].favIconColor = "selectedFavIcon";
                            this.relatedAccounts[index].iconStatus = 'Click To Unfollow';
                        }
                    });
                });

                this.relatedAccounts = [...this.relatedAccounts];
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
                        this.relatedAccounts.forEach((element, index) => {
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
                        this.relatedAccounts = [...tempList];
                        this.allFavoriteRecords.push(createdFavouriteRecord);
                        this.isLoading = false;

                        fireEvent(this.pageRef,'updateFavList','');
                        fireEvent(this.pageRef,'updateAllAccount','');
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
                    this.relatedAccounts.forEach((element, index) => {
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
                    this.relatedAccounts = [...tempList];
                    this.isLoading = false;

                //Remove the non-favourite record from the favorite list.
                for (let i = 0; i < this.allFavoriteRecords.length; i++) {
                    if (this.allFavoriteRecords[i].Target_Id__c == favToBeRemovedId) {
                        this.allFavoriteRecords.splice(i, 1);
                        break;
                    }
                }
                fireEvent(this.pageRef,'updateFavList','');
                fireEvent(this.pageRef,'updateAllAccount','');
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
    
    disconnectedCallback() {
        unregisterAllListeners(this);
    }
}