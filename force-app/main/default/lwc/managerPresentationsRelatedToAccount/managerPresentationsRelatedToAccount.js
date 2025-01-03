import { LightningElement, api, wire ,track} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getManagerPresentationRecords from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getManagerPresentationRecords';
import getSFBaseUrl from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getSFBaseUrl';
import { loadStyle } from 'lightning/platformResourceLoader';

const columns = [
    { label: "Fee Schedule Name", fieldName: "DistributionPublicUrl", type: "url", typeAttributes: { label: { fieldName: 'DocName' }, target: '_self'}}
   ];

export default class ManagerPresentationsRelatedToAccount extends NavigationMixin(LightningElement) {

    @api recordId;
    @api recordName;
    
    @track isLoading = true;
    feeScheduleRecords;
    allRecords;
    @track fsRecordsExists = false;
    columns = columns;
    totalNumberOfRows;
    currentCount = 0;
    limit=20;
    offset=0;
    isCommunity = false;
    isLoadMore = false;
    @track sortBy;
    @track sortDirection = 'desc';
    totalFeeScheduleRecordsCount = 0;
    offset = 0;
    limit = 10;
    plusSign = '';
    panelStyling;
    baseURL = '';
    collapsed = true;
    uniqueVal = 0;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {

        // Promise.all([
        //     loadStyle(this, managerPresentationsRelatedToAccount)
        // ]);

        this.isLoading = true;
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        //getting list of MPs records based on the passed Account Id
        getManagerPresentationRecords({accountId: this.recordId, managerPresentationType: 'Fee Schedule'}).then(returnedFeeScheduleRecords => {
            if(returnedFeeScheduleRecords) {
                this.allRecords = returnedFeeScheduleRecords;
                this.totalNumberOfRows = this.allRecords.length;
                var tempList = [];  
                var recslength = this.allRecords.length;
                if(recslength > this.limit)
                    recslength = this.limit;
                for (var i = 0; i < recslength; i++) 
                {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.DistributionPublicUrl = this.allRecords[i].DistributionPublicUrl;
                    temObj.AccountName = this.allRecords[i].AccountName;
                    if (this.isCommunity) {
                        temObj.recordLink = "/"+this.communityName+"/s/manager-presentation/" + this.allRecords[i].Id;
                    }
                    else {
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

                //To set panel height based total number of records 
                if(this.totalFeeScheduleRecordsCount >= 10) {
                    this.panelStyling = 'height : 348px;';
                }
                else if (this.totalFeeScheduleRecordsCount == 1)
                {
                    this.panelStyling = 'height : 75px;';
                }
                else if(this.totalFeeScheduleRecordsCount == 2)
                {
                    this.panelStyling = 'height : 120px;';
                } 
                else if(this.totalFeeScheduleRecordsCount == 3 )
                {
                    this.panelStyling = 'height : 150px;';
                }
                else if(this.totalFeeScheduleRecordsCount == 4 )
                {
                    this.panelStyling = 'height : 175px;';
                }
                else if(this.totalFeeScheduleRecordsCount > 0 && this.totalFeeScheduleRecordsCount <= 5) {
                    this.panelStyling = 'height : 210px;';
                }
                else if(this.totalFeeScheduleRecordsCount > 0 && this.totalFeeScheduleRecordsCount <= 7) {
                    this.panelStyling = 'height : 245px;';
                }
                else if(this.totalFeeScheduleRecordsCount > 0 && this.totalFeeScheduleRecordsCount <= 9) {
                    this.panelStyling = 'height : 305px;';
                }
            }
            
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            console.log(error);
        });

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

    // To refresh table
    refreshTable(event)
    {
        this.connectedCallback();
    }

    // function navigates the user to view all component
    handleShowFullRelatedList() {
        var navigationURL = this.baseURL +'/lightning/cmp/c__ManagerPresentationsRelatedToAccountView?c__recordId='+this.recordId+'&c__recordName='+this.recordName+'&c__isCommunity='+ this.isCommunity;
        var url = '/FeeSchedules?recordId=' + this.recordId + '&recordName=' + this.recordName + '&isCommunity=' + this.isCommunity;

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