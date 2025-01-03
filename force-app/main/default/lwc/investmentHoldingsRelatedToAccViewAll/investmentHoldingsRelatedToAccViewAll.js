import {LightningElement, api} from 'lwc';
import {NavigationMixin} from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getInvestmentHoldingsRecordsViewAll from '@salesforce/apex/InvestmentHoldingsController.getInvestmentHoldingsRecordsViewAll';
import getRecordsCount from '@salesforce/apex/InvestmentHoldingsController.getRecordsCount';
import getAccountName from '@salesforce/apex/EducationRelatedToAccountController.getAccountName';

import NAME_FIELD from '@salesforce/schema/Investment_Holdings__c.Name';
import INVESTMENT_FIRM_FIELD from '@salesforce/schema/Investment_Holdings__c.Investment_Firm__c';
import ISSUER_DESCRIPTION_FIELD from '@salesforce/schema/Investment_Holdings__c.Issue_Description__c';
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

export default class InvestmentHoldingsRelatedToAccViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    @api recordType;
    @api  recordTypeId;
    offset = 0;
    limit = 50;
    columns;
    accountNameLink;
    recordName;
    totalCount;
    dataSorting = false;
    fromLoadMore = false;
    infiniteLoading = false;
    isLoading = true;
    plusSign;
    totalRecords = '0';
    nullOrder = 'LAST';
    defaultSortDirection = 'desc';
    sortedBy = 'Id'; 
    nameSortDir = this.defaultSortDirection;
    sortedDirection = 'desc';
    data;
    sectionDataLabel = '';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
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

        this.setRecordsInInitialState();
    }

    /**
     * Function to set records when the component is loaded/refreshed 
     */
    setRecordsInInitialState() {
        this.setLinks();

        // Get Parent Account's name
        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordName = returnedAccount.Name;
            }
        });

        //To fetch number of Education records
        getRecordsCount({
            recordId: this.recordId,
            recordTypeId : this.recordTypeId
        }).then(Count => {
            if (Count)
            {
                this.totalCount = Count;
                this.getInvestmentHoldingsRecordsViewAll(this.recordId,this.recordTypeId, this.sortedBy, this.sortedDirection, this.limit, this.offset);
            }
                
        }).catch(error => {
            console.log("Error in fetching total count of investment holding records : ", error);
        });
    }

    getInvestmentHoldingsRecordsViewAll(recordId,recordTypeId, sortedBy, sortedDirection, limit, offset) {
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        if(sortedBy=='Id')
            sortedBy='Name';
       
        getInvestmentHoldingsRecordsViewAll({
                recordId: recordId,
                recordTypeId : recordTypeId,
                sortedBy: sortedBy,
                sortOrder: sortedDirection,
                recLimit: limit,
                offset: offset,
                nullOrder: this.nullOrder
            })
            .then((records) => {
                if (records) {
                    let recordsList = records; 
                    for (var i = 0; i < recordsList.length; i++) 
                    {
                        recordsList[i].Id= "/" + this.communityName + "/s/detail/" + recordsList[i].Id;
                        if(recordsList[i].Date_Acquired__c!=null)
                        {
                            const options = {
                                year: 'numeric', month: 'numeric', day: 'numeric'
                                };
                            let dt = new Date(recordsList[i].Date_Acquired__c);
                            recordsList[i].Date_Acquired__c = new Intl.DateTimeFormat( 'en-US', options ).format( dt );
                        } 
                        if(recordsList[i].Funding_Year__c!=null)
                        {
                            const options = {
                                year: 'numeric', month: 'numeric', day: 'numeric'
                                };
                            let dt = new Date(recordsList[i].Funding_Year__c);
                            recordsList[i].Funding_Year__c = new Intl.DateTimeFormat( 'en-US', options ).format( dt );
                        } 
                    }                  

                    if (this.fromLoadMore) {
                        if (this.data)
                            this.data = this.data.concat(recordsList);
                        if ((this.offset + this.limit) >= this.totalCount || (this.offset) == 0) {
                            this.offset = this.totalCount;
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
                        this.data = recordsList;
                    }

                    this.offset = this.data.length;
                    if ((this.data.length) >= this.totalCount) {
                        this.plusSign = '';
                    } else {
                        this.plusSign = '+';
                    }
                } else {
                    this.data = null;
                }
                this.isLoading = false;
                if (this.dataSorting) {
                    this.dataSorting = false;
                }
                
            })
            .catch((error) => {
                console.log('Error in fetching investment holding records : ', error);
                this.isLoading = false;
                this.infiniteLoading = false;
            });
    }

    updateColumnSorting(event) {
        this.isLoading = true;
        this.sortedBy = event.detail.fieldName;
        let tempSortBy =this.sortedBy
        if(tempSortBy=='Id')
            tempSortBy='Name';
        this.sortedDirection = event.detail.sortDirection;
        this.dataSorting = true;
        this.data = [];

        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        //let tempSortBy = this.sortedBy;
        this.getInvestmentHoldingsRecordsViewAll(this.recordId,this.recordTypeId, tempSortBy, this.sortedDirection, this.offset, 0);
        
    }

    loadMoreData(event) {
        if (this.totalCount > this.offset) {
            if (this.infiniteLoading) {
                return;
            }
            if (this.dataSorting) {
                return;
            }
            this.infiniteLoading = true;
            if (this.data != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            this.fromLoadMore = true;
            this.getInvestmentHoldingsRecordsViewAll(this.recordId,this.recordTypeId, this.sortedBy, this.sortedDirection, this.limit, this.offset);

        }
    }

    refreshTable() {
        this.isLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.plusSign = '';
        this.sortedDirection = 'desc';
        this.defaultSortDirection = 'desc';
        this.nameSortDir = this.defaultSortDirection;
        this.sortedBy = 'Id';
        this.data = [];
        this.setRecordsInInitialState();
    }

    setLinks() {
        this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
        this.accountNameLink = "/" + this.communityName + '/s/account/Account/Default';
    }
}