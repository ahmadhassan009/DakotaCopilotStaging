import { LightningElement, api, wire ,track} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getContactName from '@salesforce/apex/JobChangesRelatedToContactController.getContactName';
import getContactRelatedJobChangesRecords from '@salesforce/apex/JobChangesRelatedToContactController.getContactRelatedJobChangesRecords';
import getContactRelatedJobChangesRecordsCount from '@salesforce/apex/JobChangesRelatedToContactController.getContactRelatedJobChangesRecordsCount'; 
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import OLD_TITLE from '@salesforce/schema/Update__c.Old_Title__c';

const COLUMNS = [
    { label: 'Name', fieldName: "ContactLink", type: 'url', typeAttributes: {label: { fieldName: 'ContactName' }, tooltip:  { fieldName: 'ContactName' }, target: '_self'}},
    { label: 'Firm Left', fieldName: "FirmLeftLink", type: 'url', typeAttributes: {label: { fieldName: 'FirmLeftName' }, tooltip:  { fieldName: 'FirmLeftName' }, target: '_self'}},
    { label: 'Old Title', fieldName: OLD_TITLE.fieldApiName, type: 'Text' },
    { label: 'Time Left', fieldName: "DateField", type: 'Date',}
];

const MONTHNAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default class JobChangesRelatedToContact extends NavigationMixin(LightningElement) {
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    @track isLoading=false;
    @api isSalesforceInstance = false;

    columns = COLUMNS;
    setSelectedRows = [];
    totalRelatedjobChangesCount = 0;
    relatedJobChangesRecords;
    newbuttonPressed = false;
    isCommunity = false;
    offset = 0;
    limit = 10;
    plusSign = '';
    baseURL = '';
    recordToDel;
    panelStyling;
    collapsed = true;
    jobChangesRecordsExists = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.checkIsCommunityInstance(); 
        
        // Get related marketplace searches records for account
        getContactRelatedJobChangesRecords({
            recordId: this.recordId
        }) .then (relatedJobChanges => {
            if (relatedJobChanges) {
                var tempJobChangesList = [];  
                for (var i = 0; i < relatedJobChanges.length; i++) {  
                    let tempRecord = Object.assign({}, relatedJobChanges[i]); //cloning object  
                    if(this.isCommunity )
                    {
                        if( tempRecord.Contact__c != undefined)
                            tempRecord.ContactLink = "/"+this.communityName+"/s/detail/" + tempRecord.Contact__c;

                        if( tempRecord.Firm_Left__c != undefined)
                            tempRecord.FirmLeftLink = "/"+this.communityName+"/s/detail/" + tempRecord.Firm_Left__c;
                    }
                    else
                    {
                        if( tempRecord.Contact__c != undefined)
                            tempRecord.ContactLink = "/" + tempRecord.Contact__c;

                        if( tempRecord.Firm_Left__c != undefined)
                            tempRecord.FirmLeftLink = "/" + tempRecord.Firm_Left__c;
                    }
                    if( tempRecord.Contact__c != undefined)
                        tempRecord.ContactName = tempRecord.Contact__r.Name;

                    if( tempRecord.Firm_Left__c != undefined)
                        tempRecord.FirmLeftName = tempRecord.Firm_Left__r.Name;

                        var date = new Date(tempRecord.CreatedDate);
                        tempRecord.DateField = MONTHNAMES[date.getMonth()] + ' ' + date.getFullYear();

                        tempJobChangesList.push(tempRecord); 
                }
                this.relatedJobChangesRecords = tempJobChangesList;
                this.offset = this.relatedJobChangesRecords.length; 
                this.isLoading = false;
                if(this.offset > 0)
                {
                    this.collapsed =false;
                }
                else
                {
                    this.collapsed =true;
                }

                //To get count of related searches records
                getContactRelatedJobChangesRecordsCount({
                    recordId: this.recordId
                }) .then (jobChangesRecordCount => {
                    if(jobChangesRecordCount == 0 && this.communityName == 'dakotaMarketplace') {
                        this.jobChangesRecordsExists = false;
                    }
                    else {
                        this.jobChangesRecordsExists = true;
                    }
                    this.totalRelatedjobChangesCount = jobChangesRecordCount;
                    if(this.offset >= this.totalRelatedjobChangesCount){
                        this.plusSign = '';
                    } 
                    else {
                        this.plusSign = '+';
                    }

                    //To set panel height based total number of records 
                    if(this.totalRelatedjobChangesCount >= 10) {
                        this.panelStyling = 'height : 348px;';
                    }
                    else if (this.totalRelatedjobChangesCount == 1)
                    {
                        this.panelStyling = 'height : 75px;';
                    }
                    else if(this.totalRelatedjobChangesCount == 2)
                    {
                        this.panelStyling = 'height : 120px;';
                    } 
                    else if(this.totalRelatedjobChangesCount == 3 )
                    {
                        this.panelStyling = 'height : 150px;';
                    }
                    else if(this.totalRelatedjobChangesCount == 4 )
                    {
                        this.panelStyling = 'height : 175px;';
                    }
                    else if(this.totalRelatedjobChangesCount > 0 && this.totalRelatedjobChangesCount <= 5) {
                        this.panelStyling = 'height : 210px;';
                    }
                    else if(this.totalRelatedjobChangesCount > 0 && this.totalRelatedjobChangesCount <= 7) {
                        this.panelStyling = 'height : 245px;';
                    }
                    else if(this.totalRelatedjobChangesCount > 0 && this.totalRelatedjobChangesCount <= 9) {
                        this.panelStyling = 'height : 305px;';
                    }
                }) .catch(error => {});
            }
        }) .catch(error => {
            this.isLoading=false;
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

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
    }

    @wire(getContactName, {recordId:'$recordId'})
    loadContactName (contactName) {
        if(contactName.data) {
            this.recordName = contactName.data.Name;
        }
    }

    handleEvent = event => {
    
        this.isLoading = true;
        this.newbuttonPressed = false;
        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.checkIsCommunityInstance();
        this.refreshTable();       
    }

    handleShowFullRelatedList() {
        var navigationURL = this.baseURL +'/lightning/cmp/c__JobChangesRelatedToContactDataTableView?c__recordId='+this.recordId+'&c__recordName='+this.recordName+'&c__isCommunity='+ this.isCommunity;
        var url = '/view-contactrelatedjobchanges?recordId=' + this.recordId + '&recordName=' + this.recordName + '&isCommunity=' + this.isCommunity;

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