import { LightningElement,api } from 'lwc';
import getRecordsCount from '@salesforce/apex/FundServiceProvidersController.getRecordsCount';
import getAllRecords from '@salesforce/apex/FundServiceProvidersController.getAllRecords';
import getRecordsRelaedAccountName from '@salesforce/apex/FundServiceProvidersController.getRecordsRelaedAccountName';
import PAYMENT_TYPE_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Payment_type__c';
import NAME_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Name';
import { refreshApex } from '@salesforce/apex';
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import SERVICE_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Service__c';
import DIRECT_AMOUNT_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Provider_Other_Direct_Comp__c';
import ADDITIONAL_DETAILS_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Additional_Details__c';
import ROW_ORDER_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Row_Order__c';
import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';

const COLUMNS = [
    { label: 'Fund Service Provider Name', initialWidth: 220, sortable: true, fieldName: 'Id', type: 'url', wrapText: true, typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Service Provider', initialWidth: 190, fieldName: 'customValue', type: 'swapTextAndUrl', },
    { label: 'Primary Service', sortable: true, fieldName: SERVICE_FIELD.fieldApiName, type: 'text',wrapText: true},
    { label: 'Additional Details', sortable: false, fieldName: ADDITIONAL_DETAILS_FIELD.fieldApiName, type: 'text',wrapText: true},
    { label: 'Direct Comp Amount', initialWidth: 175, sortable: true, fieldName: DIRECT_AMOUNT_FIELD.fieldApiName, type: 'currency',cellAttributes: { alignment: 'left' },typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Payment Type', initialWidth: 130, sortable: true, fieldName: PAYMENT_TYPE_FIELD.fieldApiName, type: 'text'}
]

export default class AllFundServiceProviders extends LightningElement {
    @api accountId;
    accountNameLink;
    accountDefault;
    plusSign='';
    columns = COLUMNS;
    isLoading=false;
    totalRelatedCount=0;
    relatedRecords = [];
    offset = 0;
    limit = 50;
    sortedDirection = 'asc';
    sortedBy = ROW_ORDER_FIELD.fieldApiName;
    fromLoadMore = false;
    fromRefresh = false;
    isSorted = false;
    accountName = '';
    nullOrder ='LAST'
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    connectedCallback() {
        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);
        this.isLoading = true;
        this.accountNameLink = "/" + this.communityName + '/s/account/'+this.accountId;
        this.accountDefault = "/" + this.communityName + '/s/account/Account/Default';
        this.getTotalRecordCount();
        this.fetchRecord();
        this.getRecordsRelaedAccount();
    }

    getRecordsRelaedAccount() {
        getRecordsRelaedAccountName({
            recordId : this.accountId
        }).then(result => {
            this.accountName = result;
        }).catch(error => {
            console.log('Error : ', error);
        });
    }

    getTotalRecordCount() {
        getRecordsCount({
            recordId : this.accountId
        }).then(count => {
            if (count) {
                this.totalRelatedCount = count;
            }
        }).catch(error => {
            console.log('Error : ', error);
        });
    }

    setNullOrder(sortedDirection) {
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
    }
    fetchRecord() {
        this.setNullOrder(this.sortedDirection);
        getAllRecords({
            recordId : this.accountId,
            sortedBy : this.sortedBy,
            sortOrder : this.sortedDirection,
            recordLimit: this.limit,
            offset: this.offset,
            nullOrder: this.nullOrder
        }).then(returnedData => {
            var tempList = [];
            if (returnedData.length > 0) {
                for(var i=0; i<returnedData.length; i++)
                {
                    let tempRecord = Object.assign({}, returnedData[i]);
                    tempRecord.Id = "/"+this.communityName+'/s/fund-service-provider/'+tempRecord.Id;
                    if(tempRecord.Service_Provider_Account__c && tempRecord.Service_Provider_Account__r.X100_Marketplace__c) {
                        tempRecord.customValue ={ islink: true,value:"/"+this.communityName+'/s/account/'+tempRecord.Service_Provider_Account__c,Name:tempRecord.Service_Provider_Account__r.Name} ;
                    }
                    else if(tempRecord.Provider_Other_Name__c) {
                        tempRecord.customValue ={ islink: false,value:tempRecord.Provider_Other_Name__c}  
                    }
                    else {
                        tempRecord.customValue ={ islink: false,value:''};
                    }

                    tempList.push(tempRecord);   
                }

                if (this.offset == 0) {
                    this.fromRefresh = false;
                }
                this.relatedRecords = this.relatedRecords.concat(tempList);
                if ((this.offset + this.limit) >= this.totalRelatedCount) {
                    this.plusSign = '';
                }
                else {
                    this.plusSign = '+';
                }
                this.offset += tempList.length;

                if(this.fromLoadMore){
                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                      }
                }
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('error in data : ', error);
        });
    }
    onHandleSort(event) {
        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;
        this.offset = 0;
        this.limit = 50;
        this.relatedRecords= [];
        this.isLoading = true;

        this.sortedBy = sortedBy
       
        this.sortedDirection = sortDirection;
        this.fetchRecord();
    }

    loadMoreData(event) {
        if (this.totalRelatedCount != this.offset && this.offset>0) {
            //Display a spinner to signal that data is being loaded
            if (!this.fromRefresh) {
                if (this.relatedRecords != null && event.target) {
                    event.target.isLoading = true;
                }
                this.tableElement = event.target;
                this.offset = this.relatedRecords.length;
                this.fromLoadMore = true;
                this.fetchRecord();
            }
        }
    }

    refreshTable(event)
    {
        this.isLoading = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.fromRefresh = true;
        this.sortedDirection = 'asc';
        this.sortedBy = ROW_ORDER_FIELD.fieldApiName;
        this.relatedRecords= [];
         var table = this.template.querySelector('c-fundsp-custom-data-table');
         if(table!=null)
            table.enableInfiniteLoading = true;
        return refreshApex(this.fetchRecord());
    }
    
}