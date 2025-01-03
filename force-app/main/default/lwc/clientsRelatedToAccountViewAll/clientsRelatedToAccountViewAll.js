import { LightningElement, api,track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getAccountName from '@salesforce/apex/ClientsRelatedToAccountsController.getAccountName';
import getAllClientAccounts from '@salesforce/apex/ClientsRelatedToAccountsController.getAllClientAccounts'; 
import getCountOfAllClientAccounts from '@salesforce/apex/ClientsRelatedToAccountsController.getCountOfAllClientAccounts';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';

const COLUMNS = [
    { label: 'Account Name',sortable: 'true', fieldName: "accountLink", type: 'url', typeAttributes:  { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Account Type',sortable: 'true', fieldName: 'accountType', type: 'text'},
    { label: 'AUM', sortable: 'true', fieldName: AUM_FIELD.fieldApiName, type: 'currency', initialWidth: 150, typeAttributes: { minimumFractionDigits: '0' }},
    { label: 'Metro Area',sortable: 'true', fieldName: "metroareaLink", type: "url", typeAttributes: { label: { fieldName: 'metroareaName' }, tooltip:  { fieldName: 'metroareaName' }, target: '_self'}},
    { label: 'Consultant Type', fieldName: 'consultantType', type: 'text'}
]
const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

export default class ClientsRelatedToAccountViewAll extends NavigationMixin(LightningElement) 
{
    subscription = {};
    CHANNEL_NAME = '/event/refreshComponents__e';
    @api recordId;
    @api recordName;
    @api isCommunity;
    recordLink;
    maNameLink;
    currentClientRecords = [];
    allClientRecords = [];
    allClientRecordsCount;
    currentClientRecordsCount;
    columns = COLUMNS;
    tempAddAction = [];
    isCommunityBoolean;
    queryOffset = 0;
    queryLimit = 50;
    defaultSortDirection = 'asc';
    sortedDirection = 'desc';
    nameSortDir = this.defaultSortDirection;
    sortedBy = AUM_FIELD.fieldApiName;
    sortDirection;
    @track isLoading=false;
    newbuttonPressed = false;
    plusSign = null;
    recordShown = 0;
    dataIndex = 0; // added with fix of DSC-535
    uniqueVal = 0; // added with fix of DSC-535
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.isCommunityBoolean = this.isCommunity == 'false' ? false : true;
        // To set links for breadcrumbs
        this.setLinks();

        this.tempAddAction = COLUMNS;
        if(!this.isCommunityBoolean)
        {
            this.tempAddAction=[...this.tempAddAction,{
             type: 'action',
             typeAttributes: { rowActions: actions },
            }];
        }
        this.columns = this.tempAddAction;

        getCountOfAllClientAccounts({
            recordId: this.recordId
        }) .then (returnedRecordCount => {
            if(returnedRecordCount) {
                this.allClientRecordsCount = returnedRecordCount;
                getAllClientAccounts({
                    recordId: this.recordId
                }) .then (relatedClientAccounts => {
                    if (relatedClientAccounts) {
                        this.allClientRecords = relatedClientAccounts;
                        this.processClientRecords();
                    }
                }) .catch(error => {
                    this.isLoading=false;
                });
            }
        }) .catch(error => {});


        getAccountName({
            recordId : this.recordId
        }).then(returnedAccountName => {
            if(returnedAccountName)
            {
                this.recordName = returnedAccountName;
            }
        });

        //To get base url of the instance
        getSFBaseUrl().then(baseURL => {
            if(baseURL) {
                this.baseURL = baseURL;
            }
        })
        .catch(error => {
            this.isLoading = false;
            console.log("Error:" , error);
        });
    }

    onHandleSort(event) {
    }

    loadMoreData(event) {
        if(this.allClientRecordsCount > this.queryOffset) {
            const { target } = event;
            //Display a spinner to signal that data is being loaded   
            target.isLoading = true;
            this.processClientRecords();
            target.isLoading = false;
        }
    }

    processClientRecords() {
        var tempClientsList = [];
        var i = this.queryOffset;  
        var index = this.queryOffset; // this was discarded in DSC-535
        var limit = this.queryLimit + this.queryOffset;
        while (i < this.allClientRecordsCount && i< limit) { 
            var recordExists = false; 
            //this.dataIndex keeps track of the index of main array to keep track of the records traversed
            let tempRecord = Object.assign({}, this.allClientRecords [this.dataIndex]); //cloning object 
            
            if(tempRecord.General_Consultant__c == this.recordId && (tempRecord.General_Consultant__c != null || tempRecord.General_Consultant__c != undefined))
            {
                
                let recordToPush = Object.assign({}, this.allClientRecords [this.dataIndex]);
                recordToPush.consultantType = 'General Consultant';
                recordToPush.accountType = recordToPush.Type;
                this.uniqueVal++;
                recordToPush.UniqueVal = this.uniqueVal;
                if(this.isCommunityBoolean )
                {
                    recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                }
                else
                {
                    recordToPush.accountLink = "/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                    recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                }
                if( recordToPush.MetroArea__c != undefined)
                {
                    recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                }
                tempClientsList.push(recordToPush);
                i++;
                recordExists = true;
            }
            if(tempRecord.General_Consultant_2__c == this.recordId && (tempRecord.General_Consultant_2__c != null || tempRecord.General_Consultant_2__c != undefined))
            {
                let recordToPush = Object.assign({}, this.allClientRecords [this.dataIndex]);
                recordToPush.consultantType = 'General Consultant';
                recordToPush.accountType = recordToPush.Type;
                this.uniqueVal++;
                recordToPush.UniqueVal = this.uniqueVal;
                if(this.isCommunityBoolean )
                {
                    recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                }
                else
                {
                    recordToPush.accountLink = "/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                }
                if( recordToPush.MetroArea__c != undefined)
                {
                    recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                }
                tempClientsList.push(recordToPush);
                i++;
                recordExists = true;
            }
           
            if(tempRecord.Hedge_Fund_Consultant__c == this.recordId && (tempRecord.Hedge_Fund_Consultant__c != null || tempRecord.Hedge_Fund_Consultant__c != undefined))
            {
                let recordToPush = Object.assign({}, this.allClientRecords [this.dataIndex]);
                recordToPush.consultantType = 'Hedge Funds Consultant';
                recordToPush.accountType = recordToPush.Type;
                this.uniqueVal++;
                recordToPush.UniqueVal = this.uniqueVal;
                if(this.isCommunityBoolean )
                {
                    recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                }
                else
                {
                    recordToPush.accountLink = "/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                }
                if( recordToPush.MetroArea__c != undefined)
                {
                    recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                }
                tempClientsList.push(recordToPush);
                i++;
                recordExists = true;
            }
            if(tempRecord.Private_Equity_Consultant__c == this.recordId && (tempRecord.Private_Equity_Consultant__c != null || tempRecord.Private_Equity_Consultant__c != undefined))
            {
                let recordToPush = Object.assign({}, this.allClientRecords [this.dataIndex]);
                recordToPush.consultantType = 'Private Equity Consultant';
                recordToPush.accountType = recordToPush.Type;
                this.uniqueVal++;
                recordToPush.UniqueVal = this.uniqueVal;
                if(this.isCommunityBoolean )
                {
                    recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                }
                else
                {
                    recordToPush.accountLink = "/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                }
                if( recordToPush.MetroArea__c != undefined)
                {
                    recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                }
                tempClientsList.push(recordToPush);
                i++;
                recordExists = true;
            }
            if(tempRecord.Private_Credit_Consultant__c == this.recordId && (tempRecord.Private_Credit_Consultant__c != null || tempRecord.Private_Credit_Consultant__c != undefined))
            {
                let recordToPush = Object.assign({}, this.allClientRecords [this.dataIndex]);
                recordToPush.consultantType = 'Private Credit Consultant';
                recordToPush.accountType = recordToPush.Type;
                this.uniqueVal++;
                recordToPush.UniqueVal = this.uniqueVal;
                if(this.isCommunityBoolean )
                {
                    recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                }
                else
                {
                    recordToPush.accountLink = "/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                }
                if( recordToPush.MetroArea__c != undefined)
                {
                    recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                }
                tempClientsList.push(recordToPush);
                i++;
                recordExists = true;
            }
            if(tempRecord.Real_Estate_Consultant__c == this.recordId && (tempRecord.Real_Estate_Consultant__c != null || tempRecord.Real_Estate_Consultant__c != undefined))
            {
                let recordToPush = Object.assign({}, this.allClientRecords [this.dataIndex]);
                recordToPush.consultantType = 'Real Estate Consultant';
                recordToPush.accountType = recordToPush.Type;
                this.uniqueVal++;
                recordToPush.UniqueVal = this.uniqueVal;
                if(this.isCommunityBoolean )
                {
                    recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                }
                else
                {
                    recordToPush.accountLink = "/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                }
                if( recordToPush.MetroArea__c != undefined)
                {
                    recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                }
                tempClientsList.push(recordToPush);
                i++;
                recordExists = true;
            }
            if(tempRecord.DC_Consultant__c == this.recordId && (tempRecord.DC_Consultant__c != null || tempRecord.DC_Consultant__c != undefined))
            {
                let recordToPush = Object.assign({}, this.allClientRecords [this.dataIndex]);
                recordToPush.consultantType = 'DC Consultant';
                recordToPush.accountType = recordToPush.Type;
                this.uniqueVal++;
                recordToPush.UniqueVal = this.uniqueVal;
                if(this.isCommunityBoolean )
                {
                    recordToPush.accountLink = "/"+this.communityName+"/s/detail/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/"+this.communityName+"/s/detail/" + recordToPush.MetroArea__c;
                }
                else
                {
                    recordToPush.accountLink = "/" + recordToPush.Id;
                    if( recordToPush.MetroArea__c != undefined)
                        recordToPush.metroareaLink = "/" + recordToPush.MetroArea__c;
                }
                if( recordToPush.MetroArea__c != undefined)
                {
                    recordToPush.metroareaName = recordToPush.MetroArea__r.Name;
                }
                tempClientsList.push(recordToPush);
                i++;
                recordExists = true;
            }
            if(recordExists == false)
            {
                i++;
            }
            index++;
            this.dataIndex++;
            
        }
        let newRecords = [...this.currentClientRecords, ...tempClientsList];
        this.currentClientRecords = newRecords;
        this.queryOffset = this.queryOffset+this.queryLimit;
        this.recordShown = this.queryOffset;
        if((this.queryOffset) >= this.allClientRecordsCount || (this.queryOffset) == 0)
        {
            this.plusSign = '';
            if(this.queryOffset != 0) {
                this.recordShown = this.allClientRecordsCount;
            }
        }
        else
        {
            this.plusSign = '+';
        }
        if (this.sortedBy != undefined && this.sortedDirection != undefined) {
            this.sortData(this.sortedBy, this.sortedDirection);
        }
        
        this.isLoading = false;
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

            // To refresh table
    refreshTable(event) {
        this.isLoading = true;
        this.queryOffset = 0;
        this.queryLimit = 50;
        this.dataIndex = 0;
        this.allClientRecordsCount = 0;
        this.currentClientRecordsCount = 0;
        this.currentClientRecords = [];
        this.allClientRecords = [];
         var table = this.template.querySelector('lightning-datatable');
        table.enableInfiniteLoading=true;
        return refreshApex(this.connectedCallback());
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

    handleEvent = event => {

        const refreshRecordEvent = event.data.payload;
        this.newbuttonPressed = false;
        unsubscribe(this.subscription, response => {
            console.log('Successfully unsubscribed');
        });
        this.refreshTable();
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

    // Set breadcrumb links
    setLinks() {
        if(this.isCommunityBoolean) {  
            this.recordLink = "/"+this.communityName+"/s/account/" + this.recordId;
            this.maNameLink = "/"+this.communityName + '/s/account/Account/Default';
        } else {
            this.recordLink = '/'+this.recordId;
            this.maNameLink = '/one/one.app#/sObject/Account/list?filterName=Recent';
        }  
    }

      /**
   * For sorting the table
   * @param {*} event 
   */
  updateColumnSorting(event) {
    this.isLoading = true;
    this.sortedBy = event.detail.fieldName;
    this.sortedDirection = event.detail.sortDirection;
    this.sortData(event.detail.fieldName, event.detail.sortDirection);
  }

  /**
   * Helper function to sort the table
   * @param {*} fieldname 
   * @param {*} direction 
   */
  sortData(fieldname, direction) {
    // serialize the data before calling sort function
    let parseData = JSON.parse(JSON.stringify(this.currentClientRecords));
    // Return the value stored in the field
    
    if (fieldname == 'accountLink') {
        fieldname = NAME_FIELD.fieldApiName;
    }
    else if (fieldname == 'metroareaLink') {
        fieldname = 'metroareaName';
    }
    let keyValue = (a) => {
        if(a[fieldname] != undefined && fieldname != AUM_FIELD.fieldApiName){
            return a[fieldname].toLowerCase();
        }
        else{
            return a[fieldname];
        }
    };

    // checking reverse direction 
    let isReverse = direction === 'asc' ? 1 : -1;
    

    // sorting data 
    parseData.sort((x, y) => {
        x = keyValue(x) ? keyValue(x) : ''; // handling null values
        y = keyValue(y) ? keyValue(y) : '';

      // sorting values based on direction
      return isReverse * ((x > y) - (y > x));
    });

    // set the sorted data to data table data
    this.currentClientRecords = parseData;
    this.isLoading = false;
  }
}