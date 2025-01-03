import { LightningElement, wire, api, track } from 'lwc';
import getManagerPresentationRecords from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getManagerPresentationRecords';
import getAccountName from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getAccountName';
import activeCommunities from '@salesforce/label/c.active_communities';
import MeetingMaterialsCSS from '@salesforce/resourceUrl/MeetingMaterialsCSS';
import { loadStyle } from 'lightning/platformResourceLoader';

const COLUMNS = [
    { label: "Meeting Material Name", fieldName: "DistributionPublicUrl", type: "url", typeAttributes: { label: { fieldName: 'DocName' }, target: '_self' } }
];


export default class MeetingMaterialsRelatedToAccountViewAll extends LightningElement {
    @api recordId;
    @track recordName = false;
    @api isCommunity;
    recordLink;
    accountNameLink;
    isLoading = true;
    meetingMaterialRecords;
    allRecords;
    columns = COLUMNS;
    totalNumberOfRows;
    currentCount = 0;
    limit = 50;
    offset = 0;
    plusSign = null;
    isLoadMore = false;
    uniqueVal = 0;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {

        Promise.all([
            loadStyle(this, MeetingMaterialsCSS)
        ]);

        this.isLoading = true;
        this.isCommunityBoolean = this.isCommunity == 'false' ? false : true;
        // To set links for breadcrumbs
        this.setLinks(); //setting up links for Account Name
        getAccountName({
            recordId : this.recordId
        }).then(returnedAccountName => {
            if(returnedAccountName)
            {
                this.recordName = returnedAccountName.Name;
            }
        });
        //getting list of MPs records based on the passed Account Id
        getManagerPresentationRecords({ accountId: this.recordId, managerPresentationType: 'Meeting Materials' }).then(returnedFeeScheduleRecords => {
            if (returnedFeeScheduleRecords) {
                this.allRecords = returnedFeeScheduleRecords;
                this.totalNumberOfRows = this.allRecords.length;
                var tempList = [];
                var recslength = this.allRecords.length;//getting total length of records
                if (recslength > this.limit)
                    recslength = this.limit;
                for (var i = 0; i < recslength; i++) {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.DistributionPublicUrl = this.allRecords[i].DistributionPublicUrl;
                    if (this.isCommunityBoolean) {
                        //creating record Link for Comunity Users
                        temObj.recordLink = "/" + this.communityName + "/s/detail/" + this.allRecords[i].Id;
                    }
                    else {
                        // Creating record Link for SF Users
                        temObj.recordLink = "/" + this.allRecords[i].Id;
                    }
                    temObj.UniqueVal = this.uniqueVal;
                    tempList.push(temObj);
                    this.UniqueVal++;
                }
                this.currentCount = recslength;
                if (this.allRecords.length > 0) {
                    this.meetingMaterialRecords = [...tempList];
                    this.offset = recslength;
                }
                // For showing + sign with count
                if ((this.offset) >= this.allRecords.length || (this.offset) == 0) {
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
    refreshTable(event) {
        this.offset = 0;
        this.meetingMaterialRecords = null;
        this.connectedCallback();
    }

    // function to setup links for bread crumbs
    setLinks() {
        if (this.isCommunityBoolean) {
            this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
            this.accountNameLink = "/" + this.communityName + '/s/account/Account/Default';
        } else {
            this.recordLink = '/' + this.recordId;
            this.accountNameLink = '/one/one.app#/sObject/Account/list?filterName=Recent';
        }
    }

    // function to provide inifite loading
    loadMoreData(event) {
        if (this.offset < this.totalNumberOfRows) {
            if (this.meetingMaterialRecords != null && event.target) {
                this.isLoading = true;
            }
            this.tableElement = event.target;
            if (this.allRecords && this.meetingMaterialRecords && this.allRecords.length > this.meetingMaterialRecords.length) {
                var tempList = [];
                var recslength = parseInt(this.offset) + parseInt(this.limit);
                if (recslength > this.allRecords.length)
                    recslength = this.allRecords.length;
                for (var i = this.offset; i < recslength; i++) {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.DistributionPublicUrl = this.allRecords[i].DistributionPublicUrl;
                    if (this.isCommunityBoolean) {
                        temObj.recordLink = "/" + this.communityName + "/s/detail/" + this.allRecords[i].Id;
                    }
                    else {
                        temObj.recordLink = "/" + this.allRecords[i].Id;
                    }
                    temObj.UniqueVal = this.uniqueVal;
                    tempList.push(temObj);
                    this.UniqueVal++;
                }
                if (this.meetingMaterialRecords)
                    this.meetingMaterialRecords = this.meetingMaterialRecords.concat(tempList);
                if ((this.offset + (this.limit)) >= this.totalNumberOfRows) {
                    this.offset = this.totalNumberOfRows;
                    this.plusSign = '';
                } else {
                    this.offset = parseInt(this.offset) + parseInt(this.limit);
                    this.plusSign = '+';
                }
                this.currentCount = this.offset;

                if (this.tableElement) {
                    this.isLoading = false;
                }
            }
        }
    }

}