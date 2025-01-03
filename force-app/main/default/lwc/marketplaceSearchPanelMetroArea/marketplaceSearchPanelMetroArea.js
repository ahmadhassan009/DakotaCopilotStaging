import { LightningElement, api, wire ,track} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getRelatedSearchesRecords from '@salesforce/apex/SearchesRelatedListController.getRelatedSearchesRecords';
import getRelatedSearchesCount from '@salesforce/apex/SearchesRelatedListController.getRelatedSearchesCount';
import getAllRelatedSearchesRecords from '@salesforce/apex/SearchesRelatedListController.getAllRelatedSearchesRecords';
import getMetroAreaName from '@salesforce/apex/SearchesRelatedListController.getMetroAreaName';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Marketplace_Searches__c.Name';
import ACCOUNT_TYPE_FIELD from '@salesforce/schema/Marketplace_Searches__c.Account_Type__c';
import STATUS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Search_Status__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Asset_Class__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Sub_Asset_Class__c';

const COLUMNS = [
    { label: 'Search Name', fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Accounts', fieldName: "AccountLink", type: 'url', typeAttributes: {label: { fieldName: 'AccountName' }, tooltip:  { fieldName: 'AccountName' }, target: '_self'}},
    { label: 'Account Type', fieldName: ACCOUNT_TYPE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Status', fieldName: STATUS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Asset Class', fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Sub Asset Class', fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Search Winner', fieldName: "searchWinnerLink", type: 'url', typeAttributes: {label: { fieldName: 'searchWinner' }, tooltip:  { fieldName: 'searchWinner' }, target: '_self'}}
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];
const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];

export default class MarketplaceSearchPanelMetroArea extends NavigationMixin(LightningElement) {
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
    plusSign = '+';
    baseURL = '';
    recordToDel;
    collapsed = true;
    panelStyling;
    fromEditEvent = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    @api
    clearAll()
    {
        this.setSelectedRows = [];
    }

    chevronButtonClicked()
    {
        this.collapsed = !this.collapsed;
    } 

    connectedCallback() {
        this.isLoading = true;
        this.checkIsCommunityInstance(); 
        this.tempAddAction = COLUMNS;
        if(this.isCommunity)
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

        // Get related marketplace searches records
        getRelatedSearchesRecords({
            recordId: this.recordId
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
                    if(tempRecord.Search_Winner__c != undefined && tempRecord.Search_Winner__r != null && tempRecord.Search_Winner__r.Name != null)
                        tempRecord.searchWinner = tempRecord.Search_Winner__r.Name;
                    tempSearchesList.push(tempRecord);             
                }
                this.relatedSearchesRecords = tempSearchesList;
                this.offset = tempSearchesList.length; 
                this.isLoading = false;
            }
        }) .catch(error => {
            this.isLoading=false;
        });

        //To get count of related records
        getRelatedSearchesCount({
            recordId: this.recordId
        }) .then (searchesRecordCount => {
            if (searchesRecordCount) {
                this.totalRelatedSearchesCount = searchesRecordCount;

                //To set panel height based total number of records 
                if (this.totalRelatedSearchesCount >= 10) {
                    this.panelStyling = 'height : 305px;';
                }
                else if (this.totalRelatedSearchesCount == 1) {
                    this.panelStyling = 'height : 62px;';
                }
                else if (this.totalRelatedSearchesCount == 2) {
                    this.panelStyling = 'height : 90px;';
                }
                else if (this.totalRelatedSearchesCount == 3) {
                    this.panelStyling = 'height : 115px;';
                }
                else if (this.totalRelatedSearchesCount == 4) {
                    this.panelStyling = 'height : 142px;';
                }
                else if (this.totalRelatedSearchesCount == 5) {
                    this.panelStyling = 'height : 170px;';
                }
                else if (this.totalRelatedSearchesCount == 6) {
                    this.panelStyling = 'height : 196px;';
                }
                else if (this.totalRelatedSearchesCount == 7) {
                    this.panelStyling = 'height : 225px;';
                }
                else if (this.totalRelatedSearchesCount == 8) {
                    this.panelStyling = 'height : 250px;';
                }
                else if (this.totalRelatedSearchesCount == 9) {
                    this.panelStyling = 'height : 280px;';
                }
            }
        }).catch(error => { });

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

    loadMoreData(event) {
        if(this.totalRelatedSearchesCount > this.offset && this.newbuttonPressed == false) {
            //Display a spinner to signal that data is being loaded
            if(this.relatedSearchesRecords != null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            getAllRelatedSearchesRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset
            }).then(relatedMarketplaceSearches => {
                var tempSearchList = [];
                for (var i = 0; i < relatedMarketplaceSearches.length; i++) {
                    let tempSearchRecord = Object.assign({}, relatedMarketplaceSearches[i]); //cloning object 
                    if (this.isCommunity) {
                        tempSearchRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempSearchRecord.Id;
                        if (tempSearchRecord.Account__c != undefined)
                            tempSearchRecord.AccountLink = "/" + this.communityName + "/s/detail/" + tempSearchRecord.Account__c;
                        if(tempSearchRecord.Search_Winner__c != undefined)
                            tempSearchRecord.searchWinnerLink = "/"+this.communityName+"/s/detail/" + tempSearchRecord.Search_Winner__c;
                    }
                    else {
                        tempSearchRecord.recordLink = "/" + tempSearchRecord.Id;
                        if (tempSearchRecord.Account__c != undefined)
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

                if (this.relatedSearchesRecords)
                    this.relatedSearchesRecords = this.relatedSearchesRecords.concat(tempSearchList);
                if ((this.offset + 10) >= this.totalRelatedSearchesCount) {
                    this.offset = this.totalRelatedSearchesCount;
                    this.plusSign = '';
                } else {
                    this.offset = parseInt(this.offset) + parseInt(this.limit);
                    this.plusSign = '+';
                }

                this.loadMoreStatus = '';
                if (this.tableElement) {
                    this.tableElement.isLoading = false;
                }
            }).catch(error => {
                console.log("Error:", error);
            });
        }
    }

    get recordSearchCountCondition() {
        if(this.totalRelatedSearchesCount == 10 )
        {
            return false;
        }

        if(this.totalRelatedSearchesCount > 10) {
            return true;
        } else {
            return false
        }
    }

    handleEvent = event => {
    
        this.isLoading = true;
        this.newbuttonPressed = false;
        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.checkIsCommunityInstance();
        this.fromEditEvent = true;
        this.refreshTable();       
    }
    
    /**
     * DSC-42
     * @param {*} event 
     */
    createNewRecord(event) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
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
                defaultFieldValues:"Metro_Area__c="+this.recordId
            },
        };  
        this[NavigationMixin.Navigate](newSearchRecord);
        this.newbuttonPressed = true;
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
    }

    //Handler for search record selected
    searchRecordSelected(event) {
        const selectedRows = event.detail.selectedRows;
        // Display that fieldName of the selected rows
        var arrayToPassToParent = [];       
        for (let i = 0; i < selectedRows.length; i++) {
            arrayToPassToParent.push({recordId : selectedRows[i].Id, entity : 'Marketplace_Searches__c'});
        }
        const selectedEvent = new CustomEvent("selectedsearchesma", {
            detail : arrayToPassToParent    
        })
        this.dispatchEvent(selectedEvent);   
    }

    // To refresh table
    refreshTable(event)
    {
	if(!this.fromEditEvent)
        {
            var table = this.template.querySelector('lightning-datatable');
            if(table!=null)
                table.enableInfiniteLoading = true;
        }
        this.fromEditEvent = false;
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

    @wire(getMetroAreaName, {recordId:'$recordId'})
    loadMetroAreaName (metroAreaName) {
        if(metroAreaName.data) {
            this.recordName = metroAreaName.data;
        }
    }

    handleShowFullRelatedList() {
        var navigationURL = this.baseURL +'/lightning/cmp/c__SearchesRelatedToMaDataTableView?c__recordId='+this.recordId+'&c__recordName='+this.recordName+'&c__isCommunity='+ this.isCommunity;
        var url = '/view-marketplacesearches?recordId=' + this.recordId + '&recordName=' + this.recordName + '&isCommunity=' + this.isCommunity;

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
}