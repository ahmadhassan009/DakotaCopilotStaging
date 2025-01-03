import { LightningElement,api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import FormdHomepageCss from '@salesforce/resourceUrl/FormdHomepageCss';
import getNewInvestmentsCount from '@salesforce/apex/NewObjectHomePageController.getNewInvestmentsCount';
import getNewInvestmentsRecord from '@salesforce/apex/NewObjectHomePageController.getNewInvestmentsRecord';
import getNewAccountCount from '@salesforce/apex/NewObjectHomePageController.getNewAccountCount';
import getNewAccountRecord from '@salesforce/apex/NewObjectHomePageController.getNewAccountRecord';
import getNewFormdCount from '@salesforce/apex/NewObjectHomePageController.getNewFormdCount';
import getNewFormdRecord from '@salesforce/apex/NewObjectHomePageController.getNewFormdRecord';
import getNewContactCount from '@salesforce/apex/NewObjectHomePageController.getNewContactCount';
import getNewContactRecord from '@salesforce/apex/NewObjectHomePageController.getNewContactRecord';
import NAME_FIELD from '@salesforce/schema/Investment__c.Name';
import FUNDING_YEAR_NUMBER_FIELD from '@salesforce/schema/Investment__c.Funding_Year_Number__c';
import FUND_BALANLE_FIELD from '@salesforce/schema/Investment__c.Fund_Balance__c'
import CREATED_DATE_FIELD from '@salesforce/schema/Investment__c.CreatedDate';
import ACCOUNT_FIELD from '@salesforce/schema/Investment__c.Account_Name__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Asset_Class_picklist__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Sub_Asset_Class_Picklist__c';
import TYPE from '@salesforce/schema/Account.Type';
import AUM from '@salesforce/schema/Account.AUM__c';
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import TITLE_FIELD from '@salesforce/schema/Contact.Title';
import TICKER_FIELD from '@salesforce/schema/Investment__c.Ticker__c';
import activeCommunities from '@salesforce/label/c.active_communities';
import TIME_ZONE from '@salesforce/i18n/timeZone';

const INVESTMENTCOLUMNS = [

    { label: 'Investment Strategy',wrapText: true, sortable: true, fieldName: "investmentId", type: 'url', typeAttributes: { label: { fieldName: 'investmentName' }, tooltip: { fieldName: 'investmentName' }, target: '_self' } },
    { label: 'Account Name',wrapText: true, sortable: true, fieldName: ACCOUNT_FIELD.fieldApiName, type: 'richText'},
    {
        label: 'Asset Class',
        wrapText: true,
        sortable: true,
        fieldName: ASSET_CLASS_FIELD.fieldApiName,
        type: 'Picklist'
    },
    {
        label: 'Sub-Asset Class',
        wrapText: true,
        sortable: true,
        fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName,
        type: 'Picklist'
    },
    { label: 'Funding Year', wrapText: true, sortable: true, fieldName: FUNDING_YEAR_NUMBER_FIELD.fieldApiName, type: 'text' },
    { label: 'Fund Balance', wrapText: true, sortable: true, fieldName: FUND_BALANLE_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    { label: 'Created Date', sortable: true, fieldName: CREATED_DATE_FIELD.fieldApiName, type: 'text' }
];
const INVESTMENTFILINGCOLUMNS = [

    { label: 'Investment Strategy',wrapText: true, sortable: true, fieldName: "investmentId", type: 'url', typeAttributes: { label: { fieldName: 'investmentName' }, tooltip: { fieldName: 'investmentName' }, target: '_self' } },
    { label: 'Account Name',wrapText: true, sortable: true, fieldName: ACCOUNT_FIELD.fieldApiName, type: 'richText'},
    {
        label: 'Asset Class',
        wrapText: true,
        sortable: true,
        fieldName: ASSET_CLASS_FIELD.fieldApiName,
        type: 'Picklist'
    },
    {
        label: 'Sub-Asset Class',
        wrapText: true,
        sortable: true,
        fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName,
        type: 'Picklist'
    },
    { label: 'Ticker', wrapText: true, sortable: true, fieldName: TICKER_FIELD.fieldApiName, type: 'text' },
    { label: 'Fund Balance', wrapText: true, sortable: true, fieldName: FUND_BALANLE_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    { label: 'Created Date', sortable: true, fieldName: CREATED_DATE_FIELD.fieldApiName, type: 'text' }
];

const CONTACTCOLUMNS = [
    { label: 'Name', wrapText: true, sortable: true,fieldName: "contactRecordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Title', wrapText: true, sortable: true,fieldName: TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Account Name', wrapText: true, sortable: true, fieldName: "AccountLink", type: 'url', typeAttributes: { label: { fieldName: 'AccountName' }, tooltip: { fieldName: 'AccountName' }, target: '_self' } },
    { label: 'Created Date',sortable: true, sortable: true, fieldName: CREATED_DATE_FIELD.fieldApiName, type: 'text' }
]
const ACCOUNTCOLUMNS = [
    {
        label: 'Account Name', 
        wrapText: true,
        sortable: true,
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: NAME_FIELD.fieldApiName
            },
            tooltip: {
                fieldName: NAME_FIELD.fieldApiName
            },
            target: '_self'
        }
    },
    {
        label: 'AUM',
        wrapText: true,
        sortable: true,
        fieldName: AUM.fieldApiName,
        type: 'currency',
        typeAttributes: {
            minimumFractionDigits: '0'
        }
    },
    {
        label: 'Type',
        wrapText: true,
        sortable: true,
        fieldName: TYPE.fieldApiName,
        type: 'Picklist'
    },
    {
        label: 'Metro Area',
        wrapText: true,
        sortable: true,
        fieldName: 'MetroAreaLink',
        type: 'url',
        typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' }
    },
    { label: 'Created Date', sortable: true, fieldName: CREATED_DATE_FIELD.fieldApiName, type: 'text' }
]

const FORMDOFFERING = [
    
    {
        label: 'Name of Issuer', 
        wrapText: true,
        sortable: true,
        fieldName: "nameofIssuerLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: 'Name_Issuer__c'
            },
            tooltip: {
                fieldName: 'Name_Issuer__c'
            },
            target: '_self'
        }
    },
    {
        label: 'Filed On', 
        wrapText: true,
        sortable: true,
        fieldName: 'Filed_On__c',
        type: "text"       
        
    },
    {
        label: 'Industry Group',
        wrapText: true,
        sortable: true,
        fieldName: 'Industry_Group__c',
        type: 'text'
    },
    {
        label: 'Account Name', 
        wrapText: true,
        sortable: true,
        fieldName: "formdAccRecordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: 'recordName'
            },
            tooltip: {
                fieldName: 'recordName'
            },
            target: '_self'
        }
    },
    {
        label: 'Asset Class',
        wrapText: true,
        sortable: true,
        fieldName: 'Asset_Class__c',
        type: 'text'
    },
    {
        label: 'Sub-Asset Class',
        wrapText: true,
        sortable: true,
        fieldName: 'Sub_Asset_Class__c',
        type: 'text'
    },
    {
        label: 'Date of First Sale',
        wrapText: true,
        sortable: true,
        fieldName: 'Date_of_First_Sale__c',
        type: 'text'  
    },{
        label: 'Total Amount Sold',
        wrapText: true,
        sortable: true,
        fieldName: 'Total_Amount_Sold__c',
        type: 'currency',cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 } 
    }
    
]

export default class NewObjectHomePageList extends LightningElement {

    @api type;
    @api recordTypeName;
    data = [];
    offset = 0;
    limit = 50;
    sortedBy = CREATED_DATE_FIELD.fieldApiName;
    sortedDirection = 'desc';
    defaultSortDirection = 'desc';
    totalInvestmentCount = 0;
    fieldsMapping;
    nullOrder;
    fromLoadMore = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    isLoading = false;   
    timeZone = TIME_ZONE;
    sortOnLoadLimit = 300;
    limitReached = false;

    setFieldMappings() {
        this.fieldsMapping = new Map();
        this.fieldsMapping.set("CreatedDate", 'CreatedDate');
        this.fieldsMapping.set("accountId", 'Account__r.Name');
        this.fieldsMapping.set("investmentId", 'Investment_Strategy__r.Name');
        this.fieldsMapping.set("Funding_Year_Number__c", 'Funding_Year_Number__c');
        this.fieldsMapping.set("Fund_Balance__c", 'Fund_Balance__c');
        this.fieldsMapping.set(ASSET_CLASS_FIELD.fieldApiName, ASSET_CLASS_FIELD.fieldApiName);
        this.fieldsMapping.set(SUB_ASSET_CLASS_FIELD.fieldApiName, SUB_ASSET_CLASS_FIELD.fieldApiName);
        this.fieldsMapping.set(ACCOUNT_FIELD.fieldApiName, ACCOUNT_FIELD.fieldApiName);
        this.fieldsMapping.set(TICKER_FIELD.fieldApiName, TICKER_FIELD.fieldApiName);        

        this.fieldsMapping.set("recordLink", 'Name');
        this.fieldsMapping.set("Type", 'Type');
        this.fieldsMapping.set("AUM__c", 'AUM__c');
        this.fieldsMapping.set("MetroAreaLink", 'MetroArea__r.Name');

        this.fieldsMapping.set("contactRecordLink", 'Name');
        this.fieldsMapping.set("Title", 'Title');
        this.fieldsMapping.set("AccountLink", 'Account_Name__c');
        this.fieldsMapping.set("AccountLink", 'Account_Name__c');

        this.fieldsMapping.set("nameofIssuerLink", 'Name_Issuer__c');
        this.fieldsMapping.set("Filed_On__c", 'Filed_On__c');
        this.fieldsMapping.set("Industry_Group__c", 'Industry_Group__c');
        this.fieldsMapping.set("formdAccRecordLink", 'Account__r.Name');
        this.fieldsMapping.set("Asset_Class__c", 'Asset_Class__c');
        this.fieldsMapping.set("Sub_Asset_Class__c", 'Sub_Asset_Class__c');
        this.fieldsMapping.set("Date_of_First_Sale__c", 'Date_of_First_Sale__c');
        this.fieldsMapping.set("Total_Amount_Sold__c", 'Total_Amount_Sold__c');
        
    }

    setRecordsInInitialState () {
        this.isLoading = true;
        if (this.type == 'investment') {  
            this.setFieldMappings();
            this.columns = this.recordTypeName=='Public_Investment' ? INVESTMENTCOLUMNS : INVESTMENTFILINGCOLUMNS;
            setTimeout(() => {
                
                this.totalInvestmentCount = this.recordTypeName=='Public_Investment' ? 33972: 4911266;           
                this.getInvestmentRecord(this.offset,this.sortedDirection,this.sortedBy,this.limit);
                /*getNewInvestmentsCount({
                    recTypeName:this.recordTypeName
                }).then(InvestmentCount => {
                    if (InvestmentCount)
                    {
                        this.totalInvestmentCount = InvestmentCount;
                    }               
                }).catch(error => {
                    console.log("Error in fetching total count of Investments records : ", error);
                })*/
            }, 0);
        } else if (this.type == 'Form_D_Offering__c') {
            this.setFieldMappings();
            this.columns = FORMDOFFERING;
            this.sortedBy = 'Filed_On__c';
            getNewFormdCount().then(formdcount => {
                if (formdcount)
                {
                    this.totalInvestmentCount = formdcount;
                }
                this.getNewFormdRecord(this.offset,this.sortedDirection,this.sortedBy,this.limit);
            }).catch(error => {
                console.log("Error in fetching total count of FromD records : ", error);
            });
        }
        if (this.type == 'account') {
            this.setFieldMappings();
            this.columns = ACCOUNTCOLUMNS;
            getNewAccountCount().then(accountCount => {
                if (accountCount)
                {
                    this.totalInvestmentCount = accountCount;
                }
                this.getAccountRecord(this.offset,this.sortedDirection,this.sortedBy,this.limit);
            }).catch(error => {
                console.log("Error in fetching total count of Account records : ", error);
            });
        }
        if (this.type == 'contact') {
            this.setFieldMappings();
            this.columns = CONTACTCOLUMNS;
            getNewContactCount().then(contactCount => {
                if (contactCount)
                {
                    this.totalInvestmentCount = contactCount;
                }
                this.getContactRecord(this.offset,this.sortedDirection,this.sortedBy,this.limit);
            }).catch(error => {
                console.log("Error in fetching total count of Contact records : ", error);
            });
        }
    }
    connectedCallback() {
        Promise.all([
            loadStyle(this, FormdHomepageCss)
        ]);
        this.setRecordsInInitialState();
    }

    getContactRecord(offset,sortOrder,sortedBy,limit) {
        if (sortOrder == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }

        getNewContactRecord({
            offSet:offset,
            sortOrder:sortOrder,
            nullOrder:this.nullOrder,
            sortedBy:this.fieldsMapping.get(sortedBy),
            recordLimit:limit,
        }).then( newRecords => {
            if (newRecords) {
                let len = newRecords.length;
                let newRecordList = [];
                for (let i = 0; i < len; i++) {
                    let returnedData = Object.assign({}, newRecords[i]);
                    if(returnedData.Name) {
                        returnedData.contactRecordLink = "/" + this.communityName + '/s/contact/' + returnedData.Id;
                    }
                    if(returnedData.AccountId) {
                        returnedData.AccountLink = "/" + this.communityName + '/s/account/' + returnedData.AccountId;
                        returnedData.AccountName = returnedData.Account_Name__c;
                    }
                    if(returnedData.CreatedDate) {
                        returnedData.CreatedDate = this.updateDateFormate(returnedData.CreatedDate);
                    }
                    newRecordList.push(returnedData);
                }
                this.offset += newRecordList.length;
                this.isLoading = false;
                if(this.fromLoadMore){
                    if (this.data)
                        this.data = this.data.concat(newRecordList);

                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                      }
                }
                else {
                    this.data=[];
                    this.data = newRecordList;
                }
            }

        }).catch(error => {
            console.log('Error in fetching Investment records : ', error);
            this.isLoading = false;
            this.infiniteLoading = false;
        });


    }

    getNewFormdRecord(offset,sortOrder,sortedBy,limit) {
        if (sortOrder == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        getNewFormdRecord({
            offSet:offset,
            sortOrder:sortOrder,
            nullOrder:this.nullOrder,
            sortedBy:this.fieldsMapping.get(sortedBy),
            recordLimit:limit,
        }).then( newRecords => {
            if (newRecords) {
                let len = newRecords.length;
                let newRecordList = [];
                for (let i = 0; i < len; i++) {
                    let returnedData = Object.assign({}, newRecords[i]); 

                    returnedData.nameofIssuerLink = "/" + this.communityName + '/s/form-d-offering/' + returnedData.Id;
                    if(returnedData.Account__c) {
                        returnedData.formdAccRecordLink = "/" + this.communityName + '/s/account/' + returnedData.Account__c;
                        returnedData.recordName =  returnedData.Account__r.Name;
                    }
                    if(returnedData.Filed_On__c) {
                        let dateTime=new Date(returnedData.Filed_On__c);        
                        let options = { hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' };
                        returnedData.Filed_On__c = dateTime.toLocaleString('en', options).replace(',','');
                    }
                    if(returnedData.Date_of_First_Sale__c) {
                        let dateTime=new Date(returnedData.Date_of_First_Sale__c);        
                        let options = { hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' };
                        returnedData.Date_of_First_Sale__c = dateTime.toLocaleString('en', options).replace(',','');
                    }
                    newRecordList.push(returnedData);
                }

                this.offset += newRecordList.length;
                this.isLoading = false;
                if(this.fromLoadMore){
                    if (this.data)
                        this.data = this.data.concat(newRecordList);

                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                      }
                }
                else {
                    this.data=[];
                    this.data = newRecordList;
                }
            }

        }).catch(error => {
            console.log('Error in fetching FormD records : ', error);
            this.isLoading = false;
            this.infiniteLoading = false;
        });
    }

    getAccountRecord(offset,sortOrder,sortedBy,limit) {
        if (sortOrder == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        getNewAccountRecord({
            offSet:offset,
            sortOrder:sortOrder,
            nullOrder:this.nullOrder,
            sortedBy:this.fieldsMapping.get(sortedBy),
            recordLimit:limit,
        }).then( newRecords => {
            if (newRecords) {
                let len = newRecords.length;
                let newRecordList = [];
                for (let i = 0; i < len; i++) {
                    let returnedData = Object.assign({}, newRecords[i]); 
                    if(returnedData.Name) {
                        returnedData.recordLink = "/" + this.communityName + '/s/account/' + returnedData.Id;
                    }
                    if(returnedData.MetroArea__r) {
                        returnedData.MetroAreaLink = "/" + this.communityName + '/s/metro-area/' + returnedData.MetroArea__c;
                        returnedData.MetroAreaName = returnedData.MetroArea__r.Name;
                    }
                    if(returnedData.CreatedDate) {
                        returnedData.CreatedDate = this.updateDateFormate(returnedData.CreatedDate);
                    }
                    newRecordList.push(returnedData);
                }

                this.offset += newRecordList.length;
                this.isLoading = false;
                if(this.fromLoadMore){
                    if (this.data)
                        this.data = this.data.concat(newRecordList);

                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                      }
                }
                else {
                    this.data=[];
                    this.data = newRecordList;
                }
            }

        }).catch(error => {
            console.log('Error in fetching Account records : ', error);
            this.isLoading = false;
            this.infiniteLoading = false;
        });
    }

    getInvestmentRecord(offset,sortOrder,sortedBy,limit) {
        if (sortOrder == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }

        
        
        getNewInvestmentsRecord({
            offSet:offset,
            sortOrder:sortOrder,
            nullOrder:this.nullOrder,
            sortedBy:this.fieldsMapping.get(sortedBy),
            recordLimit:limit,
            recordTypeName : this.recordTypeName
        }).then( newRecords => {
            if (newRecords) {
                let len = newRecords.length;
                let newRecordList = [];
                for (let i = 0; i < len; i++) {
                    let returnedData = Object.assign({}, newRecords[i]); //cloning object
                    if(returnedData.Investment_Strategy__r) {
                        returnedData.investmentId = "/" + this.communityName + '/s/investment-strategy/' + returnedData.Investment_Strategy__c;
                        returnedData.investmentName = returnedData.Investment_Strategy__r.Name;
                    }
                    if(returnedData.CreatedDate) {
                        returnedData.CreatedDate = this.updateDateFormate(returnedData.CreatedDate);
                    }
                    
                    newRecordList.push(returnedData);
                }
                

                this.offset += newRecordList.length;
                this.isLoading = false;
                if(this.fromLoadMore){
                    if (this.data)
                        this.data = this.data.concat(newRecordList);

                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                      }
                }
                else {
                    this.data=[];
                    this.data = newRecordList;
                }
            }

        }).catch(error => {
            console.log('Error in fetching Contact records : ', error);
            this.isLoading = false;
            this.infiniteLoading = false;
        });

    }

    updateDateFormate(dateWithComma)
    {
        let dateTime=new Date(dateWithComma);        
        let options = { hour12: true, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit',timeZone: this.timeZone };
        if(dateWithComma.length==10)
        {
            options = { hour12: true, day: '2-digit', month: '2-digit', year: 'numeric', timeZone: this.timeZone };
        }
        return dateTime.toLocaleString('en', options).replace(',','');
    }

    updateColumnSorting(event) {
        this.isLoading = true;
        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;

        this.sortedBy = sortedBy
        this.sortedDirection = sortDirection;
        
        if(this.offset > this.sortOnLoadLimit)
        {
            this.offset = this.sortOnLoadLimit;
            this.limitReached = true;
        }
        let updatedLimit = this.offset;

        if (this.type == 'investment')
            this.getInvestmentRecord(0,this.sortedDirection,this.sortedBy,updatedLimit);
        if (this.type == 'Form_D_Offering__c')
            this.getNewFormdRecord(0,this.sortedDirection,this.sortedBy,updatedLimit);                         
        if (this.type == 'account')
            this.getAccountRecord(0,this.sortedDirection,this.sortedBy,updatedLimit);        
        if (this.type == 'contact')
            this.getContactRecord(0,this.sortedDirection,this.sortedBy,updatedLimit);
            
            
    }
    loadMoreData(event) {
        
        if(this.limitReached)
        {
            this.limitReached=false;            
        }
        else
        {
            if(this.totalInvestmentCount != this.offset && this.offset>0) {
                //Display a spinner to signal that data is being loaded
                if(this.data != null && event.target){
                    event.target.isLoading = true;
                }
    
                this.tableElement = event.target;
                this.fromLoadMore = true;
                this.offset = this.data.length;
                if (this.type == 'investment')
                    this.getInvestmentRecord(this.offset,this.sortedDirection,this.sortedBy,this.limit);
                if (this.type == 'Form_D_Offering__c')
                    this.getNewFormdRecord(this.offset,this.sortedDirection,this.sortedBy,this.limit);     
                if (this.type == 'account')
                    this.getAccountRecord(this.offset,this.sortedDirection,this.sortedBy,this.limit);
                if (this.type == 'contact')
                    this.getContactRecord(this.offset,this.sortedDirection,this.sortedBy,this.limit);
    
            }
        }
        
    }
}