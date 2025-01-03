import { LightningElement, api, wire ,track} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getAccountRelatedSearchesRecords from '@salesforce/apex/SearchesRelatedToAccountController.getAccountRelatedSearchesRecords';
import getAccountRelatedSearchesCount from '@salesforce/apex/SearchesRelatedToAccountController.getAccountRelatedSearchesCount';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Marketplace_Searches__c.Name';
import STATUS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Search_Status__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Asset_Class__c';
import AMOUNT_FIELD from '@salesforce/schema/Marketplace_Searches__c.Amount__c';

const COLUMNS = [
    { label: 'Search Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Account', sortable: true, fieldName: "AccountLink", type: 'url', typeAttributes: {label: { fieldName: 'AccountName' }, tooltip:  { fieldName: 'AccountName' }, target: '_self'}},
    { label: 'Search Status', sortable: true, fieldName: STATUS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Asset Class', sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Amount', sortable: true, fieldName: AMOUNT_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Search Winner', sortable: true, fieldName: "searchWinnerLink", type: 'url', typeAttributes: {label: { fieldName: 'searchWinner' }, tooltip:  { fieldName: 'searchWinner' }, target: '_self'}}
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

export default class SearchesRelatedToAccount extends NavigationMixin(LightningElement) {
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    @track isLoading=false;
    @api isSalesforceInstance = false;

    columns = COLUMNS;
    tempAddAction=[];
    setSelectedRows = [];
    totalRelatedSearchesCount = 0;
    relatedSearchesRecords;
    newbuttonPressed = false;
    isCommunity = false;
    offset = 0;
    limit = 10;
    plusSign = '';
    baseURL = '';
    recordToDel;
    collapsed = true;
    searchesRecordsExists = false;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = NAME_FIELD.fieldApiName;
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'FIRST';

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.checkIsCommunityInstance(); 
        this.tempAddAction = COLUMNS;
        if(!this.isCommunity)
        {
            this.tempAddAction=[...this.tempAddAction,{
             type: 'action',
             typeAttributes: { rowActions: actions },
            }];
        }
        this.columns = this.tempAddAction;

        this.sortedDirection = 'asc';
        this.sortedBy = NAME_FIELD.fieldApiName;
        this.getAccountRelatedSearchesRecords(this.recordId, this.sortedBy, this.sortedDirection);

        //To get base url of the instance
        getSFBaseUrl().then(baseURL => {
            if(baseURL) {
                this.baseURL = baseURL;
            }
        })
        .catch(error => {
            console.log("Error:" , error);
        });
    }

    // Get related marketplace searches records for account
    getAccountRelatedSearchesRecords(recordId, sortedBy, sortedDirection){
        this.isLoading = true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        getAccountRelatedSearchesRecords({
            recordId : recordId,
            sortedBy : sortedBy,
            sortOrder : sortedDirection,
            nullOrder: this.nullOrder
        }) .then (relatedMarketplaceSearches => {
            if (relatedMarketplaceSearches) {
                var tempSearchesList = [];  
                for (var i = 0; i < relatedMarketplaceSearches.length; i++) {  
                    let tempRecord = Object.assign({}, relatedMarketplaceSearches[i]); //cloning object
                    if(this.isCommunity )
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
                this.offset = this.relatedSearchesRecords.length;
                this.isLoading = false;
                if(this.offset > 0)
                {
                    this.collapsed =false;
                }
                else
                {
                    this.collapsed =true;
                }

                //To get count of related searches records
                getAccountRelatedSearchesCount({
                    recordId: this.recordId
                }) .then (searchesRecordCount => {
                    if(searchesRecordCount == 0 && this.communityName == 'dakotaMarketplace') {
                        this.searchesRecordsExists = false;
                    }
                    else {
                        this.searchesRecordsExists = true;
                    }
                    this.totalRelatedSearchesCount = searchesRecordCount;
                    if(this.offset >= this.totalRelatedSearchesCount){
                        this.plusSign = '';
                    } 
                    else {
                        this.plusSign = '+';
                    }
                }) .catch(error => {});
            }
        }) .catch(error => {
            this.isLoading=false;
        });
    }

    // To refresh table
    refreshTable(event)
    {
        this.connectedCallback();
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
    }

    createNewRecord(event) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            this.subscription = response;
        });
    
        onError(error => {
            console.error('Received error from server SF: ', error);
        });
        this.newbuttonPressed = true;
        let newSearchRecord = { 
            type: 'standard__objectPage', 
            attributes: { objectApiName: 'Marketplace_Searches__c', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                defaultFieldValues:"Account__c="+this.recordId
            },
        };  
        this[NavigationMixin.Navigate](newSearchRecord);
        this.newbuttonPressed = true;
    }

    handleEvent = event => {
    
        this.isLoading = true;
        this.newbuttonPressed = false;
        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.checkIsCommunityInstance();
        this.refreshTable();       
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

    handleShowFullRelatedList() {
        var navigationURL = this.baseURL +'/lightning/cmp/c__SearchesRelatedToAccountDataTableView?c__recordId='+this.recordId+'&c__recordName='+this.recordName+'&c__isCommunity='+ this.isCommunity;
        var url = '/view-accountrelatedsearches?recordId=' + this.recordId + '&recordName=' + this.recordName + '&isCommunity=' + this.isCommunity;

        if(this.isCommunity)
        {
            this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
        else
        {
            window.open(navigationURL,"_self");
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
        if(this.sortedBy === 'recordLink') {
            tempSortBy = 'Name';
        } else if(this.sortedBy === 'AccountLink') {
            tempSortBy =  'Account__r.Name';
        }else if(this.sortedBy === 'Search_Status__c') {
            tempSortBy = STATUS_FIELD.fieldApiName;
        }else if(this.sortedBy === 'Asset_Class__c') {
            tempSortBy = ASSET_CLASS_FIELD.fieldApiName; 
        }else if(this.sortedBy === 'Amount__c') {
            tempSortBy = AMOUNT_FIELD.fieldApiName;
        }else if(this.sortedBy === 'searchWinnerLink') {
            tempSortBy = 'Search_Winner__r.Name';
        }

        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getAccountRelatedSearchesRecords(this.recordId, tempSortBy, this.sortedDirection);
    }

}