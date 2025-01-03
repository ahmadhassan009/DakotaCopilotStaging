import {
    LightningElement,
    api,
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getRelatedSearcheRecordsForState from '@salesforce/apex/SearchesRelatedListController.getRelatedSearcheRecordsForState';
import getRelatedSearchesCountForState from '@salesforce/apex/SearchesRelatedListController.getRelatedSearchesCountForState';
import NAME_FIELD from '@salesforce/schema/Marketplace_Searches__c.Name';
import ACCOUNT_TYPE_FIELD from '@salesforce/schema/Marketplace_Searches__c.Account_Type__c';
import STATUS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Search_Status__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Asset_Class__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Sub_Asset_Class__c';

const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];
const COLUMNS = [{
        label: 'Search Name',
        fieldName: "recordLink",
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
        fieldName: ACCOUNT_TYPE_FIELD.fieldApiName,
        type: 'Text'
    },
    {
        label: 'Status',
        fieldName: STATUS_FIELD.fieldApiName,
        type: 'Picklist'
    },
    {
        label: 'Asset Class',
        fieldName: ASSET_CLASS_FIELD.fieldApiName,
        type: 'Picklist'
    },
    {
        label: 'Sub Asset Class',
        fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName,
        type: 'Picklist'
    },
    {
        label: 'Search Winner',
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
    },
    {
        type: 'action',
        typeAttributes: { rowActions: noActions },
    }
]

export default class MetroAreaStatesMarketplaceSearches extends NavigationMixin(LightningElement) {
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api stateName;
    relatedSearchesRecords = [];
    columns = COLUMNS;
    isLoading = false;
    isCommunity = false;
    offset = 0;
    limit = 10;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = 'Name';
    totalRelatedSearchesCount = 0;
    panelStyling;
    baseURL = '';


    setSelectedRows = [];

    newbuttonPressed = false;
    plusSign = '+';
    recordToDel;
    collapsed = true;
    fromEditEvent = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    @api
    clearAll() {
        this.setSelectedRows = [];
    }

    chevronButtonClicked() {
        this.collapsed = !this.collapsed;
        this.relatedSearchesRecords = [];
        this.offset=0;
        if(!this.collapsed) {
            this.getRelatedSearchRecordsForState();
        }
    }

    connectedCallback() {
        this.isLoading = true;
        this.checkIsCommunityInstance();
        this.getRelatedSearchesCountForState();


        //To get base url of the instance
        getSFBaseUrl().then(baseURL => {
                if (baseURL) {
                    this.baseURL = baseURL;
                }
            })
            .catch(error => {
                console.log("Error:", error);
            });
    }

    /**
     * 
     */
    getRelatedSearchesCountForState() {
        //To get count of related records
        getRelatedSearchesCountForState({
            state: this.stateName
        }).then(searchesRecordCount => {
            if (searchesRecordCount) {
                this.totalRelatedSearchesCount = searchesRecordCount;

                //To set panel height based total number of records 
                if (this.totalRelatedSearchesCount >= 10) {
                    this.panelStyling = 'height : 305px;';
                } else if (this.totalRelatedSearchesCount == 1) {
                    this.panelStyling = 'height : 62px;';
                } else if (this.totalRelatedSearchesCount == 2) {
                    this.panelStyling = 'height : 90px;';
                } else if (this.totalRelatedSearchesCount == 3) {
                    this.panelStyling = 'height : 115px;';
                } else if (this.totalRelatedSearchesCount == 4) {
                    this.panelStyling = 'height : 142px;';
                } else if (this.totalRelatedSearchesCount == 5) {
                    this.panelStyling = 'height : 170px;';
                } else if (this.totalRelatedSearchesCount == 6) {
                    this.panelStyling = 'height : 196px;';
                } else if (this.totalRelatedSearchesCount == 7) {
                    this.panelStyling = 'height : 225px;';
                } else if (this.totalRelatedSearchesCount == 8) {
                    this.panelStyling = 'height : 250px;';
                } else if (this.totalRelatedSearchesCount == 9) {
                    this.panelStyling = 'height : 280px;';
                }
            }
        }).catch(error => {});
    }

    /**
     * To fetch Marketplace Searches records for a state
     */
    getRelatedSearchRecordsForState() {
        this.isLoading = true;
        // Get related marketplace searches records
        getRelatedSearcheRecordsForState({
            state: this.stateName,
            recordLimit: this.limit,
            offset: this.offset,
            sortBy: this.sortedBy,
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
                this.relatedSearchesRecords = tempSearchesList;
                this.offset = tempSearchesList.length;
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

    handleShowFullRelatedList() {
        var url = '/metro-area-state-view-all?stateName=' + this.stateName + '&objectName=Marketplace_Searches__c';
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
    }
}