import { LightningElement,api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Marketplace_Searches__c.Name';
import STATUS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Search_Status__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Marketplace_Searches__c.Asset_Class__c';
import AMOUNT_FIELD from '@salesforce/schema/Marketplace_Searches__c.Amount__c';

const COLUMNS = [
    { label: 'Search Name', sortable: true, fieldName: "recordId", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, tooltip:  { fieldName: NAME_FIELD.fieldApiName }, target: '_self'}},
    { label: 'Account', sortable: true, fieldName: "AccountId", type: 'url', typeAttributes: {label: { fieldName: 'AccountName' }, tooltip:  { fieldName: 'AccountName' }, target: '_self'}},
    { label: 'Search Status', sortable: true, fieldName: STATUS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Asset Class', fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'Picklist' },
    { label: 'Amount', sortable: true, fieldName: AMOUNT_FIELD.fieldApiName, type: 'currency', cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: '0' }}, 
]


export default class WonSearchesRelatedToInvestmentFirmViewAll extends LightningElement {
  
    @api recordId;
    parentLinkName='account';
    parentApiName='Account';
    parentLabel='Account';
    fieldsToQuery = 'Id, Name, Account__c, Account__r.Name, Search_Status__c, Asset_Class__c, Amount__c';
    objectApiName = 'Marketplace_Searches__c';
    accountLookup = 'Account__c = :recordId OR Consultant__c';
    columns = COLUMNS;    
    sortedBy = 'recordId';
    sortedDirection = 'asc';
    defaultSortDirection = 'asc';
    relatedListTitle = 'Won Searches';
    objectNameInLink = 'marketplace-searches';
    sortFieldsMapping = {
        recordId : 'Name',
        AccountId: 'Account__r.Name',
        Search_Status__c: 'Search_Status__c',   
        Amount__c: 'Amount__c'
    };
}