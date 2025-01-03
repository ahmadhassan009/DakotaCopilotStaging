import { LightningElement, wire, api, track } from 'lwc';
import fetchManagerPresentationRecords from '@salesforce/apex/ManagerPresentationController.fetchManagerPresentationRecords';
import getPublicDistributionURL from '@salesforce/apex/ManagerPresentationController.getPublicDistributionURL';
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import managerPresentationDatatableCss from '@salesforce/resourceUrl/managerPresentationDatatableCss';
// importing navigation service
import { NavigationMixin } from 'lightning/navigation';

const columns = [
    { label: "Manager Presentation Name", fieldName: "DistributionPublicUrl", hideDefaultActions: true, type: "url", typeAttributes: { label: { fieldName: 'Name' }, target: '_self',tooltip: { fieldName: 'Name' }}, sortable: "true"},
    { label: "Type", fieldName: "Type", type: "text", hideDefaultActions: true, sortable: "true"},
    { label: "Account Name", fieldName: "AccountName", type: "text", hideDefaultActions: true, sortable: "true"},
    { label: "Public Plan Minute", fieldName: "PublicPlanMinuteId", type: "url", typeAttributes: { label: { fieldName: 'PublicPlanMinuteName' }, target: '_self', tooltip: { fieldName: 'PublicPlanMinuteName' }}, hideDefaultActions: true, sortable: "true"},
    { label: "Investment Strategy", fieldName: "InvestmentStrategyId", type: "url", typeAttributes: { label: { fieldName: 'InvestmentStrategyName' }, target: '_self', tooltip: { fieldName: 'InvestmentStrategyName' }}, hideDefaultActions: true, sortable: "true"},
    { label: "Asset Class", fieldName: "AssetClass", type: "text", hideDefaultActions: true, sortable: "true"},
    { label: "Sub-Asset Class", fieldName: "SubAssetClass", type: "text", hideDefaultActions: true, sortable: "true"},
    { label: "Meeting Date", fieldName: "MeetingDate", type: "date-local", typeAttributes: { day: "numeric", month: "numeric", year: "numeric" }, hideDefaultActions: true, sortable: "true"},
];

export default class ManagerPresentation extends NavigationMixin( LightningElement ) {
    isLoading = true;
    managerPresentationRecords;
    allRecords;
    mpRecordsExists = false;
    @api portalType;
    columns = columns;
    totalNumberOfRows;
    currentCount = 0;
    limit=20;
    offset=0;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    isCommunity = false;
    isLoadMore = false;
    @track sortBy = 'MeetingDate';
    @track sortDirection = 'desc';

    connectedCallback(){
        Promise.all([
            loadStyle(this, managerPresentationDatatableCss)
        ]);
        this.isLoading = true;
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        fetchManagerPresentationRecords({
            searchValue : ''
        }).then(returnedManagerPresentationRecords => {
            if(returnedManagerPresentationRecords) {
                this.allRecords = returnedManagerPresentationRecords;
                this.totalNumberOfRows = this.allRecords.length;
                var tempList = []; 
                var contentIds = []; 
                var recslength = this.allRecords.length;
                if(recslength > this.limit)
                    recslength = this.limit;
                for (var i = 0; i < recslength; i++) 
                {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.Name = this.allRecords[i].Name;
                    temObj.AccountName = this.allRecords[i].AccountName;
                    temObj.AssetClass = this.allRecords[i].AssetClass;
                    temObj.SubAssetClass = this.allRecords[i].SubAssetClass;
                    temObj.MeetingDate = this.allRecords[i].MeetingDate;
                    temObj.PostedDate = this.allRecords[i].PostedDate;
                    temObj.ContentDocumentId = this.allRecords[i].ContentDocumentId;
                    if (this.isCommunity) {
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPlanMinuteId = this.allRecords[i].PublicPlanMinuteId != undefined && this.allRecords[i].PublicPlanMinuteId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].PublicPlanMinuteId : null;
                    }
                    else {
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPlanMinuteId = this.allRecords[i].PublicPlanMinuteId != undefined && this.allRecords[i].PublicPlanMinuteId != null ?"/" + this.allRecords[i].PublicPlanMinuteId : null;
                    }
                    tempList.push(temObj);
                    contentIds.push(this.allRecords[i].ContentDocumentId);
                }

                getPublicDistributionURL({
                    contentDocumentIds : JSON.stringify(contentIds)
                }).then(returnedMap => {
                    tempList.forEach((element, index) => {
                        var contentDocId = element.ContentDocumentId;
                        element.DistributionPublicUrl = returnedMap[contentDocId];
                    });
                    this.managerPresentationRecords = tempList;
                    this.currentCount = recslength;
                    if(this.allRecords.length > 0) 
                    {
                        this.managerPresentationRecords = tempList;
                        this.mpRecordsExists = true;
                        this.offset = recslength;
                    }
                    else {
                        this.mpRecordsExists = false;
                    }
                    this.isLoading = false;
                }).catch(error => {
                    this.isLoading = false;
                    console.log(error);
                });
            }
        }).catch(error => {
            this.isLoading = false;
            console.log(error);
        });
    }
    
    fetchSearchResults(event){
        this.isLoading = true;
        this.limit = 20;
        this.sortBy = 'MeetingDate';
        this.sortDirection ='desc';
        var searchValue = this.template.querySelector('[data-id="searchValue"]').value;

        if(searchValue!=null && searchValue!='')
            searchValue = searchValue.trim();
        this.managerPresentationRecords = [];
        fetchManagerPresentationRecords({
            searchValue : searchValue
        }).then(returnedManagerPresentationRecords => {
            if(returnedManagerPresentationRecords) {
                this.allRecords = returnedManagerPresentationRecords;
                this.totalNumberOfRows = this.allRecords.length;
                var tempList = []; 
                var contentIds = []; 
                var recslength = this.allRecords.length;
                if(recslength > this.limit)
                    recslength = this.limit;
                for (var i = 0; i < recslength; i++) 
                {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.Name = this.allRecords[i].Name;
                    temObj.AccountName = this.allRecords[i].AccountName;
                    temObj.AssetClass = this.allRecords[i].AssetClass;
                    temObj.SubAssetClass = this.allRecords[i].SubAssetClass;
                    temObj.MeetingDate = this.allRecords[i].MeetingDate;
                    temObj.PostedDate = this.allRecords[i].PostedDate;
                    temObj.ContentDocumentId = this.allRecords[i].ContentDocumentId;

                    if (this.isCommunity) {
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPlanMinuteId = this.allRecords[i].PublicPlanMinuteId != undefined && this.allRecords[i].PublicPlanMinuteId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].PublicPlanMinuteId : null;
                    }
                    else {
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPlanMinuteId = this.allRecords[i].PublicPlanMinuteId != undefined && this.allRecords[i].PublicPlanMinuteId != null ?"/" + this.allRecords[i].PublicPlanMinuteId : null;
                    }
                    tempList.push(temObj);
                    contentIds.push(this.allRecords[i].ContentDocumentId);
                }

                getPublicDistributionURL({
                    contentDocumentIds : JSON.stringify(contentIds)
                }).then(returnedMap => {
                    tempList.forEach((element, index) => {
                        var contentDocId = element.ContentDocumentId;
                        element.DistributionPublicUrl = returnedMap[contentDocId];
                    });
                    this.currentCount = recslength;
                    if(this.allRecords.length > 0) 
                    {
                        this.managerPresentationRecords = tempList;
                        this.mpRecordsExists = true;
                        this.offset = recslength;
                    }
                    else {
                        this.mpRecordsExists = false;
                    }
                    this.isLoading = false;
                }).catch(error => {
                    this.isLoading = false;
                    console.log(error);
                });
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    searchManagerPrestOnEnter(event) {
        if (event.keyCode == 13) {
            this.isLoading = true;
            this.fetchSearchResults(event);
        }
    }

    resetFilters(event) {
        this.template.querySelector('[data-id="searchValue"]').value = '';
        this.totalNumberOfRows = 0;
        this.limit = 20;
        this.offset = 0;
        this.sortBy = 'MeetingDate';
        this.sortDirection ='desc';
        this.connectedCallback();
    }

    loadMoreData(event){
        this.isLoadMore = true;
        if(this.offset < this.totalNumberOfRows)
        {
            if(this.managerPresentationRecords!=null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            if(this.allRecords.length > this.managerPresentationRecords.length)
            {
                var tempList = [];  
                var contentIds = []; 
                var recslength = parseInt(this.offset ) + parseInt(this.limit);
                if(recslength > this.allRecords.length)
                    recslength = this.allRecords.length;
                for (var i = this.offset; i < recslength; i++) 
                {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.Name = this.allRecords[i].Name;
                    temObj.AccountName = this.allRecords[i].AccountName;
                    temObj.AssetClass = this.allRecords[i].AssetClass;
                    temObj.SubAssetClass = this.allRecords[i].SubAssetClass;
                    temObj.MeetingDate = this.allRecords[i].MeetingDate;
                    temObj.PostedDate = this.allRecords[i].PostedDate;
                    temObj.ContentDocumentId = this.allRecords[i].ContentDocumentId;
                    if (this.isCommunity) {
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPlanMinuteId = this.allRecords[i].PublicPlanMinuteId != undefined && this.allRecords[i].PublicPlanMinuteId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].PublicPlanMinuteId : null;
                    }
                    else {
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPlanMinuteId = this.allRecords[i].PublicPlanMinuteId != undefined && this.allRecords[i].PublicPlanMinuteId != null ?"/" + this.allRecords[i].PublicPlanMinuteId : null;
                    }
                    tempList.push(temObj);
                    contentIds.push(this.allRecords[i].ContentDocumentId);
                }

                getPublicDistributionURL({
                    contentDocumentIds : JSON.stringify(contentIds)
                }).then(returnedMap => {
                    tempList.forEach((element, index) => {
                        var contentDocId = element.ContentDocumentId;
                        element.DistributionPublicUrl = returnedMap[contentDocId];
                    });
                    if(this.managerPresentationRecords)
                        this.managerPresentationRecords =  this.managerPresentationRecords.concat(tempList);
                    if((this.offset+(this.limit)) >= this.totalNumberOfRows)
                    {
                        this.offset = this.totalNumberOfRows;
                    } else
                    {
                        this.offset = parseInt(this.offset ) + parseInt(this.limit);
                    }
                    this.currentCount = this.offset;
                    if(this.tableElement){
                        this.tableElement.isLoading = false;
                    } 
                }).catch(error => {
                    this.isLoading = false;
                    console.log(error);
                });
            }
        }
    }

    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        this.isLoading = true;
        let parseData = JSON.parse(JSON.stringify(this.allRecords));
        if(fieldname == 'DistributionPublicUrl')
        {
            fieldname = 'Name';
        } else if (fieldname == 'InvestmentStrategyId') {
            fieldname = 'InvestmentStrategyName';
        } else if (fieldname == 'PublicPlanMinuteId') {
            fieldname = 'PublicPlanMinuteName';
        }

        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };

        // checking reverse direction
        let isReverse = direction === 'asc' ? 1: -1;
        // sorting data

        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x).toLowerCase() : ''; // handling null values
            y = keyValue(y) ? keyValue(y).toLowerCase() : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });

        this.allRecords = parseData;
        this.managerPresentationRecords = [];
        var tempList = [];
        var contentIds = [];
        this.limit = 20;
        this.offset = 0;
        var recslength = this.allRecords.length;
        if(recslength > this.limit)
            recslength = this.limit;

        for(let i = 0; i < recslength; i++)
        {
            let temObj = Object.assign({}, parseData[i]);
            temObj.Name = parseData[i].Name;
            temObj.DistributionPublicUrl = parseData[i].DistributionPublicUrl;
            temObj.AccountName = parseData[i].AccountName;
            temObj.AssetClass = parseData[i].AssetClass;
            temObj.SubAssetClass = parseData[i].SubAssetClass;
            temObj.MeetingDate = parseData[i].MeetingDate;
            temObj.PostedDate = parseData[i].PostedDate;
            temObj.ContentDocumentId = parseData[i].ContentDocumentId;
            if (this.isCommunity) {
                temObj.InvestmentStrategyId = parseData[i].InvestmentStrategyId != undefined && parseData[i].InvestmentStrategyId != null ?"/" + this.communityName + "/s/detail/" + parseData[i].InvestmentStrategyId : null;
                temObj.PublicPlanMinuteId = parseData[i].PublicPlanMinuteId != undefined && parseData[i].PublicPlanMinuteId != null ?"/" + this.communityName + "/s/detail/" + parseData[i].PublicPlanMinuteId : null;
            }
            else {
                temObj.InvestmentStrategyId = parseData[i].InvestmentStrategyId != undefined && parseData[i].InvestmentStrategyId != null ?"/" + parseData[i].InvestmentStrategyId : null;
                temObj.PublicPlanMinuteId = parseData[i].PublicPlanMinuteId != undefined && parseData[i].PublicPlanMinuteId != null ?"/" + parseData[i].PublicPlanMinuteId : null;
            }
            tempList.push(temObj);
            contentIds.push(parseData[i].ContentDocumentId);
        }

        getPublicDistributionURL({
            contentDocumentIds : JSON.stringify(contentIds)
        }).then(returnedMap => {
            tempList.forEach((element, index) => {
                var contentDocId = element.ContentDocumentId;
                element.DistributionPublicUrl = returnedMap[contentDocId];
            });
            this.managerPresentationRecords = tempList;
            this.currentCount = recslength;
            if(this.allRecords.length > 0) 
            {
                this.managerPresentationRecords = tempList;
                this.mpRecordsExists = true;
                this.offset = recslength;
            }
            else {
                this.mpRecordsExists = false;
            }
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            console.log(error);
        });
    }
}