import { LightningElement, api,track } from 'lwc';
import { NavigationMixin } from "lightning/navigation"
import getContactRelatedJobChangesRecordsCount from '@salesforce/apex/JobChangesRelatedToContactController.getContactRelatedJobChangesRecordsCount';
import getAllContactRelatedJobChangesRecords from '@salesforce/apex/JobChangesRelatedToContactController.getAllContactRelatedJobChangesRecords';
import getAllRelatedSortedJobChangesRecords from '@salesforce/apex/JobChangesRelatedToContactController.getAllRelatedSortedJobChangesRecords';
import getContactName from '@salesforce/apex/JobChangesRelatedToContactController.getContactName';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import activeCommunities from '@salesforce/label/c.active_communities';

const COLUMNS = [
    { label: 'Name', fieldName: "ContactLink", sortable: true, type: 'url', typeAttributes: {label: { fieldName: 'ContactName' }, tooltip:  { fieldName: 'ContactName' }, target: '_self'}},
    { label: 'Firm Left', fieldName: "FirmLeftLink", sortable: true, type: 'url', typeAttributes: {label: { fieldName: 'FirmLeftName' }, tooltip:  { fieldName: 'FirmLeftName' }, target: '_self'}},
    { label: 'Old Title', fieldName: "Old_Title__c", sortable: true, type: 'Text' },
    { label: 'Time Left', fieldName: "DateField", sortable: true, type: 'Date'},
];

const MONTHNAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default class JobChangesRelatedToContactViewAll extends NavigationMixin(LightningElement) {
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    @api isCommunity;
    ContactLink;
    recordLink;
    FirmLeftLink;
    contactNameLink;
    relatedJobChangesRecords
    totalRelatedjobChangesCount;
    columns = COLUMNS;
    isCommunityBoolean;
    offset = 0;
    limit = 50;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    nameSortDir = this.defaultSortDirection;
    sortDirection;
    sortedBy;
    sortedByFieldName;
    plusSign = null;
    @track isLoading = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.isCommunityBoolean = this.isCommunity == 'false' ? false : true;
        // To set links for breadcrumbs
        this.setLinks();

        //To get count of related Job Changes records
        getContactRelatedJobChangesRecordsCount({
            recordId: this.recordId
        }) .then (jobChangesRecordCount => {
            if(jobChangesRecordCount) {
                this.totalRelatedjobChangesCount = jobChangesRecordCount;
            }
        })

        // Get related marketplace Job Changes records
        getAllContactRelatedJobChangesRecords({
            recordId: this.recordId,
            recordLimit: this.limit,
            offset: this.offset 
        }) .then (relatedJobChanges => {
            if (relatedJobChanges) {
                var tempJobChangesList = [];  
                for (var i = 0; i < relatedJobChanges.length; i++) {  
                    let tempRecord = Object.assign({}, relatedJobChanges[i]); //cloning object  
                    if(this.isCommunityBoolean)
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
                this.offset = tempJobChangesList.length; 
                this.isLoading = false;
                // For showing + sign with count
                if((this.offset) >= this.totalRelatedjobChangesCount || (this.offset) == 0)
                {
                    this.plusSign = '';
                }
                else
                {
                    this.plusSign = '+';
                }
            }
        
        }) .catch(error => {
            this.isLoading=false;
            console.log("Error:" , error);
        });

        getContactName({
            recordId : this.recordId
        }).then(returnedAccount => {
            if(returnedAccount != null)
            {
                this.recordName = returnedAccount.Name;
            }
        });
    }

    // Set breadcrumb links
    setLinks() {
        if(this.isCommunityBoolean) {  
            this.recordLink = "/"+this.communityName+"/s/contact/" + this.recordId;
            this.contactNameLink = "/"+this.communityName + '/s/contact/Contact/Default';
        } else {
            this.recordLink = '/'+this.recordId;
            this.contactNameLink = '/one/one.app#/sObject/Contact/list?filterName=Recent';
        }  
    }

    handleEvent = event => {
    
        this.isLoading = true;
        this.newbuttonPressed = false;
        const refreshRecordEvent = event.data.payload;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.refreshTable();       
    }
    
    // To refresh table
    refreshTable(event) {
        this.offset = 0;
        this.limit = 50;
        this.relatedJobChangesRecords = null;
        this.connectedCallback();
    }

    onHandleSort(event) {
        var sortedField = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;

        if(sortedField === 'ContactLink') {
            this.sortedBy = 'ContactLink';
            this.sortedByFieldName = 'Contact__r.Name';
            this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
            this.nameSortDir = this.sortedDirection;

        } else if(sortedField === 'FirmLeftLink') {
            this.sortedBy = 'FirmLeftLink';
            this.sortedByFieldName = 'Firm_Left__r.Name';
            this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
            this.nameSortDir = this.sortedDirection;
        }
        else if(sortedField === 'Old_Title__c') {
            this.sortedBy = 'Old_Title__c';
            this.sortedByFieldName = 'Old_Title__c';
            this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
            this.nameSortDir = this.sortedDirection;
        }
        else if(sortedField === 'DateField') {
            this.sortedBy = 'DateField';
            this.sortedByFieldName = 'CreatedDate';
            this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
            this.nameSortDir = this.sortedDirection;
        } else {
            this.sortedBy = 'DateField';
            this.sortedByFieldName = 'CreatedDate';
            this.sortedDirection =  'desc';
            this.nameSortDir = this.sortedDirection;
        }

        // Get related marketplace Job Changes records
        getAllRelatedSortedJobChangesRecords({
            recordId: this.recordId,
            recordLimit: this.offset,
            offset: 0,
            sortBy: this.sortedByFieldName,
            sortOrder: this.sortedDirection
        }).then (relatedSortedJobChanges => {
            if (relatedSortedJobChanges) {
                var tempSortedJobChanges = [];  
                for (var i = 0; i < relatedSortedJobChanges.length; i++) {  
                    let tempJobChangesRecord = Object.assign({}, relatedSortedJobChanges[i]); //cloning object  
                    if(this.isCommunityBoolean)
                    {
                        if( tempJobChangesRecord.Contact__c != undefined)
                            tempJobChangesRecord.ContactLink = "/"+this.communityName+"/s/detail/" + tempJobChangesRecord.Contact__c;

                        if( tempJobChangesRecord.Firm_Left__c != undefined)
                            tempJobChangesRecord.FirmLeftLink = "/"+this.communityName+"/s/detail/" + tempJobChangesRecord.Firm_Left__c;
                    }
                    else
                    {
                        if( tempJobChangesRecord.Contact__c != undefined)
                            tempJobChangesRecord.ContactLink = "/" + tempJobChangesRecord.Contact__c;

                        if( tempJobChangesRecord.Firm_Left__c != undefined)
                            tempJobChangesRecord.FirmLeftLink = "/" + tempJobChangesRecord.Firm_Left__c;
                    }
                    if( tempJobChangesRecord.Contact__c != undefined)
                        tempJobChangesRecord.ContactName = tempJobChangesRecord.Contact__r.Name;

                    if( tempJobChangesRecord.Firm_Left__c != undefined)
                        tempJobChangesRecord.FirmLeftName = tempJobChangesRecord.Firm_Left__r.Name;

                    var date = new Date(tempJobChangesRecord.CreatedDate);
                    tempJobChangesRecord.DateField = MONTHNAMES[date.getMonth()] + ' ' + date.getFullYear();

                    tempSortedJobChanges.push(tempJobChangesRecord);             
                }
                this.relatedJobChangesRecords = tempSortedJobChanges;
                this.offset = tempSortedJobChanges.length; 
                this.isLoading = false;
            }
        }) .catch(error => {
            this.isLoading=false;
        });
    }

    loadMoreData(event) {
        if(this.totalRelatedjobChangesCount > this.offset) {
            //Display a spinner to signal that data is being loaded
            if(this.relatedJobChangesRecords != null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            getAllContactRelatedJobChangesRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset
            }) .then (relatedJobChanges => {
                var tempSearchList = [];  
                for (var i = 0; i < relatedJobChanges.length; i++) {  
                    let tempJobChangesRecord = Object.assign({}, relatedJobChanges[i]); //cloning object 
                    if(this.isCommunityBoolean )
                    {
                        if( tempJobChangesRecord.Contact__c != undefined)
                            tempJobChangesRecord.ContactLink = "/"+this.communityName+"/s/detail/" + tempJobChangesRecord.Contact__c;

                        if( tempJobChangesRecord.Firm_Left__c != undefined)
                            tempJobChangesRecord.FirmLeftLink = "/"+this.communityName+"/s/detail/" + tempJobChangesRecord.Firm_Left__c;
                    }
                    else
                    {
                        if( tempJobChangesRecord.Contact__c != undefined)
                            tempJobChangesRecord.ContactLink = "/" + tempJobChangesRecord.Contact__c;

                        if( tempJobChangesRecord.Firm_Left__c != undefined)
                            tempJobChangesRecord.FirmLeftLink = "/" + tempJobChangesRecord.Firm_Left__c;
                    }
                    if( tempJobChangesRecord.Contact__c != undefined)
                        tempJobChangesRecord.ContactName = tempJobChangesRecord.Contact__r.Name;

                    if( tempJobChangesRecord.Firm_Left__c != undefined)
                        tempJobChangesRecord.FirmLeftName = tempJobChangesRecord.Firm_Left__r.Name;
                    
                    var date = new Date(tempJobChangesRecord.CreatedDate);
                    tempJobChangesRecord.DateField = MONTHNAMES[date.getMonth()] + ' ' + date.getFullYear();

                    tempSearchList.push(tempJobChangesRecord);  
                }
             
                if(this.relatedJobChangesRecords)
                    this.relatedJobChangesRecords =  this.relatedJobChangesRecords.concat(tempSearchList);
                if((this.offset+50) >= this.totalRelatedjobChangesCount || (this.offset) == 0)
                {
                    this.offset = this.totalRelatedjobChangesCount;
                    this.plusSign = '';
                } else {
                    this.offset = parseInt(this.offset ) + parseInt(this.limit);
                    this.plusSign = '+';
                }

                this.loadMoreStatus = '';
                if(this.tableElement){
                    this.tableElement.isLoading = false;
                }    
            }) .catch(error => {
                console.log("Error:" , error);
            });
        }
    }
}