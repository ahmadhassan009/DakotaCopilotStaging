import { LightningElement, wire, api, track } from 'lwc';
import getManagerPresentationRecords from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getManagerPresentationRecords';
import getAccountName from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getAccountName';
import activeCommunities from '@salesforce/label/c.active_communities';
import managerPresentationsRelatedToAccount from '@salesforce/resourceUrl/managerPresentationsRelatedToAccount';
import { loadStyle } from 'lightning/platformResourceLoader';
import NAME_FIELD from '@salesforce/schema/Manager_Presentation__c.Name';

const columns = [
    { label: "Manager Presentation Name", fieldName: "DistributionPublicUrl", type: "url", typeAttributes: { label: { fieldName: 'DocName' }, target: '_self'}}
   ];


export default class ManagerPresentationsRelatedToAccountViewAll extends LightningElement {
    @api recordId;
    @track recordName = false;
    @api isCommunity;
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
        getManagerPresentationRecords({accountId: this.recordId, managerPresentationType: 'Fee Schedule'}).then(returnedFeeScheduleRecords => {
            if(returnedFeeScheduleRecords) {
                this.allRecords = returnedFeeScheduleRecords;
                this.totalNumberOfRows = this.allRecords.length;
                var tempList = [];  
                var recslength = this.allRecords.length;//getting total length of records
                if(recslength > this.limit)
                    recslength = this.limit;
                    //creating object array of All MP records
                for (var i = 0; i < recslength; i++) {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.DistributionPublicUrl = this.allRecords[i].DistributionPublicUrl;
                    if (this.isCommunityBoolean) {//creating record Links for Comunity Users
                        temObj.recordLink = "/"+this.communityName+"/s/detail/" + this.allRecords[i].Id;
                    }
                    else {
                        // Creating record Links for SF Users
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

    //Sorting function fo 
    sortData(fieldname, direction) {

        let parseData = JSON.parse(JSON.stringify(this.allRecords));
        if(fieldname == 'recordLink') {
            fieldname = 'Name';
        } else if (fieldname == 'DistributionPublicUrl') {
            fieldname = 'DocName';
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
            temObj.DistributionPublicUrl = parseData[i].DistributionPublicUrl;
            
            if (this.isCommunityBoolean) {
                temObj.recordLink = "/"+this.communityName+"/s/detail/" + parseData[i].Id;
            }
            else {
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
                    temObj.DistributionPublicUrl = this.allRecords[i].DistributionPublicUrl;
                    if (this.isCommunityBoolean) {
                        
                        temObj.recordLink = "/"+this.communityName+"/s/detail/" + this.allRecords[i].Id;
                    }
                    else {
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