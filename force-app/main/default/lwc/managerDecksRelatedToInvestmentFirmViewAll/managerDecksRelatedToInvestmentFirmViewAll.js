import { LightningElement,api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Manager_Presentation__c.Name';
import ASSET_FIELD from '@salesforce/schema/Manager_Presentation__c.Asset_Class__c';
import SUB_ASSET_FIELD from '@salesforce/schema/Manager_Presentation__c.Sub_Asset_Class__c';
import MEETING_DATE_FIELD from '@salesforce/schema/Manager_Presentation__c.Meeting_Date__c';
import POSTED_DATE_FIELD from '@salesforce/schema/Manager_Presentation__c.Posted_Date__c';


const columns = [
    { label: "Manager Presentation Name", fieldName: "recordId", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self',tooltip: { fieldName: NAME_FIELD.fieldApiName }}, sortable: "true"},
    { label: 'Account Name', sortable: true, fieldName: "AccountId", type: 'url', typeAttributes: {label: { fieldName: 'AccountName' }, tooltip:  { fieldName: 'AccountName' }, target: '_self'}},
    { label: "Asset Class", fieldName: ASSET_FIELD.fieldApiName, type: "text",  sortable: "true"},
    { label: "Sub-Asset Class", fieldName: SUB_ASSET_FIELD.fieldApiName, type: "text",  sortable: "true"},
    { label: "Meeting Date", fieldName: MEETING_DATE_FIELD.fieldApiName, type: "date", typeAttributes: { day: "numeric", month: "numeric", year: "numeric" },  sortable: "true"},
    { label: "Posted Date", fieldName: POSTED_DATE_FIELD.fieldApiName, type: "date", typeAttributes: { day: "numeric", month: "numeric", year: "numeric" }, sortable: "true"},
];


export default class ManagerDecksRelatedToInvestmentFirmViewAll extends LightningElement {
        
    @api recordId;
    parentLinkName='account';
    parentApiName='Account';
    parentLabel='Account';
    fieldsToQuery = 'Id, Name, Account__c,Account__r.Name, Asset_Class__c, Sub_Asset_Class__c, Meeting_Date__c, Posted_Date__c';
    objectApiName = 'Manager_Presentation__c';
    accountLookup = 'Account__c = :recordId OR Consultant__c = :recordId OR Public_Pension_Fund__c'
    columns = columns;    
    sortedBy = 'Meeting_Date__c';
    sortedDirection = 'Desc';
    defaultSortDirection = 'Desc';
    relatedListTitle = 'Manager Presentations';
    objectNameInLink = 'manager-presentation';
    sortFieldsMapping = {
        recordId : 'Name',
        AccountId: 'Account__r.Name',
        Asset_Class__c: 'Asset_Class__c',
        Sub_Asset_Class__c: 'Sub_Asset_Class__c',
        Posted_Date__c: 'Posted_Date__c',
        Meeting_Date__c: 'Meeting_Date__c'
    };
}