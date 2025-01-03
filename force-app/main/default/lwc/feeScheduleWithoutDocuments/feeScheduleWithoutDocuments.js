import { LightningElement, api, wire ,track} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import managerPresentationsRelatedToAccount from '@salesforce/resourceUrl/managerPresentationsRelatedToAccount';
import getFeeScheduleRecords from '@salesforce/apex/FeeScheduleWithoutDocuments.getFeeScheduleRecords';
import getSFBaseUrl from '@salesforce/apex/FeeScheduleWithoutDocuments.getSFBaseUrl';
import { loadStyle } from 'lightning/platformResourceLoader';

const columns = [
    { label: "Fee Schedule Name", sortable: true, fieldName: "Id", type: "url", typeAttributes: { label: { fieldName: 'FeeScheduleName' }, target: '_self'}},
    { label: "Pension Name", sortable: true, fieldName: "PublicPensionId", type: "url", typeAttributes: { label: { fieldName: 'PublicPensionName' }, target: '_self'}},
    { label: "Investment Strategy", sortable: true, fieldName: "InvestmentStrategyId", type: "url", typeAttributes: { label: { fieldName: 'InvestmentStrategyName' }, target: '_self'}},
    { label: "Account Name", sortable: true, fieldName: "AccountId", type: "url", typeAttributes: { label: { fieldName: 'AccountName' }, target: '_self'}},
    { label: "Total Fee", sortable: true, fieldName: "TotalFee", type: "text"},
    { label: "Asset Class", sortable: true, fieldName: "AssetClass", type: "Picklist"},
    { label: "Sub-Asset Class", sortable: true, fieldName: "SubAssetClass", type: "Picklist"}
   ];

export default class FeeScheduleWithoutDocuments extends NavigationMixin(LightningElement)  {
    @api recordId;
    @api recordName;
    
    @track isLoading = true;
    feeScheduleRecords;
    allRecords;
    @track fsRecordsExists = false;
    columns = columns;
    limit=20;
    offset=0;
    isCommunity = false;
    totalFeeScheduleRecordsCount = 0;
    offset = 0;
    limit = 10;
    plusSign = '';
    baseURL = '';
    collapsed = true;
    uniqueVal = 0;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = '';
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'FIRST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {

        Promise.all([
            loadStyle(this, managerPresentationsRelatedToAccount)
        ]);

        this.isLoading = true;
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;

        this.sortedDirection = '';   
        this.sortedBy = '';
        this.getFeeScheduleRecords(this.recordId, this.sortedBy, this.sortedDirection);

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

    //getting list of MPs records with no documents attached based on the passed Account Id
    getFeeScheduleRecords(recordId, sortedBy, sortedDirection ){
        this.isLoading = true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        getFeeScheduleRecords({
            accountId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            nullOrder: this.nullOrder
        }).then(returnedFeeScheduleRecords => {
            if(returnedFeeScheduleRecords) {
                this.allRecords = returnedFeeScheduleRecords;
                var tempList = [];
                var recslength = this.allRecords.length;
                
                if(recslength > this.limit)
                    recslength = this.limit;

                for (var i = 0; i < recslength; i++) {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.SubAssetClass = this.allRecords[i].SubAssetClass;
                    temObj.TotalFee = this.allRecords[i].TotalFee;
                    temObj.AssetClass = this.allRecords[i].AssetClass;
                    if (this.isCommunity) {
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

                if(this.allRecords.length > 0) 
                {
                    this.feeScheduleRecords = [...tempList];
                    this.fsRecordsExists = true;
                    this.offset = recslength;
                }
                else {
                    this.fsRecordsExists = false;
                }
            }

            if(this.offset > 0)
            {
                this.collapsed =false;
            }
            else
            {
                this.collapsed =true;
            }
            if(this.allRecords && this.allRecords.length) {

                this.totalFeeScheduleRecordsCount = this.allRecords.length;
                
                if(this.offset >= this.totalFeeScheduleRecordsCount){
                    this.plusSign = '';
                } 
                else {
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
    refreshTable(event)
    {
        this.connectedCallback();
    }

    // function navigates the user to view all component
    handleShowFullRelatedList() {
        var navigationURL = this.baseURL +'/lightning/cmp/c__feeScheduleWithoutDocumentsView?c__recordId='+this.recordId+'&c__recordName='+this.recordName+'&c__isCommunity='+ this.isCommunity;
        var url = '/Fee-Schedules?recordId=' + this.recordId + '&recordName=' + this.recordName + '&isCommunity=' + this.isCommunity;

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
    if(this.sortedBy === 'Id') {
        tempSortBy = 'Name';
    } else if(this.sortedBy === 'PublicPensionId') {
        tempSortBy =  'Public_Pension_Fund__r.Name';
    }else if(this.sortedBy === 'InvestmentStrategyId') {
        tempSortBy = 'Investment_Strategy__r.Name';
    }else if(this.sortedBy === 'AccountId') {
        tempSortBy = 'Account.Name'; 
    }else if(this.sortedBy === 'TotalFee') {
        tempSortBy = 'Total_Fee__c';
    }else if(this.sortedBy === 'AssetClass') {
        tempSortBy = 'Asset_Class__c';
    }else if(this.sortedBy === 'SubAssetClass') {
        tempSortBy = 'Sub_Asset_Class__c';
    }

    this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
    this.nameSortDir = this.sortedDirection;
    this.getFeeScheduleRecords(this.recordId, tempSortBy, this.sortedDirection);
    }
}