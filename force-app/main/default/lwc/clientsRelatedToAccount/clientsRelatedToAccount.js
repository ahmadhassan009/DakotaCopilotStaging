import { LightningElement, api, wire ,track} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getAccountName from '@salesforce/apex/ClientsRelatedToAccountsController.getAccountName';
import getClientAccounts from '@salesforce/apex/ClientsRelatedToAccountsController.getClientAccounts'; 
import getCountOfAllClientAccounts from '@salesforce/apex/ClientsRelatedToAccountsController.getCountOfAllClientAccounts';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import TYPE_FIELD from '@salesforce/schema/Account.Type';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';
import NAME_FIELD from '@salesforce/schema/Account.Name';

const COLUMNS = [
    { label: 'Account Name', sortable: true, fieldName: "accountLink", type: 'url', typeAttributes:  { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Account Type', sortable: true, fieldName: TYPE_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'AUM', sortable: true, fieldName: AUM_FIELD.fieldApiName, type: 'currency', initialWidth: 150, typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Metro Area', sortable: true, fieldName: "metroareaLink", type: "url", typeAttributes: { label: { fieldName: 'metroareaName' }, tooltip:  { fieldName: 'metroareaName' }, target: '_self'}},
    { label: 'Consultant Type', fieldName: 'consultantType', type: 'text'}
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];
const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];

export default class ClientsRelatedToAccount extends NavigationMixin(LightningElement){
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    @track isLoading=false;
    @api isSalesforceInstance = false;
    columns = COLUMNS;
    tempAddAction=[];
    setSelectedRows = [];
    totalClientRecordsCount = 0;
    clientRecords;
    tempClientsList = [];
    newbuttonPressed = false;
    isCommunity = false;
    offset = 0;
    limit = 10;
    plusSign = '';
    baseURL = '';
    recordToDel;
    collapsed = true;
    clientAccountsExists = false;
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = AUM_FIELD.fieldApiName;
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'LAST';

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    
    connectedCallback() {
        this.isLoading = true;
        this.checkIsCommunityInstance(); 
        this.tempAddAction = COLUMNS;
        if(!this.isCommunity)
        {
            this.tempAddAction=[...this.tempAddAction,{
             type: 'action',
             typeAttributes: { rowActions: actions },
            }];
        }
        this.columns = this.tempAddAction;

        this.sortedDirection = 'desc';
        this.sortedBy = AUM_FIELD.fieldApiName;
        this.getClientAccounts(this.recordId, this.sortedBy, this.sortedDirection);
                
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

    // Get related client records for account
    getClientAccounts(recordId, sortedBy, sortedDirection){
        this.isLoading=true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        getClientAccounts({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            nullOrder: this.nullOrder
        }) .then (relatedClientAccounts => {
            if (relatedClientAccounts) {
                var i = 0;
                var index = 0;
                while (index < relatedClientAccounts.length && i< 10) {  
                    var recordExists = false; 
                    let tempRecord = Object.assign({}, relatedClientAccounts[index]); //cloning object  
                    
                    if(tempRecord.General_Consultant__c == this.recordId  && i< 10)
                    {
                        let recordToPush = Object.assign({}, relatedClientAccounts[index]);
                        recordToPush.consultantType = 'General Consultant';
                        if(this.isCommunity )
                        {
                            recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                            }
                        }
                        else
                        {
                            recordToPush.accountLink = "/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                            }
                        }
                        if( recordToPush.MetroArea__c)
                        {
                            recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                        }
                        recordToPush.Id=i;
                        this.tempClientsList.push(recordToPush);
                        i++;
                        recordExists = true;
                    }
                    if(tempRecord.General_Consultant_2__c == this.recordId  && i< 10)
                    {
                        let recordToPush = Object.assign({}, relatedClientAccounts[index]);
                        recordToPush.consultantType = 'General Consultant';
                        if(this.isCommunity )
                        {
                            recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                            }
                        }
                        else
                        {
                            recordToPush.accountLink = "/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                            }
                        }
                        if( recordToPush.MetroArea__c)
                        {
                            recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                        }
                        recordToPush.Id=i;
                        this.tempClientsList.push(recordToPush);
                        i++;
                        recordExists = true;
                    }
                    if(tempRecord.Hedge_Fund_Consultant__c == this.recordId  && i< 10)
                    {
                        let recordToPush = Object.assign({}, relatedClientAccounts[index]);
                        recordToPush.consultantType = 'Hedge Funds Consultant';
                        if(this.isCommunity )
                        {
                            recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                            }
                        }
                        else
                        {
                            recordToPush.accountLink = "/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                            }
                        }
                        if( recordToPush.MetroArea__c)
                        {
                            recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                        }
                        recordToPush.Id=i;
                        this.tempClientsList.push(recordToPush);
                        i++;
                        recordExists = true;
                    }
                    if(tempRecord.Private_Equity_Consultant__c == this.recordId  && i< 10)
                    {
                        let recordToPush = Object.assign({}, relatedClientAccounts[index]);
                        recordToPush.consultantType = 'Private Equity Consultant';
                        if(this.isCommunity )
                        {
                            recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                            }
                        }
                        else
                        {
                            recordToPush.accountLink = "/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                            }
                        }
                        if( recordToPush.MetroArea__c)
                        {
                            recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                        }
                        recordToPush.Id=i;
                        this.tempClientsList.push(recordToPush);
                        i++;
                        recordExists = true;
                    }
                    if(tempRecord.Private_Credit_Consultant__c == this.recordId && i< 10)
                    {
                        let recordToPush = Object.assign({}, relatedClientAccounts[index]);
                        recordToPush.consultantType = 'Private Credit Consultant';
                        if(this.isCommunity )
                        {
                            recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                            }
                        }
                        else
                        {
                            recordToPush.accountLink = "/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                            }
                        }
                        if( recordToPush.MetroArea__c)
                        {
                            recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                        }
                        recordToPush.Id=i;
                        this.tempClientsList.push(recordToPush);
                        i++;
                        recordExists = true;
                    }
                    if(tempRecord.Real_Estate_Consultant__c == this.recordId && i< 10)
                    {
                        let recordToPush = Object.assign({}, relatedClientAccounts[index]);
                        recordToPush.consultantType = 'Real Estate Consultant';
                        if(this.isCommunity )
                        {
                            recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                            }
                        }
                        else
                        {
                            recordToPush.accountLink = "/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                            }
                        }
                        if( recordToPush.MetroArea__c)
                        {
                            recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                        }
                        recordToPush.Id=i;
                        this.tempClientsList.push(recordToPush);
                        i++;
                        recordExists = true;
                    }
                    /////
                    if(tempRecord.DC_Consultant__c == this.recordId && i< 10)
                    {
                        let recordToPush = Object.assign({}, relatedClientAccounts[index]);
                        recordToPush.consultantType = 'DC Consultant';
                        if(this.isCommunity )
                        {
                            recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                            }
                        }
                        else
                        {
                            recordToPush.accountLink = "/" + recordToPush.Id;
                            if( recordToPush.MetroArea__c)
                            {
                                recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                            }
                        }
                        if( recordToPush.MetroArea__c)
                        {
                            recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                        }
                        recordToPush.Id=i;
                        this.tempClientsList.push(recordToPush);
                        i++;
                        recordExists = true;
                    }
                    ////
                    if(recordExists == false)
                    {
                        i++;
                    }
                    index++;          
                }

                this.clientRecords=[];
                this.clientRecords = this.tempClientsList;
                this.tempClientsList = [];
                this.offset = i;

               if(this.offset > 0)
                {
                    this.collapsed =false;
                }
                else
                {
                    this.collapsed =true;
                }
                //To get count of related searches records
                getCountOfAllClientAccounts({
                    recordId: this.recordId
                }) .then (clientsRecordCount => {
                    this.isLoading=false;
                    if(clientsRecordCount == 0 && (this.communityName == 'dakotaMarketplace' || this.communityName == 'marketplace2')) {
                        this.clientAccountsExists = false;
                    }
                    else {
                        this.clientAccountsExists = true;
                    }
                    this.totalClientRecordsCount = clientsRecordCount;
                    if(this.offset >= this.totalClientRecordsCount){
                        this.plusSign = '';
                    } 
                    else {
                        this.plusSign = '+';
                    }
                }) .catch(error => {
                    this.isLoading=false;
                });
            }
        }) .catch(error => {
            this.isLoading=false;
        });
    }

    // To refresh table
    refreshTable(event) {
        this.connectedCallback();
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

    //Handle row actions for datatable
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this.deleteRow(row);
                break;
            case 'edit':
                this.navigateToRecordEditPage(row);
                break;
            default:
        }
    }

    //Deletion handler
    deleteRow(row) {
        this.isLoading=true;
        this.recordToDel= JSON.stringify(row.Id).replace(/['"]+/g, '');

        deleteRecord(this.recordToDel)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record deleted',
                        variant: 'success'
                    })

                );
                this.isLoading=false;
                return refreshApex(this.connectedCallback());

            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: 'Error Occured While Deleting The Record',
                        variant: 'error'
                    })
                );
                this.isLoading=false;
            });
    }

    //Edit handler
    navigateToRecordEditPage(row) {
        let { Id } = row;
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: Id,
                    actionName: 'edit'
                }
            });
        }

    createNewRecord(event) {
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });
    
        onError(error => {
            console.error('Received error from server SF: ', error);
        });
        this.newbuttonPressed = true;
        let newAccountRecord = { 
            type: 'standard__objectPage', 
            attributes: { objectApiName: 'Account', actionName: 'new' },
            state: {
                navigationLocation: "RELATED_LIST",
                useRecordTypeCheck:'yes'
            },
        };  
        this[NavigationMixin.Navigate](newAccountRecord);
        this.newbuttonPressed = true;
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
    }

    @wire(getAccountName, {recordId:'$recordId'})
    loadAccountName (accountName) {
        if(accountName.data) {
            this.recordName = accountName.data;
        }
    }

    handleShowFullRelatedList() {
        var navigationURL = this.baseURL +'/lightning/cmp/c__ClientsRelatedToAccountDataTableView?c__recordId='+this.recordId+'&c__recordName='+this.recordName+'&c__isCommunity='+ this.isCommunity;
        var url = '/view-client-accounts?recordId=' + this.recordId + '&recordName=' + this.recordName + '&isCommunity=' + this.isCommunity;

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

    /**
     * For sorting the table
     * @param {*} event 
     */
     updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        
        let tempSortBy = this.sortedBy;
        if(this.sortedBy === 'accountLink') {
            tempSortBy = 'Name';
        } else if(this.sortedBy === 'Type') {
            tempSortBy =  TYPE_FIELD.fieldApiName;
        }else if(this.sortedBy === 'AUM__c') {
            tempSortBy = AUM_FIELD.fieldApiName;
        }else if(this.sortedBy === 'metroareaLink') {
            tempSortBy = 'MetroArea__r.Name'; 
        }

        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getClientAccounts(this.recordId, tempSortBy, this.sortedDirection);
    }
}