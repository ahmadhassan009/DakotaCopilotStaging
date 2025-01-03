import {
    LightningElement,
    api,
    wire
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getRelatedAccounts from '@salesforce/apex/MetroAreaListViewController.getRelatedAccounts';
import getAccountTypeCount from '@salesforce/apex/MetroAreaListViewController.getAccountTypeCount';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INVESTMENT_FOCUS_FIELD from '@salesforce/schema/Account.Investment_Focus_single__c';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';
import WEBSITE_FIELD from '@salesforce/schema/Account.Website';
import DAKOTA_CITY_FIELD from '@salesforce/schema/Account.BillingCity';
import DESCRIPTION_FIELD from '@salesforce/schema/Account.Description';
import FORM_5500_FIELD from '@salesforce/schema/Account.Form_5500__c';

import {
    fireEvent
} from 'c/pubsub';
import {
    CurrentPageReference
} from 'lightning/navigation';

const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];
const COLUMNS = [{
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
    label: 'Metro Area',
    fieldName: 'MetroAreaLink',
    type: 'url',
    typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' }
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
{
    type: 'action',
    typeAttributes: { rowActions: noActions },
}
]

const DC_PLAN_COLUMNS = [{
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
    label: 'Metro Area',
    fieldName: 'MetroAreaLink',
    type: 'url',
    typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' }
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
    label: 'Form 5500',
    fieldName: FORM_5500_FIELD.fieldApiName,
    type: 'url'
},
{
    type: 'action',
    typeAttributes: { rowActions: noActions },
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
    label: 'Metro Area',
    fieldName: 'MetroAreaLink',
    type: 'url',
    typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' }
},
{
    label: 'Investment Focus',
    fieldName: INVESTMENT_FOCUS_FIELD.fieldApiName,
    type: 'Picklist',
    initialWidth: 150
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
{
    type: 'action',
    typeAttributes: { rowActions: noActions },
}
];
const WIREHOUSE_MORGAN_COLUMNS = [{
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
    label: 'Metro Area',
    fieldName: 'MetroAreaLink',
    type: 'url',
    typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' }
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
{
    type: 'action',
    typeAttributes: { rowActions: noActions },
}
];

export default class MetroAreaStatesSpecificAccTypes extends NavigationMixin(LightningElement) {
    @wire(CurrentPageReference) pageRef;
    refreshQuickLinksPanel() {
        fireEvent(this.pageRef, 'pageRefreshed', 'event');
    }

    @api accountMeta;
    @api recordId;
    @api recordName;
    @api stateName;
    isLoading = false;
    relatedAccounts;
    columns = COLUMNS;
    sortedDirection = 'desc';
    sortedBy = AUM_FIELD.fieldApiName;
    totalRecordCount = 0;
    isCommunity = false;
    plusSign = '+';
    offset = 0;
    limit = 10;
    collapsed = true;
    panelStyling;
    tempAddAction = [];
    isDisplay = true;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }
    connectedCallback() {
        this.checkIsCommunityInstance()
        this.setColumns();
        this.getCountOfAccounts();
    }

    setColumns() {
        if (this.accountMeta.SubPanelColumns.includes('ParentId')) {
            this.tempAddAction = null;
            this.tempAddAction = WIREHOUSE_MORGAN_COLUMNS;
        }
        else {
            this.tempAddAction = null;
            this.tempAddAction = COLUMNS;
            if (this.isCommunity) {
                if (this.communityName == 'everest' && this.accountMeta.AccountTypeValues != 'RIA') {
                    this.tempAddAction = EVEREST_COLUMNS;
                } else if (this.communityName != 'everest' && (this.accountMeta.AccountTypeValues == 'DC Plan' || this.accountMeta.AccountTypeValues == 'Corporate Pension Plan' || this.accountMeta.AccountTypeValues == 'Taft-Hartley Plan (ERISA)')) {
                    this.tempAddAction = DC_PLAN_COLUMNS;
                }
            }
        }
        this.columns = this.tempAddAction;
    }

    getCountOfAccounts() {
        getAccountTypeCount({
            stateName: this.stateName,
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
                    this.panelStyling = 'height : 305px;';
                } else if (this.totalRecordCount == 1) {
                    this.panelStyling = 'height : 62px;';
                } else if (this.totalRecordCount == 2) {
                    this.panelStyling = 'height : 90px;';
                } else if (this.totalRecordCount == 3) {
                    this.panelStyling = 'height : 115px;';
                } else if (this.totalRecordCount == 4) {
                    this.panelStyling = 'height : 142px;';
                } else if (this.totalRecordCount == 5) {
                    this.panelStyling = 'height : 170px;';
                } else if (this.totalRecordCount == 6) {
                    this.panelStyling = 'height : 196px;';
                } else if (this.totalRecordCount == 7) {
                    this.panelStyling = 'height : 225px;';
                } else if (this.totalRecordCount == 8) {
                    this.panelStyling = 'height : 250px;';
                } else if (this.totalRecordCount == 9) {
                    this.panelStyling = 'height : 280px;';
                }
                this.isDisplay = true;
            }
            else {
                this.isDisplay = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });
    }

    getRelatedAccountRecords() {
        this.isLoading = true;
        getRelatedAccounts({
            stateName: this.stateName,
            accountType: this.accountMeta.AccountTypeValues,
            sortedBy: this.sortedBy,
            sortedDirection: this.sortedDirection,
            recordLimit: this.limit,
            offset: this.offset,
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
                            if (tempRecord.MetroArea__c != undefined) {
                                tempRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempRecord.MetroArea__c;
                                tempRecord.MetroAreaName = tempRecord.MetroArea__r.Name;
                            }
                        } else {
                            tempRecord.recordLink = "/" + tempRecord.Id;
                            if (tempRecord.Parent != undefined)
                                tempRecord.ParentAccountLink = "/" + tempRecord.ParentId;
                            if (tempRecord.MetroArea__c != undefined) {
                                tempRecord.MetroAreaLink = "/" + tempRecord.MetroArea__c;
                                tempRecord.MetroAreaName = tempRecord.MetroArea__r.Name;
                            }
                        }
                        if (tempRecord.Parent != undefined)
                            tempRecord.ParentAccountName = tempRecord.Parent.Name;
                        tempAccountList.push(tempRecord);
                    } else {
                        if (this.isCommunity) {
                            tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                            if (tempRecord.MetroArea__c != undefined) {

                                tempRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempRecord.MetroArea__c;
                            }
                        } else {
                            tempRecord.recordLink = "/" + tempRecord.Id;
                            if (tempRecord.MetroArea__c != undefined) {

                                tempRecord.MetroAreaLink = "/" + tempRecord.MetroArea__c;
                            }
                        }
                        tempRecord.MetroAreaName = (tempRecord.MetroArea__r && tempRecord.MetroArea__r.Name) ? tempRecord.MetroArea__r.Name : '';
                        if ((this.accountMeta.AccountTypeValues == 'DC Plan' || this.accountMeta.AccountTypeValues == 'Corporate Pension Plan' || this.accountMeta.AccountTypeValues == 'Taft-Hartley Plan (ERISA)') &&
                            tempRecord.Form_5500_Additional_Information__r != undefined) {
                            tempRecord.ContactName = tempRecord.Form_5500_Additional_Information__r[0]?.Plan_Administrator_Contact_Name__c;
                            tempRecord.ContactPhone = tempRecord.Form_5500_Additional_Information__r[0]?.Spons_DFE_Phone_Num__c;
                        }
                        tempAccountList.push(tempRecord);
                    }
                }
                if ((this.offset + 10) >= this.totalRecordCount) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }
                this.relatedAccounts = tempAccountList;
                this.offset = tempAccountList.length;
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });
    }

    loadMoreData(event) {
        if (this.totalRecordCount > this.offset) {
            //Display a spinner to signal that data is being loaded
            if (this.relatedAccounts != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';

            getRelatedAccounts({
                stateName: this.stateName,
                accountType: this.accountMeta.AccountTypeValues,
                sortedBy: this.sortedBy,
                sortedDirection: this.sortedDirection,
                recordLimit: this.limit,
                offset: this.offset,
                subAccountType: this.accountMeta.SubAccountTypeValues
            }).then(nextChunkOfAccounts => {
                var tempAccList = [];
                for (var i = 0; i < nextChunkOfAccounts.length; i++) {
                    let tempRecord = Object.assign({}, nextChunkOfAccounts[i]); //cloning object  
                    if (this.accountMeta.SubPanelColumns.includes('ParentId')) {
                        if (this.isCommunity) {
                            tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                            if (tempRecord.Parent != undefined)
                                tempRecord.ParentAccountLink = "/" + this.communityName + "/s/detail/" + tempRecord.ParentId;
                            if (tempRecord.MetroArea__c != undefined) {
                                tempRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempRecord.MetroArea__c;
                                tempRecord.MetroAreaName = tempRecord.MetroArea__r.Name;
                            }
                        } else {
                            tempRecord.recordLink = "/" + tempRecord.Id;
                            if (tempRecord.Parent != undefined)
                                tempRecord.ParentAccountLink = "/" + tempRecord.ParentId;
                            if (tempRecord.MetroArea__c != undefined) {
                                tempRecord.MetroAreaLink = "/" + tempRecord.MetroArea__c;
                                tempRecord.MetroAreaName = tempRecord.MetroArea__r.Name;
                            }
                        }
                        if (tempRecord.Parent != undefined)
                            tempRecord.ParentAccountName = tempRecord.Parent.Name;
                        tempAccountList.push(tempRecord);
                    } else {
                        if (this.isCommunity) {
                            tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                            if (tempRecord.MetroArea__c != undefined) {

                                tempRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempRecord.MetroArea__c;
                            }
                        } else {
                            tempRecord.recordLink = "/" + tempRecord.Id;
                            if (tempRecord.MetroArea__c != undefined) {

                                tempRecord.MetroAreaLink = "/" + tempRecord.MetroArea__c;
                            }
                        }
                        tempRecord.MetroAreaName = (tempRecord.MetroArea__r && tempRecord.MetroArea__r.Name) ? tempRecord.MetroArea__r.Name : '';
                        if ((this.accountMeta.MasterLabel == 'DC Plan' || this.accountMeta.MasterLabel == 'Corporate Pension Plan' || this.accountMeta.MasterLabel == 'Taft-Hartley Plan (ERISA)') &&
                            tempRecord.Form_5500_Additional_Information__r != undefined) {
                            tempRecord.ContactName = tempRecord.Form_5500_Additional_Information__r[0]?.Plan_Administrator_Contact_Name__c;
                            tempRecord.ContactPhone = tempRecord.Form_5500_Additional_Information__r[0]?.Spons_DFE_Phone_Num__c;
                        }
                        tempAccList.push(tempRecord);
                    }
                }
                if (this.relatedAccounts)
                    this.relatedAccounts = this.relatedAccounts.concat(tempAccList);
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

    chevronButtonClicked() {
        this.collapsed = !this.collapsed;
        this.relatedAccounts = [];
        this.offset=0;
        if(!this.collapsed) {
            this.getRelatedAccountRecords();
        }
    }

    handleShowFullRelatedList() {
        var url = '/metro-area-state-view-all?stateName=' + this.stateName + '&accountType=' + this.accountMeta.AccountTypeValues +'&subAccountType=' + this.accountMeta.SubAccountTypeValues+ '&accountTypeLabel=' + this.accountMeta.MasterLabel + '&totalRecordCount=' + this.totalRecordCount;
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }

}