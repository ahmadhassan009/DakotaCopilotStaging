import {
    LightningElement,
    api,
    wire
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import getRelatedAccounts from '@salesforce/apex/MetroAreaListViewController.getRelatedAccounts';
import getAccountTypeCount from '@salesforce/apex/MetroAreaListViewController.getAccountTypeCount';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';
import WEBSITE_FIELD from '@salesforce/schema/Account.Website';
import DAKOTA_CITY_FIELD from '@salesforce/schema/Account.BillingCity';
import DESCRIPTION_FIELD from '@salesforce/schema/Account.Description';
import FORM_5500_FIELD from '@salesforce/schema/Account.Form_5500__c';
import INVESTMENT_FOCUS_FIELD from '@salesforce/schema/Account.Investment_Focus_single__c';

import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';

import {
    CurrentPageReference
} from 'lightning/navigation';

const COLUMNS = [{
    label: 'Account Name',
    fieldName: "recordLink",
    type: "url",
    sortable: true,
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
    sortable: true,
    fieldName: 'MetroAreaLink',
    type: 'url',
    typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' }
},
{
    label: 'AUM',
    fieldName: AUM_FIELD.fieldApiName,
    type: 'currency',
    sortable: true,
    initialWidth: 150,
    typeAttributes: {
        minimumFractionDigits: '0'
    }
},
{
    label: 'Website',
    fieldName: WEBSITE_FIELD.fieldApiName,
    type: 'url',
    sortable: true,
},
{
    label: 'Billing City',
    fieldName: DAKOTA_CITY_FIELD.fieldApiName,
    type: 'Text',
    sortable: true,
},
{
    label: 'Description',
    fieldName: DESCRIPTION_FIELD.fieldApiName,
    type: 'Long Text Area',
    initialWidth: 500
},
];

const DC_PLAN_COLUMNS = [{
    label: 'Account Name',
    fieldName: "recordLink",
    type: "url",
    sortable: true,
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
    sortable: true,
    fieldName: 'MetroAreaLink',
    sortable: true,
    type: 'url',
    typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' }
},
{
    label: 'AUM',
    fieldName: AUM_FIELD.fieldApiName,
    type: 'currency',
    initialWidth: 150,
    sortable: true,
    typeAttributes: {
        minimumFractionDigits: '0'
    },
},
{
    label: 'Billing City',
    fieldName: DAKOTA_CITY_FIELD.fieldApiName,
    sortable: true,
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
    sortable: true,
    type: 'url'
}
];
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
    sortable: true,
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
];

const WIREHOUSE_MORGAN_COLUMNS = [{
    label: 'Account Name',
    fieldName: "recordLink",
    type: "url",
    sortable: true,
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
    sortable: true,
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
    sortable: true,
    fieldName: 'MetroAreaLink',
    type: 'url',
    typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' }
},
{
    label: 'AUM',
    fieldName: AUM_FIELD.fieldApiName,
    sortable: true,
    type: 'currency',
    initialWidth: 150,
    typeAttributes: {
        minimumFractionDigits: '0'
    }
},
{
    label: 'Billing City',
    fieldName: DAKOTA_CITY_FIELD.fieldApiName,
    sortable: true,
    type: 'Text'
},
{
    label: 'Description',
    fieldName: DESCRIPTION_FIELD.fieldApiName,
    type: 'Long Text Area',
    initialWidth: 500
}
];

export default class MetroAreaStatesSpecificAccTypesViewAll extends NavigationMixin(LightningElement) {
    @wire(CurrentPageReference) pageRef;
    refreshQuickLinksPanel() {
        fireEvent(this.pageRef, 'pageRefreshed', 'event');
    }

    @api accountType;
    @api accountTypeLabel;
    @api totalRecordCount;
    @api stateName;
    @api subAccountType;
    isLoading = false;
    @api isSalesforceInstance = false;
    relatedAccounts = [];
    columns = COLUMNS;
    sortedDirection = 'desc';
    sortedBy = AUM_FIELD.fieldApiName;
    sortBy = AUM_FIELD.fieldApiName;
    totalRecordCount = 0;
    plusSign = '+';
    offset = 0;
    limit = 50;
    fromLoadMore = false;
    tempAddAction = [];
    isSorted = false;
    maNameLink;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {

        this.isLoading = true;

        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);

        this.maNameLink = "/" + this.communityName + '/s/metro-area/Metro_Area__c/Default';
        this.recordLink = "/" + this.communityName + '/s/state-detail-page?stateName=' + this.stateName;
        this.setColumns();
        this.getCountOfAccounts();
        this.getRelatedAccountRecords(this.stateName, this.accountType, this.sortedBy, this.sortedDirection, this.limit, this.offset,this.subAccountType);
    }

    setColumns() {
        if (this.accountTypeLabel=='Wirehouse Teams' || this.accountTypeLabel=='Morgan Stanley Teams' || this.accountTypeLabel == 'Merrill Lynch Teams' || this.accountTypeLabel =='UBS Teams' ) {
            this.tempAddAction = null;
            this.tempAddAction = WIREHOUSE_MORGAN_COLUMNS;
        }
        else {
            this.tempAddAction = null;
            this.tempAddAction = COLUMNS;
            if (this.communityName == 'everest' && this.accountTypeLabel != 'RIA') {
                this.tempAddAction = EVEREST_COLUMNS;
            } else if (this.communityName != 'everest' && (this.accountTypeLabel == 'DC Plan' || this.accountTypeLabel == 'Corporate Pension Plans' || this.accountTypeLabel == 'Taft-Hartley Plans (ERISA)')) {
                this.tempAddAction = DC_PLAN_COLUMNS;
            }
    }
        this.columns = this.tempAddAction;
    }

    getCountOfAccounts() {
        getAccountTypeCount({
            stateName: this.stateName,
            accountType: this.accountType,
            subAccountType: this.subAccountType
        }).then(recordCount => {
            if (recordCount) {
                this.totalRecordCount = recordCount;
                if ((this.offset) >= this.totalRecordCount) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }

            }
        }).catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });
    }

    getRelatedAccountRecords(stateName, accountType, sortedBy, sortedDirection, limit, offset,subAccountType) {
        getRelatedAccounts({
            stateName: stateName,
            accountType: accountType,
            sortedBy: sortedBy,
            sortedDirection: sortedDirection,
            recordLimit: limit,
            offset: offset,
            subAccountType: this.subAccountType
        }).then(relatedAccountsTypes => {
            if (relatedAccountsTypes) {
                var tempAccountList = [];

                for (var i = 0; i < relatedAccountsTypes.length; i++) {
                    let tempRecord = Object.assign({}, relatedAccountsTypes[i]); //cloning object  
                    tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                    if (this.accountTypeLabel == 'Wirehouse Teams' || this.accountTypeLabel == 'Morgan Stanley Teams' || this.accountTypeLabel == 'Merrill Lynch Teams' || this.accountTypeLabel =='UBS Teams') {
                        if (tempRecord.Parent != undefined) {
                            tempRecord.ParentAccountLink = "/" + this.communityName + "/s/detail/" + tempRecord.ParentId;
                        tempRecord.ParentAccountName = tempRecord.Parent.Name;
                        }
                    } else {
                        if ((this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' | this.accountType == 'Taft-Hartley Plan (ERISA)') &&
                            tempRecord.Form_5500_Additional_Information__r != undefined) {
                            tempRecord.ContactName = tempRecord.Form_5500_Additional_Information__r[0]?.Plan_Administrator_Contact_Name__c;
                            tempRecord.ContactPhone = tempRecord.Form_5500_Additional_Information__r[0]?.Spons_DFE_Phone_Num__c;
                        }
                    }
                    if (tempRecord.MetroArea__c != undefined) {
                        tempRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempRecord.MetroArea__c;
                        tempRecord.MetroAreaName = tempRecord.MetroArea__r.Name;
                    }
                    tempAccountList.push(tempRecord);
                }

                if (this.offset == 0) {
                    this.fromRefresh = false;
                }
                if (this.fromLoadMore) {
                    this.relatedAccounts = this.relatedAccounts.concat(tempAccountList);
                }
                else {
                    this.relatedAccounts = [];
                    this.relatedAccounts = tempAccountList;
                }

                this.offset += tempAccountList.length;
                if (this.offset >= this.totalRecordCount) {
                    this.plusSign = '';
                }
                else {
                    this.plusSign = '+';
                }

                if (this.fromLoadMore) {
                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                    }
                }
                this.isLoading = false;
                this.infiniteLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            this.infiniteLoading = false;
            console.log("Error:", error);
        });
    }

    onHandleSort(event) {

        this.isLoading = true;
        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;
        this.sortedBy = sortedBy;
        if (sortedBy == 'ParentAccountLink') {
            this.sortBy = 'Parent.Name';
        } else if (sortedBy == 'recordLink') {
            this.sortBy = 'Name';
        } else if (sortedBy == 'MetroAreaLink') {
            this.sortBy = 'MetroArea__r.Name';
        }
        else {
            this.sortedBy = sortedBy;
            this.sortBy = sortedBy;
        }
        this.sortedDirection = sortDirection;
        this.isSorted = true;
        getRelatedAccounts({
            stateName: this.stateName,
            accountType: this.accountType,
            sortedBy: this.sortBy,
            sortedDirection: this.sortedDirection,
            recordLimit: this.offset,
            offset: 0,
            subAccountType:this.subAccountType
        }).then(relatedAccountsTypes => {
            if (relatedAccountsTypes) {
                var tempAccountList = [];

                for (var i = 0; i < relatedAccountsTypes.length; i++) {
                    let tempRecord = Object.assign({}, relatedAccountsTypes[i]); //cloning object  
                    tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                    if (this.accountTypeLabel == 'Wirehouse Teams' || this.accountTypeLabel == 'Morgan Stanley Teams' || this.accountTypeLabel == 'Merrill Lynch Teams' || this.accountTypeLabel =='UBS Teams') {
                        if (tempRecord.Parent != undefined) {
                            tempRecord.ParentAccountLink = "/" + this.communityName + "/s/detail/" + tempRecord.ParentId;
                        tempRecord.ParentAccountName = tempRecord.Parent.Name;
                        }
                    } else {
                        if ((this.accountType == 'DC Plan' || this.accountType == 'Corporate Pension Plan' || this.accountType == 'Taft-Hartley Plan (ERISA)') &&
                            tempRecord.Form_5500_Additional_Information__r != undefined) {
                            tempRecord.ContactName = tempRecord.Form_5500_Additional_Information__r[0]?.Plan_Administrator_Contact_Name__c;
                            tempRecord.ContactPhone = tempRecord.Form_5500_Additional_Information__r[0]?.Spons_DFE_Phone_Num__c;
                        }
                    }
                    if (tempRecord.MetroArea__c != undefined) {
                        tempRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempRecord.MetroArea__c;
                        tempRecord.MetroAreaName = tempRecord.MetroArea__r.Name;
                    }
                    tempAccountList.push(tempRecord);
                }
                
                this.relatedAccounts = [];
                this.relatedAccounts = tempAccountList;
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            this.infiniteLoading = false;
            console.log("Error:", error);
        });
    }

    loadMoreData(event) {
        if (this.totalRecordCount != this.offset && this.offset>0) {
            //Display a spinner to signal that data is being loaded
            if (!this.fromRefresh) {
                if (this.relatedAccounts != null && event.target) {
                    event.target.isLoading = true;
                }
                this.tableElement = event.target;
                this.fromLoadMore = true;

                if (this.sortedBy == 'ParentAccountLink') {
                    this.sortedBy = 'Parent.Name';
                }
                else if (this.sortedBy == 'recordLink') {
                    this.sortedBy = 'Name';
                } else if (this.sortedBy == 'MetroAreaLink') {
                    this.sortedBy = 'MetroArea__r.Name';
                }
                this.getRelatedAccountRecords(this.stateName, this.accountType, this.sortedBy, this.sortedDirection, this.limit, this.offset,this.subAccountType);
                if (this.sortedBy == 'Parent.Name') {
                    this.sortedBy = 'ParentAccountLink';
                }
                else if (this.sortedBy == 'Name') {
                    this.sortedBy = 'recordLink';
                } else if (this.sortedBy == 'MetroArea__r.Name') {
                    this.sortedBy = 'MetroAreaLink';
                }
            }
        }
    }

    refreshTable(event) {
        this.isLoading = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.sortedDirection = 'desc';
        this.sortedBy = AUM_FIELD.fieldApiName;
        var table = this.template.querySelector('lightning-datatable');
        if (table != null)
            table.enableInfiniteLoading = true;
        this.getRelatedAccountRecords(this.stateName, this.accountType, this.sortedBy, this.sortedDirection, this.limit, this.offset,this.subAccountType)
    }

}