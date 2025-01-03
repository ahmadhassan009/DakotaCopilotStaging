import { LightningElement , api} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import NAME_FIELD from '@salesforce/schema/Dakota_Content__c.Name';
import DATE_FIELD from '@salesforce/schema/Dakota_Content__c.Date__c';
import TYPE_FIELD from '@salesforce/schema/Dakota_Content__c.Type__c';
import FEATURED_ON_FIELD from '@salesforce/schema/Dakota_Content__c.Featured_On__c';
import PRESENTATION_FIELD from '@salesforce/schema/Dakota_Content__c.Presentation_Recording_url__c';
import activeCommunities from '@salesforce/label/c.active_communities';
import getRecords from '@salesforce/apex/DakotaContentInAccountsController.getRecords';
import getRecordsCount from '@salesforce/apex/DakotaContentInAccountsController.getRecordsCount';

const COLUMNS = [
    { label: 'Dakota Content Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Date', sortable: true, fieldName: DATE_FIELD.fieldApiName, type: 'text'},
    { label: 'Type', sortable: true, fieldName: TYPE_FIELD.fieldApiName, type: 'text'},
    { label: 'Featured On', sortable: true, fieldName: 'Dakota_Live_Call__c', type: 'url', typeAttributes: { label: { fieldName: FEATURED_ON_FIELD.fieldApiName}, target: '_self', tooltip: { fieldName: FEATURED_ON_FIELD.fieldApiName }}},
    { label: 'Presentation Recording', sortable: true, fieldName: PRESENTATION_FIELD.fieldApiName, type: 'url', typeAttributes: { label: 'Click Here to Watch'}}
]

export default class DakotaContentInAccounts extends NavigationMixin(LightningElement)  {
    @api recordId;
    recordsExists = false;
    columns = COLUMNS;
    data;
    baseURL = '';
    recordToDel;
    panelStyling;
    isLoading=false;
    totalRecords = '0';
    listName = '';
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = DATE_FIELD.fieldApiName;
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'LAST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback()
    {   
        this.isLoading = true;
        getRecordsCount({
            recordId : this.recordId
        }).then(returnedCount => {
            this.isLoading = false;
            if(returnedCount == 0) {
                this.recordsExists = false;
            }
            else {
                this.recordsExists = true;
            }
            if(returnedCount > 10){
                this.totalRecords = '10+';
            } 
            else {
                this.totalRecords = returnedCount;
            }
            if(returnedCount>0)
            {   
                this.getRecords(this.recordId, this.sortedBy, this.sortedDirection);
                this.sortedDirection = 'desc';
                this.sortedBy = DATE_FIELD.fieldApiName;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    handleShowFullRelatedList()
    {
        var viewAllUrl = '/account/related/' + this.recordId + '/Dakota_Content__r';
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: viewAllUrl
                }
            });
    }

    /**
     * To get records of Dakota Content
     */
    getRecords(recordId, sortedBy, sortedDirection)
    {   
        this.isLoading = true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        getRecords({
            recordId : recordId,
            sortedBy : sortedBy,
            sortOrder : sortedDirection,
            nullOrder: this.nullOrder
        }).then(returnedData => {
            this.isLoading = false;
            if (returnedData) {
                for(var i=0; i<returnedData.length; i++)
                {
                    returnedData[i].Id = "/"+this.communityName+'/s/dakota-content/'+returnedData[i].Id;

                    if(returnedData[i].Dakota_Live_Call__c!=null)
                    {
                        returnedData[i].Dakota_Live_Call__c = "/"+this.communityName+'/s/dakota-content/'+returnedData[i].Dakota_Live_Call__c;
                        returnedData[i].Featured_On__c = returnedData[i].Featured_On__c.split(">")[1].split('</a')[0];
                    }
                    if(returnedData[i].Date__c!=null)
                    {
                        const options = {
                            year: 'numeric', month: 'numeric', day: 'numeric'
                            };
                        let dt = new Date(returnedData[i].Date__c);
                        returnedData[i].Date__c = new Intl.DateTimeFormat( 'en-US', options ).format( dt );
                    } 
                }
                this.data = returnedData;
                this.isLoading = false;   
            }
            else
            {
                this.data = null;
            }
        }).catch(error => {
            this.isLoading = false;
        });
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
        } else if(this.sortedBy === 'Date__c') {
            tempSortBy =  DATE_FIELD.fieldApiName;
        }else if(this.sortedBy === 'Type__c') {
            tempSortBy = TYPE_FIELD.fieldApiName;
        }else if(this.sortedBy === 'Dakota_Live_Call__c') {
            tempSortBy = 'Dakota_Live_Call__r.name'; 
        }else if(this.sortedBy === 'Presentation_Recording_url__c') {
            tempSortBy = 'Presentation_Recording_url__c';
        }

        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getRecords(this.recordId, tempSortBy, this.sortedDirection);
    }
}