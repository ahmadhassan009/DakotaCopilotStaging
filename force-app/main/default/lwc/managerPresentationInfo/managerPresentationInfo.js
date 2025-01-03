import { LightningElement } from 'lwc';
import getRecordsCount from '@salesforce/apex/ManagerPresentationInfoController.getRecordsCount';
import getAllRecords from '@salesforce/apex/ManagerPresentationInfoController.getAllRecords';
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import managerPresentationDatatableCss from '@salesforce/resourceUrl/managerPresentationDatatableCss';
import { NavigationMixin } from 'lightning/navigation';
import TYPE_FIELD from '@salesforce/schema/Manager_Presentation_Info__c.Type__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Manager_Presentation_Info__c.Asset_Class__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Manager_Presentation_Info__c.Sub_Asset_Class__c';
import MEETING_DATE_FIELD from '@salesforce/schema/Manager_Presentation_Info__c.Meeting_Date__c';
import ACCOUNT_NAME_FIELD from '@salesforce/schema/Manager_Presentation_Info__c.Account_Name__c';

const columns = [
    { label: "Manager Presentation Name", fieldName: "DistributionPublicUrl", hideDefaultActions: true, type: "url", typeAttributes: { label: { fieldName: 'Name' }, target: '_self',tooltip: { fieldName: 'Name' }}, sortable: "true"},
    { label: "Type", fieldName: TYPE_FIELD.fieldApiName, type: "text", hideDefaultActions: true, sortable: "true"},
    { label: "Account Name", fieldName: ACCOUNT_NAME_FIELD.fieldApiName, type: "text", hideDefaultActions: true, sortable: "true"},
    { label: "Public Plan Minute", fieldName: "PublicPlanMinuteId", type: "url", typeAttributes: { label: { fieldName: 'PublicPlanMinuteName' }, target: '_self', tooltip: { fieldName: 'PublicPlanMinuteName' }}, hideDefaultActions: true, sortable: "true"},
    { label: "Investment Strategy", fieldName: "InvestmentStrategyId", type: "url", typeAttributes: { label: { fieldName: 'InvestmentStrategyName' }, target: '_self', tooltip: { fieldName: 'InvestmentStrategyName' }}, hideDefaultActions: true, sortable: "true"},
    { label: "Asset Class", fieldName: ASSET_CLASS_FIELD.fieldApiName, type: "text", hideDefaultActions: true, sortable: "true"},
    { label: "Sub-Asset Class", fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: "text", hideDefaultActions: true, sortable: "true"},
    { label: "Meeting Date", fieldName: MEETING_DATE_FIELD.fieldApiName, type: "date-local", typeAttributes: { day: "numeric", month: "numeric", year: "numeric" }, hideDefaultActions: true, sortable: "true"},
];

export default class ManagerPresentationInfo extends NavigationMixin( LightningElement ) {
    isLoading = true;
    data;
    allRecords;
    mpRecordsExists = false;
    columns = columns;
    totalNumberOfRows;
    currentCount = 0;
    limit=20;
    offset=0;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    isCommunity = false;
    isLoadMore = false;
    defaultSortDirection = 'asc';
    nameSortDir = this.defaultSortDirection;    
    tempSortBy = '';
    sortBy = 'Meeting_Date__c';
    sortDirection = 'desc';
    nullOrder = 'LAST';    
    searchValue = '';        
    dataSorting = false;

    connectedCallback(){
        Promise.all([
            loadStyle(this, managerPresentationDatatableCss)
        ]);
        this.isLoading = true;
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.getRecordsViewAll(this.sortDirection, this.limit, this.offset);
    }

    getRecordsViewAll(sortedDirection, limit, offset) {
        this.setFieldSorting();
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        
        getRecordsCount({
            searchValue : this.searchValue
        }).then((recCount) => {
            if (recCount) {
                this.totalNumberOfRows = recCount;
                this.totalCount = recCount;

                getAllRecords({
                        searchValue : this.searchValue,
                        sortedBy: this.tempSortBy,
                        sortOrder: sortedDirection,
                        recLimit: limit,
                        offset: offset,
                        nullOrder: this.nullOrder
                    })
                    .then((Records) => {
                        if (Records) {                                 
                            let recordList = [];

                            for (let i = 0; i < Records.length; i++) {
                                let returnedData = Object.assign({}, Records[i]);            
                                       
                                if (returnedData.Distribution_Public_URL__c && returnedData.MP_Title__c) {
                                    returnedData.DistributionPublicUrl = returnedData.Distribution_Public_URL__c;
                                    returnedData.Name = returnedData.MP_Title__c;
                                }

                                if (returnedData.Investment_Strategy__c && returnedData.Investment_Strategy__r) {
                                    returnedData.InvestmentStrategyId = "/" + this.communityName + '/s/investment-strategy/' + returnedData.Investment_Strategy__c;
                                    returnedData.InvestmentStrategyName = returnedData.Investment_Strategy__r.Name;
                                }
                                if (returnedData.Public_Plan_Minute__c && returnedData.Public_Plan_Minute__r) {
                                    returnedData.PublicPlanMinuteId = "/" + this.communityName + '/s/public-plan-minute/' + returnedData.Public_Plan_Minute__c;
                                    returnedData.PublicPlanMinuteName = returnedData.Public_Plan_Minute__r.Name;
                                }                               
                                
                                recordList.push(returnedData);
                            }
                            if (this.fromLoadMore) {
                                if (this.data)
                                    this.data = this.data.concat(recordList);
                                if ((this.offset + this.limit) >= this.totalCount || (this.offset) == 0) {
                                    this.offset = this.totalCount;
                                } else {
                                    this.offset = parseInt(this.offset) + parseInt(this.limit);
                                }
        
                                if (this.tableElement) {
                                    this.tableElement.isLoading = false;
                                }
                                this.fromLoadMore = false;
                                this.infiniteLoading = false;
                            } else {
                                this.data = recordList;
                            }    

                            this.currentCount = this.data.length;  
                            this.offset = this.data.length;                            
                            this.mpRecordsExists = true;
                            this.isLoading = false;
                        } else {
                            this.data = null;
                            this.isLoading = false;
                        }
                        if (this.dataSorting) {
                            this.dataSorting = false;
                        }                                           
                    })
                    .catch((error) => {
                        console.log('Error in fetching records : ', error);
                        this.isLoading = false;
                        this.infiniteLoading = false;
                    });
            } else{
                this.isLoading = false;  
                this.mpRecordsExists = false; 
            }            
        }).catch((error) => {
            console.log('Error in fetching records length : ', error);
            this.isLoading = false;        
        });
    }

    fetchSearchResults(event){
        this.isLoading = true;
        this.limit = 20;
        this.offset = 0;
        this.sortBy = 'Meeting_Date__c';
        this.sortDirection ='desc';
        var searchValue = this.template.querySelector('[data-id="searchValue"]').value;
        this.searchValue = searchValue.trim();
        this.data = [];
        this.getRecordsViewAll(this.sortDirection, this.limit, this.offset);
    }

    searchManagerPrestOnEnter(event) {
        if (event.keyCode == 13) {
            this.isLoading = true;
            this.fetchSearchResults(event);
        }
    }

    resetFilters(event) {
        this.isLoading = true;  
        this.template.querySelector('[data-id="searchValue"]').value = '';
        this.totalNumberOfRows = 0;
        this.limit = 20;
        this.offset = 0;
        this.sortBy = 'Meeting_Date__c';
        this.sortDirection ='desc'; 
        this.searchValue = ''

        this.data = [];
        this.getRecordsViewAll(this.sortDirection, this.limit, this.offset);
    }

    loadMoreData(event){
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
            this.getRecordsViewAll(this.sortDirection, this.limit, this.offset,null,true);
        }
    }

    doSorting(event) {        
        this.isLoading = true;
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.dataSorting = true;
        this.offset = 0;
        this.data = [];
        this.nameSortDir = this.sortDirection;
        this.getRecordsViewAll(this.sortDirection, this.limit,this.offset);
    }

    setFieldSorting() {
        this.tempSortBy = this.sortBy;
        if(this.sortBy === 'DistributionPublicUrl') {
            this.tempSortBy = 'MP_Title__c';
        } else if(this.sortBy === 'PublicPlanMinuteId') {
            this.tempSortBy = 'Public_Plan_Minute__r.Name';
        } else if(this.sortBy === 'InvestmentStrategyId') {
            this.tempSortBy = 'Investment_Strategy__r.Name';
        }
    }
}