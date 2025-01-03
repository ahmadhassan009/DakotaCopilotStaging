import { LightningElement , api, track} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getInvestmentHoldingsRecords from '@salesforce/apex/InvestmentHoldingsController.getInvestmentHoldingsRecords';
import getRecordsCount from '@salesforce/apex/InvestmentHoldingsController.getRecordsCount';

import ISSUER_DESCRIPTION_FIELD from '@salesforce/schema/Investment_Holdings__c.Issue_Description__c';
import NAME_FIELD from '@salesforce/schema/Investment_Holdings__c.Name';
import INVESTMENT_FIRM_FIELD from '@salesforce/schema/Investment_Holdings__c.Investment_Firm__c';
import FUND_BALANCE_FIELD from '@salesforce/schema/Investment_Holdings__c.Fund_Balance__c';
import INITIAL_INVESTMENT_FIELD from '@salesforce/schema/Investment_Holdings__c.Initial_Investment__c';
import EFFECTIVE_RATE_OF_INTEREST_FIELD from '@salesforce/schema/Investment_Holdings__c.Effective_Rate_of_Interest__c';
import DATE_ACQUIRED_FIELD from '@salesforce/schema/Investment_Holdings__c.Date_Acquired__c';


const Alternative_Holdings_COLUMNS = [
    { label: 'Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Investment Firm', sortable: true, fieldName: INVESTMENT_FIRM_FIELD.fieldApiName, type: 'text'},
    { label: 'Date Acquired',fieldName: DATE_ACQUIRED_FIELD.fieldApiName, sortable: true, type: 'text'},
    { label: 'Initial Investment', sortable: true, fieldName: INITIAL_INVESTMENT_FIELD.fieldApiName , type: 'currency', typeAttributes: {  minimumFractionDigits: 0, maximumFractionDigits: 0 },cellAttributes: { alignment: 'left' } },
    { label: 'Fund Balance', sortable: true, fieldName: FUND_BALANCE_FIELD.fieldApiName , type: 'currency', typeAttributes: {  minimumFractionDigits: 0, maximumFractionDigits: 0 },cellAttributes: { alignment: 'left' } }
]


const Fixed_Income_Holdings_COLUMNS = [
    { label: 'Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Description',fieldName: ISSUER_DESCRIPTION_FIELD.fieldApiName, sortable: true, type: 'text'},
    { label: 'Date Acquired',fieldName: DATE_ACQUIRED_FIELD.fieldApiName, sortable: true, type: 'text'},
    { label: 'Initial Investment', sortable: true, fieldName: INITIAL_INVESTMENT_FIELD.fieldApiName , type: 'currency', typeAttributes: {  minimumFractionDigits: 0, maximumFractionDigits: 0 },cellAttributes: { alignment: 'left' } },
    { label: 'Fund Balance', sortable: true, fieldName: FUND_BALANCE_FIELD.fieldApiName , type: 'currency', typeAttributes: {  minimumFractionDigits: 0, maximumFractionDigits: 0 },cellAttributes: { alignment: 'left' } },
    { label: 'Effective Rate of Interest', fieldName: EFFECTIVE_RATE_OF_INTEREST_FIELD.fieldApiName, sortable: true, type: 'number', typeAttributes: { minimumFractionDigits: '4' }, cellAttributes: { alignment: 'left' } },  
]

const Equity_or_Preferred_Stock_Holdings_COLUMNS = [
    { label: 'Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Description',fieldName: ISSUER_DESCRIPTION_FIELD.fieldApiName, sortable: true, type: 'text'},
    { label: 'Date Acquired',fieldName: DATE_ACQUIRED_FIELD.fieldApiName, sortable: true, type: 'text'},
    { label: 'Initial Investment', sortable: true, fieldName: INITIAL_INVESTMENT_FIELD.fieldApiName , type: 'currency', typeAttributes: {  minimumFractionDigits: 0, maximumFractionDigits: 0 },cellAttributes: { alignment: 'left' } },
    { label: 'Fund Balance', sortable: true, fieldName: FUND_BALANCE_FIELD.fieldApiName , type: 'currency', typeAttributes: {  minimumFractionDigits: 0, maximumFractionDigits: 0 },cellAttributes: { alignment: 'left' } },
]

export default class InvestmentHoldingsRelatedToAccChild extends NavigationMixin(LightningElement){

    @api recordId;
    @api recordType;
    @api recordTypeIdMap;
    @api collapsed;
    recordTypeId='';
    recordsExists = false;
    columns;
    data;
    isLoading=false;
    totalRecords = '0';
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = 'Id'; 
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'LAST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    sectionDataLabel = '';

    connectedCallback()
    {
        this.recordTypeId= this.recordTypeIdMap.get(this.recordType);
        this.sectionDataLabel= this.recordType.replaceAll("_", " ");
        if(this.recordType=='Alternative_Holdings')
        {
            this.columns = Alternative_Holdings_COLUMNS;
        }
        else if(this.recordType=='Fixed_Income_Holdings')
        {
            this.columns = Fixed_Income_Holdings_COLUMNS;
        }
        else
        {
            this.columns = Equity_or_Preferred_Stock_Holdings_COLUMNS;
        }
        
        getRecordsCount({
            recordId : this.recordId,
            recordTypeId : this.recordTypeId
        }).then(returnedCount => {           
            if(returnedCount == 0) {
                this.recordsExists = false;
                this.isLoading = false;
            }
            else {
                this.recordsExists = true;
                this.getInvestmentHoldingsRecords(this.sortedBy,this.sortedDirection);
            }
            if(returnedCount > 10){
                this.totalRecords = '10+';
            } 
            else {
                this.totalRecords = returnedCount;
            }
            this.sectionDataLabel+=' ( '+this.totalRecords+' )';
            
        }).catch(error => {
            this.isLoading = false;
            console.log('Cannot fetch record count');
        });
    }
    /**
     * To get records of Dakota Content
     */
    getInvestmentHoldingsRecords(sortedBy, sortedDirection)
    {   
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        if(sortedBy=='Id')
            sortedBy='Name';
        getInvestmentHoldingsRecords({
            recordId : this.recordId,
            recordTypeId : this.recordTypeId,
            sortedBy : sortedBy,
            sortOrder : sortedDirection,
            nullOrder: this.nullOrder
        }).then(returnedData => {
            if (returnedData) {
                this.data = returnedData;
                for (var i = 0; i < this.data.length; i++) 
                {
                    this.data[i].Id= "/" + this.communityName + "/s/detail/" + this.data[i].Id;
                    if(this.data[i].Date_Acquired__c!=null)
                    {
                        const options = {
                            year: 'numeric', month: 'numeric', day: 'numeric'
                            };
                        let dt = new Date(this.data[i].Date_Acquired__c);
                        this.data[i].Date_Acquired__c = new Intl.DateTimeFormat( 'en-US', options ).format( dt );
                    } 
                    if(this.data[i].Funding_Year__c!=null)
                    {
                        const options = {
                            year: 'numeric', month: 'numeric', day: 'numeric'
                            };
                        let dt = new Date(this.data[i].Funding_Year__c);
                        this.data[i].Funding_Year__c = new Intl.DateTimeFormat( 'en-US', options ).format( dt );
                    } 
                }
                this.isLoading = false;   
            }
            else
            {
                this.data = null;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('Cannot fetch records');
        });
    }



     updateColumnSorting(event) {
        this.isLoading = true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let tempSortBy = this.sortedBy;  
        if(tempSortBy=='Id')
            tempSortBy='Name';
        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getInvestmentHoldingsRecords(tempSortBy, this.sortedDirection);
    }

    ChevronButtonClicked() {
        this.collapsed = !this.collapsed;
    }

    handleShowFullRelatedList() 
    {
        var url = '/investment-holdings-view-all?recordId=' + this.recordId + '&recordType=' + this.recordType + '&recordTypeId=' + this.recordTypeId;
        this[NavigationMixin.Navigate]({
        type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }
}