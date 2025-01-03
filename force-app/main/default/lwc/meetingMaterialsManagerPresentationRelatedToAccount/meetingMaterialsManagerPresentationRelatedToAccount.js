import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import MeetingMaterialsCSS from '@salesforce/resourceUrl/MeetingMaterialsCSS';
import getManagerPresentationRecords from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getManagerPresentationRecords';
import getSFBaseUrl from '@salesforce/apex/ManagerPresentationsRelatedToAccount.getSFBaseUrl';
import { loadStyle } from 'lightning/platformResourceLoader';

const COLUMNS = [
    { label: "Meeting Material Name", fieldName: "DistributionPublicUrl", type: "url", typeAttributes: { label: { fieldName: 'DocName' }, target: '_self' } }
];

export default class MeetingMaterialsManagerPresentationRelatedToAccount extends NavigationMixin(LightningElement) {

    @api recordId;
    @track isLoading = true;
    meetingMaterialRecords;
    allRecords;
    @track fsRecordsExists = false;
    columns = COLUMNS;
    isCommunity = false;
    isLoadMore = false;
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
        Promise.all([
            loadStyle(this, MeetingMaterialsCSS)
        ]);

        this.isLoading = true;
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        //getting list of MPs records based on the passed Account Id
        getManagerPresentationRecords({ accountId: this.recordId, managerPresentationType: 'Meeting Materials' }).then(returnedMeetingMaterialRecords => {
            if (returnedMeetingMaterialRecords) {
                this.allRecords = returnedMeetingMaterialRecords;
                var tempList = [];
                var recslength = this.allRecords.length;
                if (recslength > this.limit)
                    recslength = this.limit;
                for (var i = 0; i < recslength; i++) {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    temObj.DistributionPublicUrl = this.allRecords[i].DistributionPublicUrl;
                    temObj.AccountName = this.allRecords[i].AccountName;
                    if (this.isCommunity) {
                        temObj.recordLink = "/" + this.communityName + "/s/manager-presentation/" + this.allRecords[i].Id;
                    }
                    else {
                        temObj.recordLink = "/" + this.allRecords[i].Id;
                    }
                    temObj.UniqueVal = this.uniqueVal;
                    tempList.push(temObj);
                    this.UniqueVal++;
                }
                if (this.allRecords.length > 0) {
                    this.meetingMaterialRecords = [...tempList];
                    this.fsRecordsExists = true;
                    this.offset = recslength;
                }
                else {
                    this.fsRecordsExists = false;
                }
            }

            if (this.offset > 0) {
                this.collapsed = false;
            }
            else {
                this.collapsed = true;
            }
            if (this.allRecords && this.allRecords.length) {

                this.totalFeeScheduleRecordsCount = this.allRecords.length;

                if (this.offset >= this.totalFeeScheduleRecordsCount) {
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

    // To refresh table
    refreshTable(event) {
        this.connectedCallback();
    }

    // function navigates the user to view all component
    handleShowFullRelatedList() {
        var navigationURL = this.baseURL + '/lightning/cmp/c__MeetingMaterialsRelatedToAccountView?c__recordId=' + this.recordId +'&c__isCommunity=' + this.isCommunity;
        var url = '/meetingmaterialdocuments?recordId=' + this.recordId  + '&isCommunity=' + this.isCommunity;

        if (this.isCommunity) {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
        else {
            window.open(navigationURL, "_self");
        }
    }
}