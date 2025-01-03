import { LightningElement,api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Investment__c.Name';
import FUNDING_YEAR_FIELD from '@salesforce/schema/Investment__c.Funding_Year__c';
import FUND_BALANLE_FIELD from '@salesforce/schema/Investment__c.Fund_Balance__c'
import ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Asset_Class_picklist__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Sub_Asset_Class_Picklist__c';
import investmentURL from '@salesforce/label/c.investment_image_url';

const COLUMNS = [
    { label: 'Investment Name', sortable: true, fieldName: 'recordId', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName } } },
    { label: 'Investment Strategy', sortable: true, fieldName: 'InvestmentStrategyId', type: "url", typeAttributes: { label: { fieldName: 'InvestmentStrategyName' }, target: '_self', tooltip: { fieldName: "InvestmentStrategyName" } } },
    { label: 'Fund Balance', sortable: true, fieldName: FUND_BALANLE_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    { label: 'Asset Class', sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Sub-Asset Class', sortable: true, fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Funding Year', sortable: true, fieldName: FUNDING_YEAR_FIELD.fieldApiName, type: 'text' }
]


export default class InvestorsRelatedToInvestmentFirm extends LightningElement {
  
    @api recordId;
    fieldsToQuery = 'Id, Name, Investment_Strategy__c, Investment_Strategy__r.Name, Fund_Balance__c, Asset_Class_picklist__c, Sub_Asset_Class_Picklist__c, Funding_Year__c';
    objectApiName = 'Investment__c';
    accountLookup = 'Account__c';
    columns = COLUMNS;    
    sortedBy = 'recordId';
    sortedDirection = 'asc';
    defaultSortDirection = 'asc';
    relatedListTitle = 'Investments';
    iconName = investmentURL;
    objectNameInLink = 'investment';
    sortFieldsMapping = {
        recordId : 'Name',
        InvestmentStrategyId: 'Investment_Strategy__r.Name',
        Fund_Balance__c: 'Fund_Balance__c',
        Asset_Class_picklist__c: 'Asset_Class_picklist__c',
        Sub_Asset_Class_Picklist__c: 'Sub_Asset_Class_Picklist__c',
        Funding_Year__c: 'Funding_Year__c'
    };
}