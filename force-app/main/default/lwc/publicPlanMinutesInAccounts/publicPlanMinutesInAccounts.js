import { LightningElement , api} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import NAME_FIELD from '@salesforce/schema/Public_Plan_Minute__c.Name';
import POSTED_DATE_FIELD from '@salesforce/schema/Public_Plan_Minute__c.Posted_Date__c';
import MEETING_URL_FIELD from '@salesforce/schema/Public_Plan_Minute__c.Meeting_Minute_URL__c';
import MEETING_DATE_FIELD from '@salesforce/schema/Public_Plan_Minute__c.Meeting_Date__c';
import activeCommunities from '@salesforce/label/c.active_communities';
import getRecords from '@salesforce/apex/PublicPlanMinutesInAccountsController.getRecords';
import getRecordsCount from '@salesforce/apex/PublicPlanMinutesInAccountsController.getRecordsCount';

const COLUMNS = [
    { label: 'Public Plan Minute', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Posted Date', sortable: true, fieldName: POSTED_DATE_FIELD.fieldApiName, type: 'text',},
    { label: 'Meeting Date', sortable: true, fieldName: MEETING_DATE_FIELD.fieldApiName, type: 'text'},
    { label: 'Meeting Minutes URL', sortable: true, fieldName: MEETING_URL_FIELD.fieldApiName, type: 'url', typeAttributes: { label: { fieldName: MEETING_URL_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: MEETING_URL_FIELD.fieldApiName }}}
]

export default class PublicPlanMinutesInAccounts extends NavigationMixin(LightningElement)  {
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
    sortedBy='Meeting_Date__c';
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'FIRST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback()
    {
        this.fetchRecords();
    }

    fetchRecords()
    {
        this.isLoading = true;
        let tempSortBy = this.sortedBy;
        if(this.sortedBy === MEETING_URL_FIELD.fieldApiName) {
            tempSortBy = MEETING_URL_FIELD.fieldApiName;
        } 
        else if(this.sortedBy === 'Id') {
            tempSortBy = NAME_FIELD.fieldApiName;
        }
        getRecordsCount({
            recordId : this.recordId
        }).then(returnedCount => {
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
                if (this.sortedDirection == 'desc'){
                    this.nullOrder = 'LAST';
                }
                else {
                    this.nullOrder = 'FIRST';
                }
                getRecords({
                    recordId : this.recordId,
                    sortBy: tempSortBy,
                    sortOrder: this.sortedDirection,
                    nullOrder: this.nullOrder,
                    recordLimit: 10,
                    offset: 0
                }).then(returnedData => {
                    this.isLoading = false;
                    if (returnedData) {
                        for(var i=0; i<returnedData.length; i++)
                        {
                            returnedData[i].Id = "/"+this.communityName+'/s/public-plan-minute/'+returnedData[i].Id;
                            const options = {
                                year: 'numeric', month: 'numeric', day: 'numeric'
                                };
                            if(returnedData[i].Posted_Date__c!=null)
                            {
                                let dt = new Date(returnedData[i].Posted_Date__c);
                                returnedData[i].Posted_Date__c = new Intl.DateTimeFormat( 'en-US', options ).format( dt );
                            }
                            if(returnedData[i].Meeting_Date__c!=null)
                            {
                                let dt = new Date(returnedData[i].Meeting_Date__c);
                                returnedData[i].Meeting_Date__c = new Intl.DateTimeFormat( 'en-US', options ).format( dt );
                            }
                            
                        }
                        this.data = returnedData;
                    }
                    else
                    {
                        this.data = null;
                    }
                }).catch(error => {
                    this.isLoading = false;
                });
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.fetchRecords();
    }

    handleShowFullRelatedList()
    {
        var url = '/public-plan-minutes-view-all?id='+this.recordId
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }
}