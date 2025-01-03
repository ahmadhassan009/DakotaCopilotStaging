import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getContactRelatedSearchesRecords from '@salesforce/apex/SearchesRelatedToContactsController.getContactRelatedSearchesRecords';
import getContactRelatedSearchesCount from '@salesforce/apex/SearchesRelatedToContactsController.getContactRelatedSearchesCount';
import NAME_FIELD from '@salesforce/schema/Marketplace_Searches__c.Name';
import ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Asset_Class__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Sub_Asset_Class__c';
import AMOUNT_FIELD from '@salesforce/schema/Marketplace_Searches__c.Amount__c';
import DEADLINE_FIELD from '@salesforce/schema/Marketplace_Searches__c.End_Date__c';
import STATUS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Search_Status__c';
import activeCommunities from '@salesforce/label/c.active_communities';

const COLUMNS = [
    { label: 'Search Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Account', sortable: true, fieldName: "AccountLink", type: "url", typeAttributes: { label: { fieldName: 'AccountName' }, tooltip: { fieldName: 'AccountName' }, target: '_self'}},
    { label: 'Asset Class', sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Sub-Asset Class', fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Amount', sortable: true, fieldName: AMOUNT_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: '2' }, cellAttributes: { alignment: 'left' }},
    { label: 'Deadline', sortable: true, fieldName: DEADLINE_FIELD.fieldApiName, type: "date-local", typeAttributes: { day: "numeric", month: "numeric", year: "numeric" }},
    { label: 'Search Status', sortable: true, fieldName: STATUS_FIELD.fieldApiName, type: 'Picklist' }
]

export default class SearchesRelatedToContact extends NavigationMixin(LightningElement) {
    
    @api recordId;
    isLoading = false;
    columns = COLUMNS;
    totalRecords = 0;
    relatedSearchesRecords;
    baseURL = '';
    recordsExist = false;
    sortedDirection = 'asc';
    sortedBy = NAME_FIELD.fieldApiName;
    nullOrder = 'LAST';
    defaultSortDirection = 'asc';
    nameSortDir = this.defaultSortDirection;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 10 records of Marketplace Searches
    */
    connectedCallback() {
        this.isLoading = true;

        //To fetch number of Marketplace Searches records
        getContactRelatedSearchesCount({
            recordId : this.recordId
        }).then(returnedCount => {
            this.isLoading = false;
            if(returnedCount == 0) {
                this.recordsExist = false;
            }
            else {
                this.recordsExist = true;
            }
            if(returnedCount > 10) {
                this.totalRecords = '10+';
            } 
            else {
                this.totalRecords = returnedCount;
            }
            if(returnedCount>0)
            {   
                //To fetch Marketplace Searches records
                this.getRecords(this.recordId, this.sortedBy, this.sortedDirection);
                this.sortedDirection = 'asc';
                this.sortedBy = NAME_FIELD.fieldApiName;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    /**
     * To get Marketplace Searches records linked to the account
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Row Order P1)
     * @param sortedDirection sorting direction
    */
    getRecords(recordId, sortedBy, sortedDirection) {
        this.isLoading = true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        //Getting Marketplace Searches records based on the passed Contact Id
        getContactRelatedSearchesRecords({
            recordId : recordId,
            sortedBy : sortedBy,
            sortOrder : sortedDirection,
            nullOrder: this.nullOrder
        }) .then (returnedData => {
            if (returnedData) {
                let length = returnedData.length;
                var tempSearchesList = [];  
                for(let i=0; i<length; i++)
                {
                    let tempRecord = Object.assign({}, returnedData[i]); //cloning object
                    if(tempRecord.Id != undefined)
                        tempRecord.recordLink = "/"+this.communityName + '/s/marketplace-searches/' + tempRecord.Id;
                    if(tempRecord.Account__c != undefined)
                        tempRecord.AccountLink = "/"+this.communityName + '/s/account/' + tempRecord.Account__c;
                    if( tempRecord.Account__c != undefined && tempRecord.Account__r != null && tempRecord.Account__r.Name != null)
                        tempRecord.AccountName = tempRecord.Account__r.Name;
                    tempSearchesList.push(tempRecord);

                }
                this.relatedSearchesRecords = tempSearchesList;
                this.isLoading = false;
               
            } else
            {
                this.relatedSearchesRecords = null;
            }
        }) .catch(error => {
            this.isLoading=false;
        });
    }

    /**
     * For sorting the table based on column and sort direction
     * @param {*} event 
    */
    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        
        let tempSortBy = this.sortedBy;

        if(this.sortedBy === 'recordLink') {
            tempSortBy = NAME_FIELD.fieldApiName;
        } else if(this.sortedBy === 'AccountLink') {
            tempSortBy =  'Account__r.Name';
        }

        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        
        this.getRecords(this.recordId, tempSortBy, this.sortedDirection);
    }

    /**
    * For redirecting to Standard View All page
    */
    handleShowFullRelatedList() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Marketplace_Searches__c',
                relationshipApiName: 'Searches__r',
                actionName: 'view'
            }
        });
    }
    
}