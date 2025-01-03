import { LightningElement,api } from 'lwc';

const Columns = [
    
    {
        label: 'Form D Filing Name', 
        sortable: true,
        fieldName: "recordId",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: 'Name'
            },
            tooltip: {
                fieldName: 'Name'
            },
            target: '_self'
        }
    },
    {
        label: 'Filed On', 
        sortable: true,
        fieldName: 'Filed_On__c',
        type: "date",
        typeAttributes: {day: "numeric",month: "numeric", year: "numeric"}   
        
    },
    {
        label: 'Asset Class',
        sortable: true,
        fieldName: 'Asset_Class__c',
        type: 'text'
    },
    {
        label: 'Sub-Asset Class',
        sortable: true,
        fieldName: 'Sub_Asset_Class__c',
        type: 'text'
    },
    {
        label: 'Date of First Sale',
        sortable: true,
        fieldName: 'Date_of_First_Sale__c',
        type: 'date',
        typeAttributes: {day: "numeric",month: "numeric", year: "numeric"}
    },{
        label: 'Total Amount Sold',
        sortable: true,
        fieldName: 'Total_Amount_Sold__c',
        type: 'currency',cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 } 
    }
    
]

export default class FormDFilingsRelatedToInvestmentFirmViewAll extends LightningElement {
  
    @api recordId;    
    parentLinkName='account';
    parentApiName='Account';
    parentLabel='Account';
    fieldsToQuery = 'Id, Filed_On__c, Name, Asset_Class__c, Sub_Asset_Class__c, Date_of_First_Sale__c, Total_Amount_Sold__c';
    objectApiName = 'Form_D_Offering__c';
    accountLookup = 'Marketplace_verified__c=true and Account__c';
    columns = Columns;    
    sortedBy = 'recordId';
    sortedDirection = 'asc';
    defaultSortDirection = 'asc';
    relatedListTitle = 'Form D Filings';
    objectNameInLink = 'form-d-offering';
    sortFieldsMapping = {
        recordId : 'Name',
        Filed_On__c: 'Filed_On__c',
        Asset_Class__c: 'Asset_Class__c',   
        Sub_Asset_Class__c: 'Sub_Asset_Class__c',
        Date_of_First_Sale__c: 'Date_of_First_Sale__c',   
        Total_Amount_Sold__c: 'Total_Amount_Sold__c'
    };
}