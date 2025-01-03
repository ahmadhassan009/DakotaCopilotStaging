import { LightningElement, api,track } from 'lwc';
import { NavigationMixin } from "lightning/navigation"
import getAllRelatedSearchesRecords from '@salesforce/apex/SearchesRelatedListController.getAllRelatedSearchesRecords';
import getRelatedSearchesCount from '@salesforce/apex/SearchesRelatedListController.getRelatedSearchesCount';
import getAllRelatedSortedSearchesRecords from '@salesforce/apex/SearchesRelatedListController.getAllRelatedSortedSearchesRecords';
import getMetroAreaNameObj from '@salesforce/apex/SearchesRelatedListController.getMetroAreaNameObj';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import activeCommunities from '@salesforce/label/c.active_communities';
import NAME_FIELD from '@salesforce/schema/Marketplace_Searches__c.Name';
import ACCOUNT_TYPE_FIELD from '@salesforce/schema/Marketplace_Searches__c.Account_Type__c';
import STATUS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Search_Status__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Asset_Class__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Sub_Asset_Class__c';

const COLUMNS = [
    { label: 'Search Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Accounts', sortable: true, fieldName: "AccountLink", type: 'url', typeAttributes: {label: { fieldName: 'AccountName' }, tooltip:  { fieldName: 'AccountName' }, target: '_self'}},
    { label: 'Account Type', sortable: true, fieldName: ACCOUNT_TYPE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Status', sortable: true, fieldName: STATUS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Asset Class', sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Sub Asset Class', fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Search Winner', sortable: true, fieldName: "searchWinnerLink", type: 'url', typeAttributes: {label: { fieldName: 'searchWinner' }, tooltip:  { fieldName: 'searchWinner' }, target: '_self'}}
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];
const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];

export default class MarketplaceSearchViewAllPanel extends NavigationMixin(LightningElement) {
    @api recordId;
    @api recordName;
    @api isCommunity;

    recordLink;
    maNameLink;
    relatedSearchesRecords
    totalRelatedSearchesCount;
    columns = COLUMNS;
    tempAddAction = [];
    isCommunityBoolean;
    offset = 0;
    limit = 50;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = 'recordLink';
    plusSign = null;
    @track isLoading=false;
    infiniteLoading = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.isCommunityBoolean = this.isCommunity == 'false' ? false : true;
        // To set links for breadcrumbs
        this.setLinks();

        this.tempAddAction = COLUMNS;
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
        this.columns = this.tempAddAction;

        //To get count of related records
        getRelatedSearchesCount({
            recordId: this.recordId
        }) .then (searchesRecordCount => {
            if(searchesRecordCount) {
                this.totalRelatedSearchesCount = searchesRecordCount;
            }
        })

        if (this.sortedBy == 'recordLink') {
            this.sortedBy = 'Name';
        }

        // Get related marketplace searches records
        getAllRelatedSortedSearchesRecords({
            recordId: this.recordId,
            recordLimit: this.limit,
            offset: this.offset,
            sortBy: this.sortedBy,
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
                    if(tempSearchRecord.Search_Winner__c != undefined && tempSearchRecord.Search_Winner__r != null && tempSearchRecord.Search_Winner__r.Name != null)
                        tempSearchRecord.searchWinner = tempSearchRecord.Search_Winner__r.Name;
                    tempSortedSearchesList.push(tempSearchRecord);             
                }
                this.relatedSearchesRecords = tempSortedSearchesList;
                this.offset = tempSortedSearchesList.length; 
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
            }
            this.infiniteLoading = false;
        }) .catch(error => {
            this.infiniteLoading = false;
            this.isLoading=false;
            console.log("Error:" , error);
        });

        if (this.sortedBy == 'Name') {
            this.sortedBy = 'recordLink';
        }
        
        getMetroAreaNameObj({
            recordId : this.recordId
        }).then(returnedMetroArea => {
            
            if(returnedMetroArea != null)
            {
                this.recordName = returnedMetroArea.Name;
            }
        });
    }

    onHandleSort(event) {

        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;

        if (sortedBy == 'recordLink') {
            this.sortedBy = 'Name';
        } else if (sortedBy == 'AccountLink') {
            this.sortedBy = 'Account__r.Name';
        } else if(sortedBy == 'searchWinnerLink') {
            this.sortedBy = 'Search_Winner__r.Name';
        } else {
            this.sortedBy = sortedBy;
        }

        this.sortedDirection = sortDirection;

        // Get related marketplace searches records
        getAllRelatedSortedSearchesRecords({
            recordId: this.recordId,
            recordLimit: this.offset,
            offset: 0,
            sortBy: this.sortedBy,
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
                    if(tempSearchRecord.Search_Winner__c != undefined && tempSearchRecord.Search_Winner__r != null && tempSearchRecord.Search_Winner__r.Name != null)
                        tempSearchRecord.searchWinner = tempSearchRecord.Search_Winner__r.Name;
                    tempSortedSearchesList.push(tempSearchRecord);             
                }
                this.relatedSearchesRecords = tempSortedSearchesList;
                this.offset = tempSortedSearchesList.length; 
                this.isLoading = false;
            }
        }) .catch(error => {
            this.isLoading=false;
        });

        if (this.sortedBy == 'Name') {
            this.sortedBy = 'recordLink';
        } else if(this.sortedBy == 'Account__r.Name') {
            this.sortedBy = 'AccountLink';
        } else if(this.sortedBy == 'Search_Winner__r.Name') {
            this.sortedBy = 'searchWinnerLink';
        }

    }

    loadMoreData(event) {
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

            if (this.sortedBy == 'recordLink') {
                this.sortedBy = 'Name';
            } else if (this.sortedBy == 'AccountLink') {
                this.sortedBy = 'Account__r.Name';
            } else if(this.sortedBy == 'searchWinnerLink') {
                this.sortedBy = 'Search_Winner__r.Name';
            }

            getAllRelatedSortedSearchesRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset,
                sortBy: this.sortedBy,
                sortOrder: this.sortedDirection
            }).then (relatedMarketplaceSearches => {
                if (relatedMarketplaceSearches) { 
                    var tempSearchList = [];  
                    for (var i = 0; i < relatedMarketplaceSearches.length; i++) {  
                        let tempSearchRecord = Object.assign({}, relatedMarketplaceSearches[i]); //cloning object  
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
                        if(tempSearchRecord.Search_Winner__c != undefined && tempSearchRecord.Search_Winner__r != null && tempSearchRecord.Search_Winner__r.Name != null)
                            tempSearchRecord.searchWinner = tempSearchRecord.Search_Winner__r.Name;
                            tempSearchList.push(tempSearchRecord);             
                    }
                    if(this.relatedSearchesRecords)
                        this.relatedSearchesRecords =  this.relatedSearchesRecords.concat(tempSearchList);
                    if((this.offset+50) >= this.totalRelatedSearchesCount)
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
                }
            }) .catch(error => {
                this.isLoading=false;
                console.log("Error:" , error);
            });

            if (this.sortedBy == 'Name') {
                this.sortedBy = 'recordLink';
            } else if(this.sortedBy == 'Account__r.Name') {
                this.sortedBy = 'AccountLink';
            } else if(this.sortedBy == 'Search_Winner__r.Name') {
                this.sortedBy = 'searchWinnerLink';
            }

        }
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
                defaultFieldValues:"Metro_Area__c="+this.recordId
            },
        };  
        this[NavigationMixin.Navigate](newSearchRecord);
    }

    // To refresh table
    refreshTable(event) {
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.sortedDirection = 'asc';
        this.sortedBy = 'recordLink';
        this.relatedSearchesRecords = null;
        var table = this.template.querySelector('lightning-datatable');
        table.enableInfiniteLoading=true;
        this.connectedCallback();
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
        let { Id } = row;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: Id,
                actionName: 'edit'
            }
        });
    }

    // Set breadcrumb links
    setLinks() {
        if(this.isCommunityBoolean) {  
            this.recordLink = "/"+this.communityName+"/s/metro-area/" + this.recordId;
            this.maNameLink = "/"+this.communityName + '/s/metro-area/Metro_Area__c/Default';
        } else {
            this.recordLink = '/'+this.recordId;
            this.maNameLink = '/one/one.app#/sObject/Metro_Area__c/list?filterName=Recent';
        }  
    }

}