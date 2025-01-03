import { LightningElement , api} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE_FIELD from '@salesforce/schema/Account.Type';
import METROAREA_FIELD from '@salesforce/schema/Account.Metro_Area_Name__c';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';
import WEBSITE_FIELD from '@salesforce/schema/Account.Website';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getAccounts from '@salesforce/apex/ChildAccountsInAccountsController.getAccounts';
import getAccountsCount from '@salesforce/apex/ChildAccountsInAccountsController.getAccountsCount';
import CURRENCY from '@salesforce/i18n/currency';
import LOCALE from '@salesforce/i18n/locale';
import activeCommunities from '@salesforce/label/c.active_communities';

import getAccountName from '@salesforce/apex/ContactRelatedToAccountController.getAccountName';

const COLUMNS = [
    { label: 'Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Type', sortable: true, fieldName: TYPE_FIELD.fieldApiName, type: 'text',},
    { label: 'Metro Area', sortable: true, fieldName: 'MetroArea__c', type: 'url', typeAttributes: { label: { fieldName: METROAREA_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: METROAREA_FIELD.fieldApiName }}},
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'text'}
]

export default class ChildAccountsInAccounts extends NavigationMixin(LightningElement)  {
    @api recordId;
    @api listType;
    recordsExists = false;
    columns;
    data;
    baseURL = '';
    recordToDel;
    panelStyling;
    isLoading=false;
    totalRecords = '0';
    listName = '';
    recordType = '';
    faTeamsList = ['Bank','Broker-Dealer','Broker Dealer'];
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortedBy='Id';
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'FIRST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback()
    {
        if(this.listType == 'TAMP')
        {
            this.columns = COLUMNS.slice();
            this.listName = 'Accounts (TAMP)';
        }
        else
        {
            this.listName = 'Child Accounts';
            this.columns = COLUMNS.slice();
            this.columns.push({ label: 'Website',sortable: true, fieldName: WEBSITE_FIELD.fieldApiName, type: 'url', typeAttributes: { label: { fieldName: WEBSITE_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: WEBSITE_FIELD.fieldApiName }}});            
        }
        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordType = returnedAccount.Type;
                if(this.listType != 'TAMP' &&this.recordType && this.faTeamsList.includes(this.recordType)) {
                    this.listName = 'FA Teams';
                }
            }
        });
        this.fetchAccountsData();
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
            listType : this.listType
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
                    listType: this.listType,
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
        var viewAllUrl = '';
        if(this.listType == 'TAMP' && this.listName != 'FA Teams')
        {
            relationshipName = 'Accounts1__r';
            viewAllUrl = '/account/related/' + this.recordId + '/'+relationshipName;
        }
        else if(this.listType != 'TAMP' && this.listName == 'FA Teams') {
            viewAllUrl = '/view-fa-team-child-accounts?recordId=' + this.recordId;
        }
        else
        {
            relationshipName = 'ParentAccount__r';
            viewAllUrl = '/account/related/' + this.recordId + '/'+relationshipName;
        }
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