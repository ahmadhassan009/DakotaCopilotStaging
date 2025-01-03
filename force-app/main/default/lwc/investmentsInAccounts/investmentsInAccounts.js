import { LightningElement, api } from 'lwc';
import activeCommunities from '@salesforce/label/c.active_communities';

import { NavigationMixin } from "lightning/navigation";
import NAME_FIELD from '@salesforce/schema/Investment__c.Name';
import FUNDING_YEAR_FIELD from '@salesforce/schema/Investment__c.Funding_Year__c';
import FUND_BALANLE_FIELD from '@salesforce/schema/Investment__c.Fund_Balance__c'
import ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Asset_Class_picklist__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Sub_Asset_Class_Picklist__c';
import NUMBER_OF_SHARES_FIELD from '@salesforce/schema/Investment__c.Number_of_Shares__c';
import FILING_DATE_FIELD from '@salesforce/schema/Investment__c.Filing_Date__c';

import getAccountRelatedInvestmentRecordsInRelatedList from '@salesforce/apex/InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsInRelatedList';
import getAccountRelatedInvestmentRecordsCount from '@salesforce/apex/InvestmentsInAccountsController.getAccountRelatedInvestmentRecordsCount';

const COLUMNS_PUBLIC_INVESTMENT = [
    { label: 'Investment Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName } } },
    { label: 'Investment Strategy', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: "investmentStrategyName" }, target: '_self', tooltip: { fieldName: "investmentStrategyName" } } },
    { label: 'Fund Balance', sortable: true, fieldName: FUND_BALANLE_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 }},
    { label: 'Asset Class', sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Sub-Asset Class', sortable: true, fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Funding Year', sortable: true, fieldName: FUNDING_YEAR_FIELD.fieldApiName, type: 'text' }
]

const COLUMNS_13F_FILLING = [
    { label: 'Investment Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName } } },
    { label: 'Investment Strategy', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: "investmentStrategyName" }, target: '_self', tooltip: { fieldName: "investmentStrategyName" } } },
    { label: 'Ticker', sortable: true, fieldName: 'ticker', type: 'text' },
    { label: 'Asset Class', sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Sub-Asset Class', sortable: true, fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Product Structure', sortable: true, fieldName: 'productStructure', type: 'picklist' },
    { label: 'Fund Balance', sortable: true, fieldName: FUND_BALANLE_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 }},
    { label: 'Number of Shares', sortable: true, fieldName: NUMBER_OF_SHARES_FIELD.fieldApiName, type: 'number' },
    { label: 'Filing Date', sortable: true, fieldName: FILING_DATE_FIELD.fieldApiName, type: 'date-local',typeAttributes: {day: "numeric",month: "numeric", year: "numeric"}},
]

export default class InvestmentsInAccounts extends NavigationMixin(LightningElement) {
    @api recordId;
    @api recordName;
    @api listType;
    recordsExists = false;
    isCommunity=false;
    columns;
    data;
    baseURL = '';
    recordToDel;
    panelStyling;
    isLoading = false;
    totalRecords = '0';
    listName = '';
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = NAME_FIELD.fieldApiName;
    nameSortDir = this.defaultSortDirection;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    nullOrder = 'FIRST';

    connectedCallback() {
        if (this.listType == 'Public Investment') {
            this.columns = COLUMNS_PUBLIC_INVESTMENT.slice();
            this.listName = 'Public Investments';
        }
        else {
            this.listName = '13F Filings';
            this.columns = COLUMNS_13F_FILLING.slice();
        }

        this.isLoading = true;
        //getting investments records based on Record Type
        getAccountRelatedInvestmentRecordsCount({
            recordId: this.recordId,
            listType: this.listType,
            recordLimit:10, 
            Integer: 0
        }).then(returnedCount => {
            this.isLoading = false;
            if (returnedCount == 0) {
                this.recordsExists = false;
            }
            else {
                this.recordsExists = true;
            }
            if (returnedCount > 10) {
                this.totalRecords = '10+';
            }
            else {
                this.totalRecords = returnedCount;
            }
            if (returnedCount > 0) {
                this.getAccountRelatedInvestmentRecords(this.recordId, this.sortedBy, this.sortedDirection);
                this.sortedDirection = 'asc';
                this.sortedBy = NAME_FIELD.fieldApiName;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    //getting investments records based on Record Type
    getAccountRelatedInvestmentRecords(recordId, sortedBy, sortedDirection){
        this.isLoading = true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        getAccountRelatedInvestmentRecordsInRelatedList({
            recordId: recordId,
            listType: this.listType,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            nullOrder: this.nullOrder
        }).then(returnedData => {
            this.isLoading = false;
            if (returnedData) {
                    //setting up links and field names
                for (var i = 0; i < returnedData.length; i++) {
                    returnedData[i].Id = "/"+this.communityName + '/s/investment/' + returnedData[i].Id;
                    if(returnedData[i].Investment_Strategy__c)returnedData[i].recordLink = "/"+this.communityName + '/s/investment-strategy/' + returnedData[i].Investment_Strategy__c;
                    if(returnedData[i].Investment_Strategy__r){    
                        returnedData[i].investmentStrategyName = returnedData[i].Investment_Strategy__r.Name;
                        returnedData[i].ticker = returnedData[i].Investment_Strategy__r.Ticker__c;
                        returnedData[i].productStructure = returnedData[i].Investment_Strategy__r.Product_Structure__c;
                    }
                }
                this.data = returnedData;
                
                this.isLoading = false;
            }
            else {
                this.data = null;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }
    
    // navigating to custom list view
    handleShowFullRelatedList() {
        if (this.communityName != 'marketplace2' && this.listType == 'Public Investment') {
            var url = '/view-accountrelatedinvestments?recordId=' + this.recordId +'&listType='+this.listType;

            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
        else if (this.communityName != 'marketplace2' && this.listType == '13F Filings') {
            var url = '/view-accountrelatedinvestments13f?recordId=' + this.recordId +'&listType='+this.listType;

            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
    }

    /**
     * For sorting the table
     * @param {*} event 
     */
     updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let tempSortBy = this.sortedBy;

        if (this.listType == 'Public Investment') {

            if(this.sortedBy === 'Id') {
                tempSortBy = 'Name';
            } else if(this.sortedBy === 'recordLink') {
                tempSortBy =  'Investment_Strategy__r.Name';
            }else if(this.sortedBy === FUND_BALANLE_FIELD.fieldApiName) {
                tempSortBy = 'Fund_Balance__c';
            }else if(this.sortedBy === ASSET_CLASS_FIELD.fieldApiName) {
                tempSortBy = 'Asset_Class_picklist__c'; 
            }else if(this.sortedBy === SUB_ASSET_CLASS_FIELD.fieldApiName) {
                tempSortBy = 'Sub_Asset_Class_Picklist__c';
            }else if(this.sortedBy === FUNDING_YEAR_FIELD.fieldApiName) {
                tempSortBy = 'Funding_Year__c';
            }
        }
        else{

            if(this.sortedBy === 'Id') {
                tempSortBy = 'Name';
            } else if(this.sortedBy === 'recordLink') {
                tempSortBy =  'Investment_Strategy__r.Name';
            }else if(this.sortedBy === 'ticker') {
                tempSortBy = 'Investment_Strategy__r.Ticker__c';
            }else if(this.sortedBy === ASSET_CLASS_FIELD.fieldApiName) {
                tempSortBy = 'Asset_Class_picklist__c'; 
            }else if(this.sortedBy === SUB_ASSET_CLASS_FIELD.fieldApiName) {
                tempSortBy = 'Sub_Asset_Class_Picklist__c';
            }else if(this.sortedBy === 'productStructure') {
                tempSortBy = 'Investment_Strategy__r.Product_Structure__c';
            }else if(this.sortedBy === FUND_BALANLE_FIELD.fieldApiName) {
                tempSortBy = 'Fund_Balance__c';
            }else if(this.sortedBy === NUMBER_OF_SHARES_FIELD.fieldApiName) {
                tempSortBy = 'Number_of_Shares__c';
            }else if(this.sortedBy === FILING_DATE_FIELD.fieldApiName) {
                tempSortBy = 'Filing_Date__c';
            }
        }
        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getAccountRelatedInvestmentRecords(this.recordId, tempSortBy, this.sortedDirection);
    }
}