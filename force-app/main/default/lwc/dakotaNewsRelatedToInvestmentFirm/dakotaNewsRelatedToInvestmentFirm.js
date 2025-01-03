import { LightningElement,api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Dakota_News__c.Name';
import DESCRIPTION_FIELD from '@salesforce/schema/Dakota_News__c.Description__c';
import PUBLISH_DATE_FIELD from '@salesforce/schema/Dakota_News__c.Publish_Date__c';

const COLUMNS = [{
        label: "Fundraising News Name",
        sortable: true,
        fieldName: "recordId",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: NAME_FIELD.fieldApiName
            },
            target: '_self',
            tooltip: {
                fieldName: NAME_FIELD.fieldApiName
            }
        }
    },
    {
        label: "Description",
        fieldName: DESCRIPTION_FIELD.fieldApiName,
        type: 'text'
    },
    {
        label: "Public Plan Minute",
        sortable: true,
        fieldName: "PublicPlanMinuteId",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: 'PublicPlanMinuteName'
            },
            target: '_self',
            tooltip: {
                fieldName: 'PublicPlanMinuteName'
            }
        }
    },
    {
        label: "Publish Date",
        fieldName: PUBLISH_DATE_FIELD.fieldApiName,
        type: 'date',
        typeAttributes: {day: "numeric",month: "numeric", year: "numeric"},
        sortable: true
    }
];


export default class DakotaNewsRelatedToInvestmentFirm extends LightningElement {
  
    @api recordId;
    fieldsToQuery = 'Id, Name,Publish_Date__c,Public_Plan_Minute__c, Public_Plan_Minute__r.Name, Description__c';
    objectApiName = 'Dakota_News__c';
    accountLookup = 'Account__c';
    columns = COLUMNS;    
    sortedBy = 'Publish_Date__c';
    sortedDirection = 'Desc';
    defaultSortDirection = 'Desc';
    relatedListTitle = 'Fundraising News';
    iconName = 'doctype:box_notes';
    objectNameInLink = 'dakota-news';
    sortFieldsMapping = {
        recordId : 'Name',
        Publish_Date__c: 'Publish_Date__c',
        PublicPlanMinuteId: 'Public_Plan_Minute__r.name'
    };
}