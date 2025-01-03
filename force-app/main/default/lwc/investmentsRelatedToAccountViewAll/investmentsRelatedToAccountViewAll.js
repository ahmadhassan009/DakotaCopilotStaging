import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation"
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getAccountName from '@salesforce/apex/InvestmentsInAccountsController.getAccountName';
import getAccountRelatedInvestmentRecords from '@salesforce/apex/InvestmentsInAccountsController.getAccountRelatedInvestmentRecords';
import getAccountRelatedInvestmentRecordsCount from '@salesforce/apex/InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsCount';
import activeCommunities from '@salesforce/label/c.active_communities';
import NAME_FIELD from '@salesforce/schema/Investment__c.Name';
import FUNDING_YEAR_FIELD from '@salesforce/schema/Investment__c.Funding_Year__c';
import FUND_BALANLE_FIELD from '@salesforce/schema/Investment__c.Fund_Balance__c'
import ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Asset_Class_picklist__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Sub_Asset_Class_Picklist__c';
import NUMBER_OF_SHARES_FIELD from '@salesforce/schema/Investment__c.Number_of_Shares__c';
import FILING_DATE_FIELD from '@salesforce/schema/Investment__c.Filing_Date__c';

const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled: true }
];

const COLUMNS_PUBLIC_INVESTMENT = [
    { label: 'Investment Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName } } },
    { label: 'Investment Strategy', sortable: true, fieldName: 'recordLink', type: "url", typeAttributes: { label: { fieldName: 'investmentStrategyName' }, target: '_self', tooltip: { fieldName: "investmentStrategyName" } } },
    { label: 'Fund Balance', sortable: true, fieldName: FUND_BALANLE_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    { label: 'Asset Class', sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Sub-Asset Class', sortable: true, fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Funding Year', sortable: true, fieldName: FUNDING_YEAR_FIELD.fieldApiName, type: 'text' }
]

const COLUMNS_13F_FILLING = [
    { label: 'Investment Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName } } },
    { label: 'Investment Strategy', sortable: true, fieldName: 'recordLink', type: "url", typeAttributes: { label: { fieldName: 'investmentStrategyName' }, target: '_self', tooltip: { fieldName: "investmentStrategyName" } } },
    { label: 'Ticker', sortable: true, fieldName: 'ticker', type: 'text' },
    { label: 'Asset Class', sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Sub-Asset Class', sortable: true, fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Product Structure', sortable: true, fieldName: 'productStructure', type: 'picklist' },
    { label: 'Fund Balance', sortable: true, fieldName: FUND_BALANLE_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    { label: 'Number of Shares', sortable: true, fieldName: NUMBER_OF_SHARES_FIELD.fieldApiName, type: 'number' },
    { label: 'Filing Date', sortable: true, fieldName: FILING_DATE_FIELD.fieldApiName, type: 'date-local', typeAttributes: { day: "numeric", month: "numeric", year: "numeric" } },
]

export default class InvestmentsRelatedToAccountViewAll extends NavigationMixin(LightningElement) {

    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    @api listType;
    @api fromFollowEmail;
    @api isInvestmentUpdate;
    @api fromFollowEmailPubicInv;
    @api createddate;
    listTypeName;
    recNameAvailable = false;
    recordLink;
    accountNameLink;
    relatedInvestmentRecords;
    totalRelatedInvestmentsCount;
    columns = COLUMNS_PUBLIC_INVESTMENT;
    baseURL = '';
    tempAddAction = [];
    offset = 0;
    limit = 50;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortDirection;
    nameSortDir = this.defaultSortDirection;
    sortedBy = 'Id';     
    tempSortBy = '';   
    nullOrder = 'LAST';
    plusSign = null;
    @track isLoading = false;
    is13FFiling = false;
    @track error;
    searchValue = '';
    infiniteLoading = false;
    sortingInprocess=false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.listType = decodeURI(this.listType);
        this.isLoading = true;
        this.setLinks();
        if (this.listType == 'Public Investment' || this.fromFollowEmailPubicInv == "True" || this.isInvestmentUpdate == 'True') {
            this.tempAddAction = COLUMNS_PUBLIC_INVESTMENT;
            this.listTypeName = this.listType + 's';
        }
        else if (this.listType == '13F Filings' || this.fromFollowEmail == "True") {
            this.listTypeName = this.listType;
            this.tempAddAction = COLUMNS_13F_FILLING;
            this.is13FFiling = true;
        }
        this.columns = this.tempAddAction;
        this.setFieldSorting();
        this.getAccountRelatedInvestmentRecords();


        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordName = returnedAccount.Name;
                this.recNameAvailable = true;
            }
        });
    }


    getAccountRelatedInvestmentRecords() {
        if (this.sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        this.isLoading = true;

        getAccountRelatedInvestmentRecordsCount({
            recordId: this.recordId,
            listType: this.listType,
            searchValue: this.searchValue,
            fromFollowEmail: this.fromFollowEmail,
            fromFollowEmailPubicInv: this.fromFollowEmailPubicInv,
            isInvestmentUpdate: this.isInvestmentUpdate,
            createddate: this.createddate
        }).then(investmentRecordCount => {
            if (investmentRecordCount) {
                this.totalRelatedInvestmentsCount = investmentRecordCount;
                getAccountRelatedInvestmentRecords({
                    recordId: this.recordId,
                    listType: this.listType,
                    sortedBy: this.tempSortBy,
                    sortOrder: this.sortedDirection,
                    nullOrder: this.nullOrder,
                    recordLimit: this.limit,
                    offset: this.offset,
                    searchValue: this.searchValue,
                    fromFollowEmail: this.fromFollowEmail,
                    fromFollowEmailPubicInv: this.fromFollowEmailPubicInv,
                    isInvestmentUpdate: this.isInvestmentUpdate,
                    createddate: this.createddate
                }).then(relatedInvestments => {
                    if (relatedInvestments) {
                        for (var i = 0; i < relatedInvestments.length; i++) {
                            relatedInvestments[i].Id = "/" + this.communityName + '/s/investment/' + relatedInvestments[i].Id;
                            if (relatedInvestments[i].Investment_Strategy__c)
                                relatedInvestments[i].recordLink = "/" + this.communityName + '/s/investment-strategy/' + relatedInvestments[i].Investment_Strategy__c;
                            if (relatedInvestments[i].Investment_Strategy__r) {
                                relatedInvestments[i].investmentStrategyName = relatedInvestments[i].Investment_Strategy__r.Name;
                                relatedInvestments[i].ticker = relatedInvestments[i].Investment_Strategy__r.Ticker__c;
                                relatedInvestments[i].productStructure = relatedInvestments[i].Investment_Strategy__r.Product_Structure__c;
                            }
                        }
                        this.relatedInvestmentRecords = relatedInvestments;
                        this.offset = relatedInvestments.length;
                        // For showing + sign with count
                        if ((this.offset) >= this.totalRelatedInvestmentsCount || (this.offset) == 0) {
                            this.plusSign = '';
                        }
                        else {
                            this.plusSign = '+';
                        }
                        this.infiniteLoading = false;
                        this.isLoading = false; 
                        this.sortingInprocess = false;
                    }
                }).catch(error => {
                    this.infiniteLoading = false;
                    this.isLoading = false;          
                    this.sortingInprocess = false;
                    console.log("Error:", error);
                });
            }
        })


    }

    // Set breadcrumb links
    setLinks() {
        this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
        this.accountNameLink = "/" + this.communityName + '/s/account/Account/Default';
    }

    // To refresh table
    refreshTable(event) {
        this.infiniteLoading = true;
        this.isLoading = true;
        if (this.template.querySelector('[data-id="searchValue"]')) {
            this.template.querySelector('[data-id="searchValue"]').value = '';
        }
        this.searchValue = '';
        this.offset = 0;
        this.limit = 50;
        this.relatedInvestmentRecords = null;
        var table = this.template.querySelector('lightning-datatable');
        if (table) table.enableInfiniteLoading = true;
        return refreshApex(this.connectedCallback());
    }

    /**
    * For sorting the table
    * @param {*} event 
    */
    updateColumnSorting(event) {
        this.isLoading = true;
        this.sortingInprocess =true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.offset = 0;
        this.limit = 50;
        this.relatedInvestmentRecords = [];                  
        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';  
        this.nameSortDir = this.sortedDirection;
        this.setFieldSorting();
        this.getAccountRelatedInvestmentRecords();
        //this.sortData(this.sortedBy, this.sortedDirection);
    }

    setFieldSorting() {
        this.tempSortBy = this.sortedBy;
        if(this.sortedBy === 'Id') {
            this.tempSortBy = 'Name';
        }else if(this.sortedBy === 'recordLink') {
            this.tempSortBy = 'Investment_Strategy__r.Name';
        }else if(this.sortedBy === 'ticker') {
            this.tempSortBy = 'Investment_Strategy__r.Ticker__c';
        }else if(this.sortedBy === 'productStructure') {
            this.tempSortBy = 'Investment_Strategy__r.Product_Structure__c';
        }
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.relatedInvestmentRecords));

        let keyValue = (a) => {
            if (fieldname == 'recordLink') {
                fieldname = 'investmentStrategyName';
            }
            else if (fieldname == 'Id') {
                fieldname = NAME_FIELD.fieldApiName;
            }
            if (a[fieldname] != undefined && fieldname != FUND_BALANLE_FIELD.fieldApiName && fieldname != NUMBER_OF_SHARES_FIELD.fieldApiName) {
                return a[fieldname].toLowerCase();
            }
            else {
                return a[fieldname];
            }
        };

        // checking reverse direction 
        let isReverse = direction === 'asc' ? 1 : -1;

        // sorting data 
        parseData.sort((x, y) => {
            let xValue = keyValue(x);
            let yValue = keyValue(y);

            // Handle null or undefined values
            if (xValue == null) xValue = '';
            if (yValue == null) yValue = '';

            // Convert to comparable types
            if (typeof xValue === 'string' || typeof yValue === 'string') {
                xValue = String(xValue);
                yValue = String(yValue);
            } else if (typeof xValue === 'number' || typeof yValue === 'number') {
                xValue = parseFloat(xValue);
                yValue = parseFloat(yValue);
            }

            return isReverse * (xValue > yValue ? 1 : xValue < yValue ? -1 : 0);
        });

        // set the sorted data to data table data
        this.relatedInvestmentRecords = parseData;
    }

    loadMoreData(event) {
        if (this.sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }

        if (this.totalRelatedInvestmentsCount > this.offset && this.sortingInprocess == false) {
            if (this.infiniteLoading)
                return;
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if (this.relatedInvestmentRecords != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            this.setFieldSorting();
            getAccountRelatedInvestmentRecords({
                recordId: this.recordId,
                listType: this.listType,
                sortedBy: this.tempSortBy,
                sortOrder: this.sortedDirection,
                nullOrder: this.nullOrder,
                recordLimit: this.limit,
                offset: this.offset,
                searchValue: this.searchValue,
                fromFollowEmail: this.fromFollowEmail,
                fromFollowEmailPubicInv: this.fromFollowEmailPubicInv,
                isInvestmentUpdate: this.isInvestmentUpdate,
                createddate: this.createddate
            }).then(relatedInvestments => {
                var tempSearchList = [];
                if (relatedInvestments) {
                    for (var i = 0; i < relatedInvestments.length; i++) {
                        let tempContactRecord = Object.assign({}, relatedInvestments[i]); //cloning object 
                        tempContactRecord.Id = "/" + this.communityName + '/s/investment/' + relatedInvestments[i].Id;
                        if (tempContactRecord.Investment_Strategy__c)
                            tempContactRecord.recordLink = "/" + this.communityName + '/s/investment-strategy/' + relatedInvestments[i].Investment_Strategy__c;
                        if (tempContactRecord.Investment_Strategy__r) {
                            tempContactRecord.investmentStrategyName = relatedInvestments[i].Investment_Strategy__r.Name;
                            tempContactRecord.ticker = relatedInvestments[i].Investment_Strategy__r.Ticker__c;
                            tempContactRecord.productStructure = relatedInvestments[i].Investment_Strategy__r.Product_Structure__c;
                        }
                        tempSearchList.push(tempContactRecord);

                    }
                    this.isLoading = false;
                    this.relatedInvestmentRecords = this.relatedInvestmentRecords.concat(tempSearchList);
                    if ((this.offset + 50) >= this.totalRelatedInvestmentsCount || (this.offset) == 0) {
                        this.offset = this.totalRelatedInvestmentsCount;
                        this.plusSign = '';
                    } else {
                        this.offset = parseInt(this.offset) + parseInt(this.limit);
                        this.plusSign = '+';
                    }
                    /*if (this.sortedBy != undefined && this.sortedDirection != undefined) {
                        this.sortData(this.sortedBy, this.sortedDirection);
                    }*/
                    this.loadMoreStatus = '';
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                    }
                    this.infiniteLoading = false;
                }
            }).catch(error => {
                this.infiniteLoading = false;
                this.isLoading = false;
                console.log("Error:", error);
            });

        }
    }

    checkEnterKeyPress(event) {
        if (event.keyCode == 13) {
            this.fetchSearchedRecords();
        }
    }

    showToast(type, title, message, variant, mode) {
        const evt = new ShowToastEvent({
            type: type,
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }

    fetchSearchedRecords() {
        let tempSearchValue = this.template.querySelector('[data-id="searchValue"]').value;
        this.searchValue = tempSearchValue.trim();

        this.searchValue = this.searchValue.replace(/'/g, "\\\'");
        this.offset = 0;
        this.setFieldSorting();
        this.getAccountRelatedInvestmentRecords();
    }

    handleOnChange() {
        let tempSearchValue = this.template.querySelector('[data-id="searchValue"]').value;
        if (tempSearchValue == null || tempSearchValue == '') {
            this.searchValue = tempSearchValue?.trim();
            this.refreshTable();
        }
    }

    handleInputFocus(event) {
        if (event?.currentTarget?.name == 'searchValue') {
            this.template.querySelector('[data-id="searchToolTip"]').classList.remove('slds-fall-into-ground');
            this.template.querySelector('[data-id="searchToolTip"]').classList.add('slds-raise-from-ground');
            event.stopPropagation()
        }
    }

    handleInputBlur(event) {
        this.template.querySelector('[data-id="searchToolTip"]').classList.add('slds-fall-into-ground');
        this.template.querySelector('[data-id="searchToolTip"]').classList.remove('slds-raise-from-ground');
        event.stopPropagation()
    }
}