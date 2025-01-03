import { LightningElement,api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Dakota_Content__c.Name';
import DATE_FIELD from '@salesforce/schema/Dakota_Content__c.Date__c';
import TYPE_FIELD from '@salesforce/schema/Dakota_Content__c.Type__c';
import FEATURED_ON_FIELD from '@salesforce/schema/Dakota_Content__c.Featured_On__c';


const COLUMNS = [
    { label: 'Dakota Content Name', sortable: true, fieldName: 'recordId', type: 'url', typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Date', sortable: true, fieldName: DATE_FIELD.fieldApiName, type: "date", typeAttributes: { day: "numeric", month: "numeric", year: "numeric" }},
    { label: 'Type', sortable: true, fieldName: TYPE_FIELD.fieldApiName, type: 'text'},
    { label: 'Featured On', sortable: true, fieldName: 'Dakota_Live_Call__c', type: 'url', typeAttributes: { label: { fieldName: FEATURED_ON_FIELD.fieldApiName}, target: '_self', tooltip: { fieldName: FEATURED_ON_FIELD.fieldApiName }}},
 ]

export default class DakotaContentRelatedToInvestmentFirmViewAll extends LightningElement {
  
    @api recordId;    
    parentLinkName='account';
    parentApiName='Account';
    parentLabel='Account';
    fieldsToQuery = 'Id, Name, Date__c, toLabel(Type__c),Dakota_Live_Call__c,Featured_On__c';
    objectApiName = 'Dakota_Content__c';
    accountLookup = 'Account_Linked__c';
    columns = COLUMNS;    
    sortedBy = 'Date__c';
    sortedDirection = 'Desc';
    defaultSortDirection = 'Desc';
    relatedListTitle = 'Dakota Content';
    objectNameInLink = 'dakota-content';
    sortFieldsMapping = {
        recordId : 'Name',
        Date__c: 'Date__c',
        Type__c: 'Type__c',
        Dakota_Live_Call__c: 'Dakota_Live_Call__r.name'
    };
}