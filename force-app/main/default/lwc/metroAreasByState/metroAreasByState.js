import {
    LightningElement,
    api
} from 'lwc';
import getAllMetroAreasByState from '@salesforce/apex/MetroAreaListViewController.getAllMetroAreasByState';
import getCountMetroAreasByState from '@salesforce/apex/MetroAreaListViewController.getCountMetroAreasByState';
import activeCommunities from '@salesforce/label/c.active_communities';
import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';
import {
    loadStyle
} from 'lightning/platformResourceLoader';


const COLUMNS = [{
        label: "State Name",
        sortable: true,
        fieldName: "StateLink",
        type: "url",
        hideDefaultActions: true,
        typeAttributes: {
            label: {
                fieldName: 'StateName'
            },
            tooltip: {
                fieldName: 'StateName'
            },
            target: '_parent'
        },
    },
    {
        label: "Number of Accounts",
        sortable: true,
        fieldName: "numOfAccount",
        type: "Text",
        hideDefaultActions: true
    },
    {
        label: "Number of Metro Areas",
        fieldName: "NumOfMetroAreas",
        type: "Text",
        sortable: true,
        hideDefaultActions: true
    }
]

export default class MetroAreasByState extends LightningElement {

    currentCountry;
    columns = COLUMNS;
    isLoading = true;
    recordsExist = true;
    stateRecords;
    offset = 0;
    limit = 40;
    sortDirection = 'desc';
    sortedBy = 'numOfAccount';
    sortBy = 'SUM(Sort_order__c)';
    defaultSortDirection = 'desc';
    nameSortDir = this.defaultSortDirection;
    totalStateRecords;
    fromLoadMore = false;
    infiniteLoading = false;
    searchList = [];
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    isSearched = false;
    changeHighlighted = false;
    datainit = true;
    @api 
    updateSelectedCountery(value) {
        this.searchList =[];
        this.currentCountry = value;
        this.offset = 0;
        this.setInitialState();
    }

    @api
    changeMessage(strString) {
       this.searchList = strString;
       this.isLoading = true;
        this.offset = 0;
        this.limit = 40;
        this.sortDirection = 'desc';
        this.stateRecords = [];
        this.isSearched = true;
       this.getMetroAreasByState();
    }

    setInitialState() {
        this.isLoading = true;
        this.offset = 0;
        this.limit = 40;
        this.sortDirection = 'desc';
        this.stateRecords = [];
        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.getMetroAreasByState();
    }

    getMetroAreasByState() {
        if(this.isSearched) {
            this.currentCountry ='All';
            this.isSearched =false;
        }
        getCountMetroAreasByState({
            searchList:this.searchList,
                activeCountry: this.currentCountry
            })
            .then((totalCount) => {
                this.totalStateRecords = totalCount;
                getAllMetroAreasByState({
                    searchList:this.searchList,
                    activeCountry: this.currentCountry,
                    sortDirection: this.sortDirection,
                    offset: this.offset,
                    recLimit: this.limit,
                    sortedBy: this.sortBy
                }).then((returnedStateData) => {
                    if (returnedStateData.length > 0) {
                        var tempList = [];
                        for (var i = 0; i < returnedStateData.length; i++) {
                            let temObj = Object.assign({}, returnedStateData[i]);
                            temObj.StateName = returnedStateData[i].StateName;
                            temObj.StateLink = "/" + this.communityName + "/s/state-detail-page?stateName=" + returnedStateData[i].StateName
                            temObj.NumOfMetroAreas = returnedStateData[i].CountofMA;
                            tempList.push(temObj);
                        }

                        this.stateRecords = this.stateRecords.concat(tempList);
                        this.offset += tempList.length;
                        this.infiniteLoading = false;
                        if(this.fromLoadMore){
                            this.fromLoadMore = false;
                            if (this.tableElement) {
                                this.tableElement.isLoading = false;
                            }
                        }
                        this.recordsExist = true;
                        //Fire event for parent component
                        this.dispatchEvent(new CustomEvent('totalstatecount', {
                            detail: {
                                offset: this.offset,
                                totalRecords: this.totalStateRecords
                            }
                        }));
                    } else {
                        this.recordsExist = false;
                        this.dispatchEvent(new CustomEvent('dataloaded', {
                            detail: {
                                isloaded: false,
                            }
                        }));
                    }
                    this.isLoading = false;
                }).catch((error) => {
                    this.isLoading = false;
                    console.log('Error while fetching states : ', error);
                });
                //this.isLoading = false;
            })
            .catch((error) => {
                this.isLoading = false;
                console.log('Error in fetching total number of states : ', error);
            });
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        const recordId = event.detail.row.Id;

        if (actionName == 'StateCell') {
            //Fire event for parent component
            this.dispatchEvent(new CustomEvent('selectedstate', {
                detail: JSON.parse(JSON.stringify(row))
            }));
        }

    }

    onHandleSort(event) {
        this.isLoading = true;
        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;
        this.sortedBy = sortedBy;

        if (sortedBy == 'StateLink') {
            this.sortBy = 'State__c';
        }
        if(sortedBy == 'NumOfMetroAreas') {
            this.sortBy = 'COUNT(Id)';
        }
        if(sortedBy == 'numOfAccount') {
            this.sortBy = 'SUM(Sort_order__c)';
        }

        //Setting limit & offset so that all loaded data is sorted
        this.limit = this.offset;
        this.offset = 0;

        this.sortDirection = sortDirection;
        this.nameSortDir = sortDirection;
        this.stateRecords = [];

        this.getMetroAreasByState();
    }

    loadMoreData(event) {
        if (this.totalStateRecords > this.stateRecords.length) {
            this.isLoading = true;

            if(this.infiniteLoading) {
                return;
            }
            if (this.stateRecords != null && event.target) {
                event.target.isLoading = false;
            }
            this.tableElement = event.target;
            this.infiniteLoading = true;
            this.fromLoadMore = true;
            this.getMetroAreasByState();
        }
    }
}