import { LightningElement , api} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE_FIELD from '@salesforce/schema/Account.Type';
import METROAREA_FIELD from '@salesforce/schema/Account.Metro_Area_Name__c';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';
import WEBSITE_FIELD from '@salesforce/schema/Account.Website';
import getAccounts from '@salesforce/apex/CppAndDcPlanRelatedtoAccountController.getCppAndDcPlanAccounts';
import getAccountType from '@salesforce/apex/CppAndDcPlanRelatedtoAccountController.getAccountType';

import getAccountsCount from '@salesforce/apex/CppAndDcPlanRelatedtoAccountController.getCppAndDcPlanAccountsCount';
import CURRENCY from '@salesforce/i18n/currency';
import LOCALE from '@salesforce/i18n/locale';
import activeCommunities from '@salesforce/label/c.active_communities';

const COLUMNS = [
    { label: 'Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Type', sortable: true, fieldName: TYPE_FIELD.fieldApiName, type: 'text',},
    { label: 'Metro Area', sortable: true, fieldName: 'MetroArea__c', type: 'url', typeAttributes: { label: { fieldName: METROAREA_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: METROAREA_FIELD.fieldApiName }}},
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'text'},
]

export default class CppAndDcPlanRelatedtoAccount extends NavigationMixin(LightningElement)  {
    @api recordId;
    recordsExists = false;
    columns;
    data;
    baseURL = '';
    isLoading=false;
    totalRecords = '0';
    listName = '';
    accountType;

    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy='Id';
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'FIRST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback()
    {
        this.columns = COLUMNS.slice();   
        getAccountType({recordId: this.recordId}).then(resp => {
            if(resp && resp.Type == 'Corporation') {
                this.fetchAccountsData();
            }
        }).catch(error => {
            console.log('error in fetching account type', error);
        })
        
    }

    fetchAccountsData(){
        this.isLoading = true;
        let tempSortBy = this.sortedBy;
        if(this.sortedBy === 'MetroArea__c') {
            tempSortBy = METROAREA_FIELD.fieldApiName;
        } 
        else if(this.sortedBy === 'Id') {
            tempSortBy = NAME_FIELD.fieldApiName;
        }
        getAccountsCount({
            recordId : this.recordId,
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
                getAccounts({
                    recordId : this.recordId,
                    sortBy: tempSortBy,
                    sortOrder: this.sortedDirection,
                    nullOrder: this.nullOrder
                }).then(returnedData => {
                    if (returnedData) {
                        for(var i=0; i<returnedData.length; i++)
                        {
                            returnedData[i].Id = "/"+this.communityName+'/s/account/'+returnedData[i].Id;
                            if(returnedData[i].MetroArea__c!=null)
                                returnedData[i].MetroArea__c = "/"+this.communityName+'/s/metro-area/'+returnedData[i].MetroArea__c;
                            if(returnedData[i].AUM__c !=null)
                            {
                                var number = parseFloat(returnedData[i].AUM__c);
                                returnedData[i].AUM__c = new Intl.NumberFormat(LOCALE, {
                                style: 'currency',
                                currency: CURRENCY,
                                currencyDisplay: 'symbol'
                                }).format(number);
                                returnedData[i].AUM__c = returnedData[i].AUM__c.replace('.00','');
                            }
                        }
                        this.data = returnedData;
                        this.isLoading = false;
                    }
                    else
                    {
                        this.data = null;
                        this.isLoading = false;
                    }
                }).catch(error => {
                    this.isLoading = false;
                });
            }
        }).catch(error => {
            console.log(error);
            this.isLoading = false;
        });
    }

    handleShowFullRelatedList()
    {
        var relationshipName = '';
        relationshipName = 'Retirement_Plan__r';
        let viewAllUrl;
        viewAllUrl = '/retirement-plan-list?recordId=' + this.recordId + '&relationshipApiName='+relationshipName;

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: viewAllUrl
                }
            });
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.fetchAccountsData();
    }
}