import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getPersonsRelatedToFormDCount from '@salesforce/apex/PersonsRelatedToFormDController.getPersonsRelatedToFormDCount';
import getPersonsRelatedToFormDRecords from '@salesforce/apex/PersonsRelatedToFormDController.getPersonsRelatedToFormDRecords';
import Related_Person_Name from '@salesforce/schema/SEC_API_Related_Person__c.Related_Person_Name__c';
import Address from '@salesforce/schema/SEC_API_Related_Person__c.Full_Address__c';
import Relationship from '@salesforce/schema/SEC_API_Related_Person__c.Relationship__c';
import Clarification_of_Response_Related_Person from '@salesforce/schema/SEC_API_Related_Person__c.Clarification_of_Response_Related_Person__c';
import Recipient_Name from '@salesforce/schema/SEC_API_Related_Person__c.Recipient_Name__c';
import Recipient_CRD_Number from '@salesforce/schema/SEC_API_Related_Person__c.Recipient_CRD_Number__c';
import Associated_Broker_Dealer_Name from '@salesforce/schema/SEC_API_Related_Person__c.Associated_Broker_Dealer_Name__c';
import Associated_Broker_Dealer_CRD_Number from '@salesforce/schema/SEC_API_Related_Person__c.Associated_Broker_Dealer_CRD_Number__c';
import States_of_Solicitation from '@salesforce/schema/SEC_API_Related_Person__c.States_of_Solicitation__c';
import Foreign_Non_US from '@salesforce/schema/SEC_API_Related_Person__c.Foreign_Non_US__c';

const COLUMNS = [
    {
        label: "Related Person Name",
        sortable: true,
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: Related_Person_Name.fieldApiName
            },
            target: '_self',
            tooltip: { 
                fieldName: Related_Person_Name.fieldApiName
            }
        }
    }, 
    {
        label: "Related Person Address",
        fieldName: Address.fieldApiName,
        type: "text"
    },
    {
        label: "Relationship",
        sortable: true,
        fieldName: Relationship.fieldApiName,
        type: "text"
    },
    {
        label: "Clarification of Response Related Person",
        fieldName: Clarification_of_Response_Related_Person.fieldApiName,
        type: "text"
    }    
];
const Recipients_COLUMNS = [
    {
        label: "Recipient Name",
        sortable: true,
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: Recipient_Name.fieldApiName
            },
            target: '_self',
            tooltip: { 
                fieldName: Recipient_Name.fieldApiName
            }
        }
    }, 
    {
        label: "Recipient CRD Number",
        sortable: true,
        fieldName: Recipient_CRD_Number.fieldApiName,
        type: "text"
    },
    {
        label: "Associated Broker Dealer Name",
        sortable: true,
        fieldName: Associated_Broker_Dealer_Name.fieldApiName,
        type: "text"
    },
    {
        label: "Associated Broker Dealer CRD Number",
        sortable: true,
        fieldName: Associated_Broker_Dealer_CRD_Number.fieldApiName,
        type: "text"
    },
    {
        label: "Recipient Address",
        fieldName: Address.fieldApiName,
        type: "text"
    },
    {
        label: "States of Solicitation",
        fieldName: States_of_Solicitation.fieldApiName,
        type: "text"
    },
    {
        label: "Foreign/Non-US",
        sortable: true,
        fieldName: Foreign_Non_US.fieldApiName,
        type: 'checkBox'
    }    
];

export default class PersonsRelatedToFormD extends NavigationMixin(LightningElement) {
    @api recordId;
    @api isRecipient;
    title='';
    columns = COLUMNS;
    isLoading = true;
    totalRecords = '0';
    nullOrder = 'LAST';
    sortedBy='recordLink';
    tempSortBy = '';
    sortedDirection = 'asc';
    defaultSortDirection = 'asc';
    dataExists = false;
    data;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        if(this.isRecipient) {
            this.columns = Recipients_COLUMNS;
            this.title='Recipients';
        } else {
            this.isRecipient = false;
            this.columns = COLUMNS;            
            this.title='Related Persons';
        }

        getPersonsRelatedToFormDCount({
            recordId: this.recordId,
            isRecipient: this.isRecipient
        })
        .then((totalCount) => {
            if(totalCount == 0) {
                this.dataExists = false;
            }
            else {
                this.dataExists = true;
            }
            if(totalCount > 10){
                this.totalRecords = '10+';
            } 
            else {
                this.totalRecords = totalCount;
            }

            if(totalCount > 0) {
                this.setFieldSorting();
                this.getPersonsRelatedToFormDRecords(this.recordId,this.isRecipient, this.sortedDirection);
            }            
        })
        .catch((error) => {
            console.log('Error for count : ', error);
            this.isLoading = false;
        });

    }

    getPersonsRelatedToFormDRecords(recordId,isRecipient, sortedDirection) {
        this.isLoading = true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }

        getPersonsRelatedToFormDRecords({
            recordId: recordId,
            isRecipient: isRecipient,
            sortedBy: this.tempSortBy,
            sortOrder: sortedDirection,
            recordLimit: '10',
            offset:'0',
            nullOrder: this.nullOrder
        })
        .then((data) => {
            if(data) {
                for(var i=0; i<data.length; i++)
                {
                    data[i].recordLink = "/" + this.communityName + '/s/sec-api-related-person/' + data[i].Id;
                }
                this.data = data;
            } else {
                this.data = [];
            }
            this.isLoading = false;
        })
        .catch((error) => {
            console.log('Error in fetching Related Person record : ', error);
            this.isLoading = false;
        });
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.setFieldSorting();
        this.getPersonsRelatedToFormDRecords(this.recordId,this.isRecipient, this.sortedDirection);
    }

    setFieldSorting() {
        this.tempSortBy = this.sortedBy;
        if(this.sortedBy == 'recordLink') {
            if(this.isRecipient==true) {
                this.tempSortBy = Recipient_Name.fieldApiName;
            } else{
                this.tempSortBy = Related_Person_Name.fieldApiName;
            }
        }
    }

    handleShowFullRelatedList() {
        var url = '/form-d-related-person?recordId='+this.recordId + '&isRecipient=' + this.isRecipient; 
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }
}