import { LightningElement, api, track } from 'lwc';
import getFeeScheduleRecords from '@salesforce/apex/FeeScheduleWithoutDocuments.getFeeScheduleRecords';
import getAccountName from '@salesforce/apex/FeeScheduleWithoutDocuments.getAccountName';
import activeCommunities from '@salesforce/label/c.active_communities';
import managerPresentationsRelatedToAccount from '@salesforce/resourceUrl/managerPresentationsRelatedToAccount';
import { loadStyle } from 'lightning/platformResourceLoader';

const columns = [
    { label: "Fee Schedule Name", fieldName: "Id", type: "url", typeAttributes: { label: { fieldName: 'FeeScheduleName' }, target: '_self'}, sortable: "true"},
    { label: "Pension Name", fieldName: "PublicPensionId", type: "url", typeAttributes: { label: { fieldName: 'PublicPensionName' }, target: '_self'}, sortable: "true"},
    { label: "Investment Strategy", fieldName: "InvestmentStrategyId", type: "url", typeAttributes: { label: { fieldName: 'InvestmentStrategyName' }, target: '_self'}, sortable: "true"},
    { label: "Account Name", fieldName: "AccountId", type: "url", typeAttributes: { label: { fieldName: 'AccountName' }, target: '_self'}, sortable: "true"},
    { label: "Total Fee", fieldName: "TotalFee", type: "text"},
    { label: "Asset Class", fieldName: "AssetClass", type: "Picklist", sortable: "true"},
    { label: "Sub-Asset Class", fieldName: "SubAssetClass", type: "Picklist", sortable: "true"}
   ];

export default class FeeScheduleWithoutDocumentsViewAll extends LightningElement {

    @api recordId;
    @api isCommunity;
    @track recordName = false;
    recordLink;
    accountNameLink;
    isLoading = true;
    feeScheduleRecords;
    allRecords;
    columns = columns;
    totalNumberOfRows;
    currentCount = 0;
    limit=50;
    offset=0;
    plusSign = null;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    
    isLoadMore = false;
    @track sortBy;
    @track sortDirection = 'desc';
    uniqueVal = 0;


    connectedCallback() {

        Promise.all([
            loadStyle(this, managerPresentationsRelatedToAccount)
        ]);
        this.isLoading = true;
        this.isCommunityBoolean = this.isCommunity == 'false' ? false : true;
        // To set links for breadcrumbs
        this.setLinks(); //setting up links for Account Name
        //getting Account Name
        getAccountName({
            recordId : this.recordId
        }).then(returnedAccountName => {
            if(returnedAccountName)
            {
                this.recordName = returnedAccountName.Name;
            }
        });

        //getting list of MPs records based on the passed Account Id
        getFeeScheduleRecords({
            accountId: this.recordId,
            sortedBy: '',
            sortOrder: '',
            nullOrder: ''
        }).then(returnedFeeScheduleRecords => {
            if(returnedFeeScheduleRecords) {
                this.allRecords = returnedFeeScheduleRecords;
                this.totalNumberOfRows = this.allRecords.length;
                var tempList = [];
                var recslength = this.allRecords.length;
                
                if(recslength > this.limit)
                    recslength = this.limit;

                for (var i = 0; i < recslength; i++) {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.SubAssetClass = this.allRecords[i].SubAssetClass;
                    temObj.TotalFee = this.allRecords[i].TotalFee;
                    temObj.AssetClass = this.allRecords[i].AssetClass;
                    if (this.isCommunityBoolean == true) {
                        temObj.Id = this.allRecords[i].Id != undefined && this.allRecords[i].Id != null ? "/" + this.communityName + "/s/detail/" + this.allRecords[i].Id : null;
                        temObj.AccountId = this.allRecords[i].AccountId != undefined && this.allRecords[i].AccountId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].AccountId : null;
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPensionId = this.allRecords[i].PublicPensionId != undefined && this.allRecords[i].PublicPensionId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].PublicPensionId : null;
                        temObj.recordLink = "/"+this.communityName+"/s/manager-presentation/" + this.allRecords[i].Id;
                    }
                    else {
                        temObj.Id = this.allRecords[i].Id != undefined && this.allRecords[i].Id != null ? "/" + this.allRecords[i].Id : null;
                        temObj.AccountId = this.allRecords[i].AccountId != undefined && this.allRecords[i].AccountId != null ?"/" + this.allRecords[i].AccountId : null;
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPensionId = this.allRecords[i].PublicPensionId != undefined && this.allRecords[i].PublicPensionId != null ?"/" + this.allRecords[i].PublicPensionId : null;
                        temObj.recordLink = "/" + this.allRecords[i].Id;
                    }
                    temObj.UniqueVal = this.uniqueVal;
                    tempList.push(temObj);
                    this.UniqueVal++;
                }
                this.currentCount = recslength;
                if(this.allRecords.length > 0) 
                {
                    this.feeScheduleRecords = [...tempList];
                    this.offset = recslength;
                }
                // For showing + sign with count
                if((this.offset) >= this.allRecords.length || (this.offset) == 0)
                {
                    this.plusSign = '';
                }
                else
                {
                    this.plusSign = '+';
                }
            }
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            console.log(error);
        });
    }

   
    // To refresh table
    refreshTable(event) {
        this.offset = 0;
        this.limit = 50;
        this.feeScheduleRecords = null;
        this.sortBy = '';
        this.sortDirection = 'desc';
        this.connectedCallback();
    }

    // Main sorting function
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    // function to setup links for bread crumbs
    setLinks() {
        if(this.isCommunityBoolean) {  
            this.recordLink = "/"+this.communityName+"/s/account/" + this.recordId;
            this.accountNameLink = "/"+this.communityName + '/s/account/Account/Default';
        } else {
            this.recordLink = '/'+this.recordId;
            this.accountNameLink = '/one/one.app#/sObject/Account/list?filterName=Recent';
        }  
    }

    //Sorting function to sort data in columns 
    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.allRecords));
        if(fieldname == 'Id') {
            fieldname = 'FeeScheduleName';
        } else if (fieldname == 'PublicPensionId') {
            fieldname = 'PublicPensionName';
        } else if (fieldname == 'InvestmentStrategyId') {
            fieldname = 'InvestmentStrategyName';
        } else if (fieldname == 'AccountId') {
            fieldname = 'AccountName';
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
        let dataLimit = this.isLoadMore ? this.currentCount : this.limit;
        this.feeScheduleRecords = [];

        for(let i = 0; i < dataLimit; i++)
        {
            let temObj = Object.assign({}, parseData[i]);
            temObj.SubAssetClass = parseData[i].SubAssetClass;
            temObj.TotalFee = parseData[i].TotalFee;
            temObj.AssetClass = parseData[i].AssetClass;
            if (this.isCommunityBoolean) {
                temObj.Id = parseData[i].Id != undefined && parseData[i].Id != null ? "/" + this.communityName + "/s/detail/" + parseData[i].Id : null;
                temObj.AccountId = parseData[i].AccountId != undefined && parseData[i].AccountId != null ?"/" + this.communityName + "/s/detail/" + parseData[i].AccountId : null;
                temObj.InvestmentStrategyId = parseData[i].InvestmentStrategyId != undefined && parseData[i].InvestmentStrategyId != null ?"/" + this.communityName + "/s/detail/" + parseData[i].InvestmentStrategyId : null;
                temObj.PublicPensionId = parseData[i].PublicPensionId != undefined && parseData[i].PublicPensionId != null ?"/" + this.communityName + "/s/detail/" + parseData[i].PublicPensionId : null;
                temObj.recordLink = "/"+this.communityName+"/s/manager-presentation/" + parseData[i].Id;
            }
            else {
                temObj.Id = parseData[i].Id != undefined && parseData[i].Id != null ? "/" + parseData[i].Id : null;
                temObj.AccountId = parseData[i].AccountId != undefined && parseData[i].AccountId != null ?"/" + parseData[i].AccountId : null;
                temObj.InvestmentStrategyId = parseData[i].InvestmentStrategyId != undefined && parseData[i].InvestmentStrategyId != null ?"/" + parseData[i].InvestmentStrategyId : null;
                temObj.PublicPensionId = parseData[i].PublicPensionId != undefined && parseData[i].PublicPensionId != null ?"/" + parseData[i].PublicPensionId : null;
                temObj.recordLink = "/" + parseData[i].Id;
            }
            this.feeScheduleRecords[i] = temObj;
        }
    }

    // function to provide inifite loading
    loadMoreData(event){
        this.isLoadMore = true;
        if(this.offset < this.totalNumberOfRows)
        {
            if(this.feeScheduleRecords!=null && event.target){
                this.isLoading = true;
            }
            this.tableElement = event.target;
            if(this.allRecords && this.feeScheduleRecords && this.allRecords.length > this.feeScheduleRecords.length)
            {
                var tempList = [];  
                var recslength = parseInt(this.offset ) + parseInt(this.limit);
                if(recslength > this.allRecords.length)
                    recslength = this.allRecords.length;
                for (var i = this.offset; i < recslength; i++) 
                {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.SubAssetClass = this.allRecords[i].SubAssetClass;
                    temObj.TotalFee = this.allRecords[i].TotalFee;
                    temObj.AssetClass = this.allRecords[i].AssetClass;
                    if (this.isCommunityBoolean == true) {
                        temObj.Id = this.allRecords[i].Id != undefined && this.allRecords[i].Id != null ? "/" + this.communityName + "/s/detail/" + this.allRecords[i].Id : null;
                        temObj.AccountId = this.allRecords[i].AccountId != undefined && this.allRecords[i].AccountId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].AccountId : null;
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPensionId = this.allRecords[i].PublicPensionId != undefined && this.allRecords[i].PublicPensionId != null ?"/" + this.communityName + "/s/detail/" + this.allRecords[i].PublicPensionId : null;
                        temObj.recordLink = "/"+this.communityName+"/s/manager-presentation/" + this.allRecords[i].Id;
                    }
                    else {
                        temObj.Id = this.allRecords[i].Id != undefined && this.allRecords[i].Id != null ? "/" + this.allRecords[i].Id : null;
                        temObj.AccountId = this.allRecords[i].AccountId != undefined && this.allRecords[i].AccountId != null ?"/" + this.allRecords[i].AccountId : null;
                        temObj.InvestmentStrategyId = this.allRecords[i].InvestmentStrategyId != undefined && this.allRecords[i].InvestmentStrategyId != null ?"/" + this.allRecords[i].InvestmentStrategyId : null;
                        temObj.PublicPensionId = this.allRecords[i].PublicPensionId != undefined && this.allRecords[i].PublicPensionId != null ?"/" + this.allRecords[i].PublicPensionId : null;
                        temObj.recordLink = "/" + this.allRecords[i].Id;
                    }
                    temObj.UniqueVal = this.uniqueVal;
                    tempList.push(temObj);
                    this.UniqueVal++;
                }
                if(this.feeScheduleRecords)
                    this.feeScheduleRecords =  this.feeScheduleRecords.concat(tempList);
                if((this.offset+(this.limit)) >= this.totalNumberOfRows)
                {
                    this.offset = this.totalNumberOfRows;
                    this.plusSign = '';
                } else
                {
                    this.offset = parseInt(this.offset ) + parseInt(this.limit);
                    this.plusSign = '+';
                }
                this.currentCount = this.offset;

                if(this.tableElement){
                    this.isLoading = false;
                }  
            }
        }
    }
}