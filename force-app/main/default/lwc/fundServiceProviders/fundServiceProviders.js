import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { loadStyle } from 'lightning/platformResourceLoader';
import NAME_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Name';
import SERVICE_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Service__c';
import DIRECT_AMOUNT_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Provider_Other_Direct_Comp__c';
import PAYMENT_TYPE_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Payment_type__c';
import ROW_ORDER_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Row_Order__c';
import ADDITIONAL_DETAILS_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Additional_Details__c';
import activeCommunities from '@salesforce/label/c.active_communities';
import getRecords from '@salesforce/apex/FundServiceProvidersController.getRecords';
import getRecordsCount from '@salesforce/apex/FundServiceProvidersController.getRecordsCount';
import fundServiceProviderCSS from '@salesforce/resourceUrl/fundServiceProviderCSS';

const COLUMNS = [
    { label: 'Fund Service Provider Name', initialWidth: 220, sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Service Provider', initialWidth: 190, fieldName: 'customValue', type: 'swapTextAndUrl'},
    { label: 'Primary Service', sortable: true, fieldName: SERVICE_FIELD.fieldApiName, type: 'text'},
    { label: 'Additional Details', sortable: false, fieldName: ADDITIONAL_DETAILS_FIELD.fieldApiName, type: 'text'},
    { label: 'Direct Comp Amount', initialWidth: 175, sortable: true, fieldName: DIRECT_AMOUNT_FIELD.fieldApiName, type: 'currency',cellAttributes: { alignment: 'left' },typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Payment Type', initialWidth: 130, sortable: true, fieldName: PAYMENT_TYPE_FIELD.fieldApiName, type: 'text'}
]


export default class FundServiceProviders extends NavigationMixin(LightningElement) {
    @api recordId;
    @api isForm550Page;
    recordsExists = false;
    recordExist = false;
    columns = COLUMNS;
    data;
    baseURL = '';
    panelStyling;
    isLoading=false;
    totalRecords = '0';
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy = ROW_ORDER_FIELD.fieldApiName;
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'LAST';
    viewAllAlignmentAssign = '';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback()
    {   
        //DCS-841: Move view all link to center only for form550 Accounts
        this.viewAllAlignmentAssign = (this.isForm550Page)?'slds-card__footer viewAllAlignment':'slds-card__footer';
        this.isLoading = true;

        Promise.all([
            loadStyle(this, fundServiceProviderCSS)
        ]);


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
                this.sortedDirection = 'asc';
                this.sortedBy = ROW_ORDER_FIELD.fieldApiName;
                this.getRecords(this.recordId, this.sortedBy, this.sortedDirection);
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    /**
     * To get records of Dakota Content
     */
    getRecords(recordId, sortedBy, sortedDirection)
    {   
        this.isLoading = true;

        this.fetchRecord(recordId, sortedBy, sortedDirection);
    }

    setNullOrder(sortedDirection) {
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
    }

    fetchRecord(recordId, sortedBy, sortedDirection) {

        this.setNullOrder(sortedDirection);

        getRecords({
            recordId : recordId,
            sortedBy : sortedBy,
            sortOrder : sortedDirection,
            nullOrder: this.nullOrder
        }).then(returnedData => {
            if (returnedData.length > 0) {
                for(var i=0; i<returnedData.length; i++)
                {
                    returnedData[i].Id = "/"+this.communityName+'/s/fund-service-provider/'+returnedData[i].Id;
                    if(returnedData[i].Service_Provider_Account__c && returnedData[i].Service_Provider_Account__r.X100_Marketplace__c) {
                        returnedData[i].customValue ={ islink: true,value:"/"+this.communityName+'/s/account/'+returnedData[i].Service_Provider_Account__c,Name:returnedData[i].Service_Provider_Account__r.Name} ;
                    }
                    else if(returnedData[i].Provider_Other_Name__c) {
                        returnedData[i].customValue ={ islink: false,value:returnedData[i].Provider_Other_Name__c}  
                    }
                    else {
                        returnedData[i].customValue ={ islink: false,value:''};
                    }
                    
                }
                this.data = returnedData;
                this.recordExist = true;
                this.isLoading = false;
            }
            else
            {
                this.data = null;
                this.recordExist = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('error in data : ', error);
        });
    }


    handleShowFullRelatedList() {
        var url = '/fund-service-providers-view-all?id='+this.recordId
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }

    /**
     * For sorting the direct table
     * @param {*} event 
     */
    columnSorting(event) {
        this.isLoading = true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let tempSortBy = this.sortedBy;
        if(this.sortedBy === 'Id') {
            tempSortBy = 'Name';
        }

        this.SortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.fetchRecord(this.recordId, tempSortBy, this.sortedDirection);
    }
}