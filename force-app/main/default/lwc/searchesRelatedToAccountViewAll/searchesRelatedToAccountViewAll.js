import { LightningElement, api,track } from 'lwc';
import { NavigationMixin } from "lightning/navigation"
import getAccountRelatedSearchesCount from '@salesforce/apex/SearchesRelatedToAccountController.getAccountRelatedSearchesCount';
import getAllAccountRelatedSearchesRecords from '@salesforce/apex/SearchesRelatedToAccountController.getAllAccountRelatedSearchesRecords';
import getAllRelatedSortedSearchesRecords from '@salesforce/apex/SearchesRelatedToAccountController.getAllRelatedSortedSearchesRecords';
import getAccountName from '@salesforce/apex/SearchesRelatedToAccountController.getAccountName';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import activeCommunities from '@salesforce/label/c.active_communities';
import NAME_FIELD from '@salesforce/schema/Marketplace_Searches__c.Name';
import STATUS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Search_Status__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Asset_Class__c';
import AMOUNT_FIELD from '@salesforce/schema/Marketplace_Searches__c.Amount__c';
import EmailPreferencesStayInTouchReminder from '@salesforce/schema/User.EmailPreferencesStayInTouchReminder';

const COLUMNS = [
    { label: 'Search Name',  sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Account',  sortable: true, fieldName: "AccountLink", type: 'url', typeAttributes: {label: { fieldName: 'AccountName' }, tooltip:  { fieldName: 'AccountName' }, target: '_self'}},
    { label: 'Search Status',  sortable: true, fieldName: STATUS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Asset Class',  sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Amount',  sortable: true, fieldName: AMOUNT_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Search Winner', sortable: true, fieldName: "searchWinnerLink", type: 'url', typeAttributes: {label: { fieldName: 'searchWinner' }, tooltip:  { fieldName: 'searchWinner' }, target: '_self'}}
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

export default class SearchesRelatedToAccountViewAll extends NavigationMixin(LightningElement) {
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    @api isCommunity;

    recordLink;
    accountNameLink;
    relatedSearchesRecords;
    totalRelatedSearchesCount;
    columns = COLUMNS;
    tempAddAction = [];
    isCommunityBoolean;
    offset = 0;
    limit = 50;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    nameSortDir = this.defaultSortDirection;
    sortedBy = 'recordLink';
    plusSign = null;
    @track isLoading = false;
    infiniteLoading = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.isCommunityBoolean = this.isCommunity == 'false' ? false : true;
        // To set links for breadcrumbs
        this.setLinks();

        this.tempAddAction = COLUMNS;
        if(!this.isCommunityBoolean)
        {
            this.tempAddAction=[...this.tempAddAction,{
             type: 'action',
             typeAttributes: { rowActions: actions },
            }];
        }
        this.columns = this.tempAddAction;

        //To get count of related searches records
        getAccountRelatedSearchesCount({
            recordId: this.recordId
        }) .then (searchesRecordCount => {
            if(searchesRecordCount) {
                this.totalRelatedSearchesCount = searchesRecordCount;
            }
        })

        this.sortedBy = 'recordLink';
        var sortedField = this.sortedBy;
        if(sortedField === 'recordLink') {
            sortedField = 'Name';
        } else if(sortedField === 'AccountLink') {
            sortedField = 'Account__r.Name';
        } else if(sortedField === 'searchWinnerLink') {
            sortedField = 'Search_Winner__r.Name';
        }
        // Get related marketplace searches records
        getAllRelatedSortedSearchesRecords({
            recordId: this.recordId,
            recordLimit: this.limit,
            offset: this.offset,
            sortBy: sortedField,
            sortOrder: this.sortedDirection
        }) .then (relatedMarketplaceSearches => {
            if (relatedMarketplaceSearches) {
                var tempSearchesList = [];  
                for (var i = 0; i < relatedMarketplaceSearches.length; i++) {  
                    let tempRecord = Object.assign({}, relatedMarketplaceSearches[i]); //cloning object  
                    if(this.isCommunityBoolean)
                    {
                        tempRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempRecord.Id;
                        if( tempRecord.Account__c != undefined)
                            tempRecord.AccountLink = "/"+this.communityName+"/s/detail/" + tempRecord.Account__c;
                        if(tempRecord.Search_Winner__c != undefined)
                            tempRecord.searchWinnerLink = "/"+this.communityName+"/s/detail/" + tempRecord.Search_Winner__c;
                    }
                    else
                    {
                        tempRecord.recordLink = "/" + tempRecord.Id;
                        if( tempRecord.Account__c != undefined)
                            tempRecord.AccountLink = "/" + tempRecord.Account__c;
                        if( tempRecord.Search_Winner__c != undefined)
                            tempRecord.searchWinnerLink = "/" + tempRecord.Search_Winner__c;
                    }

                    if( tempRecord.Account__c != undefined && tempRecord.Account__r != null && tempRecord.Account__r.Name != null)
                        tempRecord.AccountName = tempRecord.Account__r.Name;
                    if( tempRecord.Search_Winner__c != undefined && tempRecord.Search_Winner__r != null && tempRecord.Search_Winner__r.Name != null)
                        tempRecord.searchWinner = tempRecord.Search_Winner__r.Name;
                    tempSearchesList.push(tempRecord);             
                }
                this.relatedSearchesRecords = tempSearchesList;
                this.offset = tempSearchesList.length; 
                this.isLoading = false;
                // For showing + sign with count
                if((this.offset) >= this.totalRelatedSearchesCount || (this.offset) == 0)
                {
                    this.plusSign = '';
                }
                else
                {
                    this.plusSign = '+';
                }
                this.infiniteLoading = false;
            }
        
        }) .catch(error => {
            this.isLoading=false;
            this.infiniteLoading = false;
            console.log("Error:" , error);
        });

        getAccountName({
            recordId : this.recordId
        }).then(returnedAccount => {
            if(returnedAccount != null)
            {
                this.recordName = returnedAccount.Name;
            }
        });
    }

    // Set breadcrumb links
    setLinks() {
        if(this.isCommunityBoolean) {  
            this.recordLink = "/"+this.communityName+"/s/account/" + this.recordId;
            this.accountNameLink = "/"+this.communityName + '/s/account/Account/Default';
        } else {
            this.recordLink = '/'+this.recordId;
            this.accountNameLink = '/one/one.app#/sObject/Account/list?filterName=Recent';
        }  
    }

    handleEvent = event => {
        this.isLoading = true;
        this.newbuttonPressed = false;
        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.refreshTable();       
    }
    // To create new record
    createNewRecord(event) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            this.subscription = response;
        });
    
        onError(error => {
            console.error('Received error from server SF: ', error);
        });
        
        let newSearchRecord = { 
            type: 'standard__objectPage', 
            attributes: { objectApiName: 'Marketplace_Searches__c', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                defaultFieldValues:"Account__c="+this.recordId
            },
        };  
        this[NavigationMixin.Navigate](newSearchRecord);
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
            default:
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
                this.offset = 0;
                this.limit = 50;
                this.relatedSearchesRecords = null;
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
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });

        let { Id } = row;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: Id,
                actionName: 'edit'
            }
        });
    }

    // To refresh table
    refreshTable(event) {
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.relatedSearchesRecords = null;
        this.connectedCallback();
    }

    onHandleSort(event) {

        this.sortedBy = event.detail.fieldName;
        this.sortedDirection=event.detail.sortDirection;
        var sortedField = this.sortedBy;
        if(sortedField === 'recordLink') {
            sortedField = 'Name';
        } else if(sortedField === 'AccountLink') {
            sortedField = 'Account__r.Name';
        } else if(sortedField === 'searchWinnerLink') {
            sortedField = 'Search_Winner__r.Name';
        }

        // Get related marketplace searches records
        getAllRelatedSortedSearchesRecords({
            recordId: this.recordId,
            recordLimit: this.offset,
            offset: 0,
            sortBy: sortedField,
            sortOrder: this.sortedDirection
        }).then (relatedSortedMarketplaceSearches => {
            if (relatedSortedMarketplaceSearches) {
                var tempSortedSearchesList = [];  
                for (var i = 0; i < relatedSortedMarketplaceSearches.length; i++) {  
                    let tempSearchRecord = Object.assign({}, relatedSortedMarketplaceSearches[i]); //cloning object  
                    if(this.isCommunityBoolean)
                    {
                        tempSearchRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempSearchRecord.Id;
                        if( tempSearchRecord.Account__c != undefined)
                            tempSearchRecord.AccountLink = "/"+this.communityName+"/s/detail/" + tempSearchRecord.Account__c;
                        if(tempSearchRecord.Search_Winner__c != undefined)
                        tempSearchRecord.searchWinnerLink = "/"+this.communityName+"/s/detail/" + tempSearchRecord.Search_Winner__c;
                    }
                    else
                    {
                        tempSearchRecord.recordLink = "/" + tempSearchRecord.Id;
                        if( tempSearchRecord.Account__c != undefined)
                            tempSearchRecord.AccountLink = "/" + tempSearchRecord.Account__c;
                        if( tempSearchRecord.Search_Winner__c != undefined)
                        tempSearchRecord.searchWinnerLink = "/" + tempSearchRecord.Search_Winner__c;
                    }
                    if(tempSearchRecord.Account__c != undefined && tempSearchRecord.Account__r != null && tempSearchRecord.Account__r.Name != null)
                        tempSearchRecord.AccountName = tempSearchRecord.Account__r.Name;
                    if( tempSearchRecord.Search_Winner__c != undefined && tempSearchRecord.Search_Winner__r != null && tempSearchRecord.Search_Winner__r.Name != null)
                        tempSearchRecord.searchWinner = tempSearchRecord.Search_Winner__r.Name;
                    tempSortedSearchesList.push(tempSearchRecord);             
                }
                this.relatedSearchesRecords=[];
                this.relatedSearchesRecords = tempSortedSearchesList;
                this.offset = tempSortedSearchesList.length; 
                this.isLoading = false;
            }
        }) .catch(error => {
            this.isLoading=false;
        });
    }

    loadMoreData(event) {
        var sortedField = this.sortedBy;
        if(sortedField === 'recordLink') {
            sortedField = 'Name';
        } else if(sortedField === 'AccountLink') {
            sortedField = 'Account__r.Name';
        } else if(sortedField === 'searchWinnerLink') {
            sortedField = 'Search_Winner__r.Name';
        }
                
        if(this.totalRelatedSearchesCount > this.offset) {
            if (this.infiniteLoading) 
                return;
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if(this.relatedSearchesRecords != null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            getAllRelatedSortedSearchesRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset,
                sortBy: sortedField,
                sortOrder: this.sortedDirection
            }) .then (relatedMarketplaceSearches => {

                var tempSearchList = [];  
                for (var i = 0; i < relatedMarketplaceSearches.length; i++) {  
                    let tempSearchRecord = Object.assign({}, relatedMarketplaceSearches[i]); //cloning object 
                    if(this.isCommunityBoolean )
                    {
                        tempSearchRecord.recordLink = "/"+this.communityName+"/s/detail/" + tempSearchRecord.Id;
                        if( tempSearchRecord.Account__c != undefined)
                            tempSearchRecord.AccountLink = "/"+this.communityName+"/s/detail/" + tempSearchRecord.Account__c;
                        if(tempSearchRecord.Search_Winner__c != undefined)
                        tempSearchRecord.searchWinnerLink = "/"+this.communityName+"/s/detail/" + tempSearchRecord.Search_Winner__c;
                    }
                    else
                    {
                        tempSearchRecord.recordLink = "/" + tempSearchRecord.Id;
                        if( tempSearchRecord.Account__c != undefined)
                            tempSearchRecord.AccountLink = "/" + tempSearchRecord.Account__c;
                        if( tempSearchRecord.Search_Winner__c != undefined)
                        tempSearchRecord.searchWinnerLink = "/" + tempSearchRecord.Search_Winner__c;
                    }
                    if( tempSearchRecord.Account__c != undefined && tempSearchRecord.Account__r != null && tempSearchRecord.Account__r.Name != null)
                        tempSearchRecord.AccountName = tempSearchRecord.Account__r.Name;
                    if( tempSearchRecord.Search_Winner__c != undefined && tempSearchRecord.Search_Winner__r != null && tempSearchRecord.Search_Winner__r.Name != null)
                        tempSearchRecord.searchWinner = tempSearchRecord.Search_Winner__r.Name;
                    tempSearchList.push(tempSearchRecord);  
                }
             
                if(this.relatedSearchesRecords)
                    this.relatedSearchesRecords =  this.relatedSearchesRecords.concat(tempSearchList);
                if((this.offset+50) >= this.totalRelatedSearchesCount || (this.offset) == 0)
                {
                    this.offset = this.totalRelatedSearchesCount;
                    this.plusSign = '';
                } else {
                    this.offset = parseInt(this.offset ) + parseInt(this.limit);
                    this.plusSign = '+';
                }
                this.loadMoreStatus = '';
                if(this.tableElement){
                    this.tableElement.isLoading = false;
                }
                this.infiniteLoading = false;    
            }) .catch(error => {
                this.infiniteLoading = false;
                console.log("Error:" , error);
            });
        }
    }
}