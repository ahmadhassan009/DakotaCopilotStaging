import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import getRelatedSearcheRecordsForState from '@salesforce/apex/SearchesRelatedListController.getRelatedSearcheRecordsForState';
import getRelatedSearchesCountForState from '@salesforce/apex/SearchesRelatedListController.getRelatedSearchesCountForState';
import { refreshApex } from '@salesforce/apex';
import NAME_FIELD from '@salesforce/schema/Marketplace_Searches__c.Name';
import ACCOUNT_TYPE_FIELD from '@salesforce/schema/Marketplace_Searches__c.Account_Type__c';
import STATUS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Search_Status__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Asset_Class__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Sub_Asset_Class__c';

import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';

const COLUMNS = [{
    label: 'Search Name',
    fieldName: "recordLink",
    sortable: true,
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
    label: 'Accounts',
    fieldName: "AccountLink",
    sortable: true,
    type: 'url',
    typeAttributes: {
        label: {
            fieldName: 'AccountName'
        },
        tooltip: {
            fieldName: 'AccountName'
        },
        target: '_self'
    }
},
{
    label: 'Account Type',
    sortable: true,
    fieldName: ACCOUNT_TYPE_FIELD.fieldApiName,
    type: 'Text'
},
{
    label: 'Status',
    sortable: true,
    fieldName: STATUS_FIELD.fieldApiName,
    type: 'Picklist'
},
{
    label: 'Asset Class',
    sortable: true,
    fieldName: ASSET_CLASS_FIELD.fieldApiName,
    type: 'Picklist'
},
{
    label: 'Sub Asset Class',
    //sortable: true,
    fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName,
    type: 'Picklist'
},
{
    label: 'Search Winner',
    sortable: true,
    fieldName: "searchWinnerLink",
    type: 'url',
    typeAttributes: {
        label: {
            fieldName: 'searchWinner'
        },
        tooltip: {
            fieldName: 'searchWinner'
        },
        target: '_self'
    }
}
]

export default class MetroAreaStatesSearchesViewAll extends NavigationMixin(LightningElement) {
    @api stateName;
    isLoading = false;
    defaultSortDirection = 'asc';
    columns = COLUMNS;
    totalRelatedSearchesCount = 0;
    relatedSearchesRecords=[];
    isCommunity = false;
    sortedDirection = 'asc';
    sortedBy = 'recordLink';
    offset = 0;
    limit = 50;
    baseURL = '';
    collapsed = true;
    panelStyling;
    fromEditEvent = true;
    fromLoadMore = false;
    fromRefresh =false;
    fieldsMapping;
    plusSign = '';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.setFieldMappings();
        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);

        this.maNameLink = "/"+this.communityName + '/s/metro-area/Metro_Area__c/Default';
        this.recordLink = "/"+this.communityName + '/s/state-detail-page?stateName=' + this.stateName;
        this.checkIsCommunityInstance();
        this.getRelatedSearchesCountForState();
        this.getRelatedSearchRecordsForState();
    }

    getRelatedSearchesCountForState() {
        //To get count of related records
        getRelatedSearchesCountForState({
            state: this.stateName
        }).then(searchesRecordCount => {
            if (searchesRecordCount) {
                this.totalRelatedSearchesCount = searchesRecordCount;
            }
        }).catch(error => {});
    }

    /**
     * To fetch Marketplace Searches records for a state
     */
    getRelatedSearchRecordsForState() {
        //this.setFieldsBeforeSorting();
        // Get related marketplace searches records
        getRelatedSearcheRecordsForState({
            state: this.stateName,
            recordLimit: this.limit,
            offset: this.offset,
            sortBy: this.fieldsMapping.get(this.sortedBy),
            sortOrder: this.sortedDirection,
        }).then(relatedMarketplaceSearches => {
            if (relatedMarketplaceSearches) {
                var tempSearchesList = [];
                for (var i = 0; i < relatedMarketplaceSearches.length; i++) {
                    let tempRecord = Object.assign({}, relatedMarketplaceSearches[i]); //cloning object  
                    if (this.isCommunity) {
                        tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                        if (tempRecord.Account__c != undefined)
                            tempRecord.AccountLink = "/" + this.communityName + "/s/detail/" + tempRecord.Account__c;
                        if (tempRecord.Search_Winner__c != undefined)
                            tempRecord.searchWinnerLink = "/" + this.communityName + "/s/detail/" + tempRecord.Search_Winner__c;
                    } else {
                        tempRecord.recordLink = "/" + tempRecord.Id;
                        if (tempRecord.Account__c != undefined)
                            tempRecord.AccountLink = "/" + tempRecord.Account__c;
                        if (tempRecord.Search_Winner__c != undefined)
                            tempRecord.searchWinnerLink = "/" + tempRecord.Search_Winner__c;
                    }
                    if (tempRecord.Account__c != undefined && tempRecord.Account__r != null && tempRecord.Account__r.Name != null)
                        tempRecord.AccountName = tempRecord.Account__r.Name;
                    if (tempRecord.Search_Winner__c != undefined && tempRecord.Search_Winner__r != null && tempRecord.Search_Winner__r.Name != null)
                        tempRecord.searchWinner = tempRecord.Search_Winner__r.Name;
                    tempSearchesList.push(tempRecord);
                }
                
                if(this.offset==0){
                    this.fromRefresh = false;
                }
                this.relatedSearchesRecords = this.relatedSearchesRecords.concat(tempSearchesList);
                if ((this.offset + this.limit) >= this.totalRelatedSearchesCount ) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }
                this.offset += tempSearchesList.length;

                if(this.fromLoadMore){
                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                      }
                }
                 this.isLoading = false;
            }
        }).catch(error => {
            console.log("Error loading Marketplace Searches record ", error);
            this.isLoading = false;
        });
    }


    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }

    onHandleSort(event) {

        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;
        this.offset = 0;
        this.limit = 50;
        this.relatedSearchesRecords= [];
        this.isLoading = true;

        this.sortedBy = sortedBy
        this.sortedDirection = sortDirection;
        this.getRelatedSearchRecordsForState();

    }

    loadMoreData(event) {
        if(this.totalRelatedSearchesCount != this.offset && this.offset>0) {
            //Display a spinner to signal that data is being loaded
            if(!this.fromRefresh) {
            if(this.relatedSearchesRecords != null && event.target){
                event.target.isLoading = true;
            }

            this.tableElement = event.target;
            this.fromLoadMore = true;
            this.offset = this.relatedSearchesRecords.length;
            this.getRelatedSearchRecordsForState();
        }
        }
    }

    refreshTable(event)
    {
        this.isLoading = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.fromRefresh = true;
        this.sortedDirection = 'asc';
        this.sortedBy = 'recordLink';
        this.relatedSearchesRecords= [];
        
         var table = this.template.querySelector('lightning-datatable');
         if(table!=null)
            table.enableInfiniteLoading = true;
        return refreshApex(this.getRelatedSearchRecordsForState());
    }

    setFieldMappings() {
        this.fieldsMapping = new Map();
        this.fieldsMapping.set("recordLink", 'Name');
        this.fieldsMapping.set("AccountLink", 'Account__r.Name');
        this.fieldsMapping.set("Account_Type__c", 'Account_Type__c');
        this.fieldsMapping.set("Search_Status__c", 'Search_Status__c');
        this.fieldsMapping.set("Asset_Class__c", 'Asset_Class__c');
        this.fieldsMapping.set("Sub_Asset_Class__c", 'Sub_Asset_Class__c');
        this.fieldsMapping.set("searchWinnerLink", 'Search_Winner__r.Name');
      }

}