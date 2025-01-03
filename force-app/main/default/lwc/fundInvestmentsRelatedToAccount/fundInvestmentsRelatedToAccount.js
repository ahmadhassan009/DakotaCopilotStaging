import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getFundInvestmentsRecordCount from '@salesforce/apex/FundInvestmentController.getFundInvestmentsRecordCount';
import getFundInvestmentsRecords from '@salesforce/apex/FundInvestmentController.getFundInvestmentsRecords';
import NAME_FIELD from '@salesforce/schema/Fund_Service_Provider__c.Name';
import SPONSOR_ENTITY_NAME_FIELD from '@salesforce/schema/Investment_Funds__c.Name_of_sponsor_of_entity_listed__c';
import ENTITY_TYPE_FIELD from '@salesforce/schema/Investment_Funds__c.Type_of_Entity__c';
import DOLLAR_VALUE_FIELD from '@salesforce/schema/Investment_Funds__c.Dollar_value_of_interest__c';
import ROW_ORDER_P1_FIELD from '@salesforce/schema/Investment_Funds__c.Row_Order_P1__c';

const COLUMNS = [
    {
        label: "Investment Fund Name",
        sortable: true,
        fieldName: "recordLink",
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
        label: "Investment Manager",
        sortable: true,
        fieldName: SPONSOR_ENTITY_NAME_FIELD.fieldApiName,
        type: "text"
    },
    {
        label: "Vehicle Type",
        sortable: true,
        fieldName: ENTITY_TYPE_FIELD.fieldApiName,
        type: "text"
    },
    {
        label: "Dollar value of interest",
        sortable: true,
        fieldName: DOLLAR_VALUE_FIELD.fieldApiName,
        type: "currency",
        typeAttributes: {
            minimumFractionDigits: '0'
        },
        cellAttributes: { alignment: 'left' }
    }
];

export default class FundInvestmentsRelatedToAccount extends NavigationMixin(LightningElement) {
    @api recordId;
    columns = COLUMNS;
    isLoading = true;
    totalRecords = '0';
    nullOrder = 'LAST';
    sortedBy = ROW_ORDER_P1_FIELD.fieldApiName;
    sortedDirection = 'asc';
    defaultSortDirection = 'asc';
    fundInvestmentsExist = false;
    fundInvestmentRecords;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 10 records of Fund Investments
    */ 
    connectedCallback() {
        this.isLoading = true;
        //To fetch number of Fund Investments records
        getFundInvestmentsRecordCount({
            recordId: this.recordId
        })
        .then((totalCount) => {
            if(totalCount == 0) {
                this.fundInvestmentsExist = false;
            }
            else {
                this.fundInvestmentsExist = true;
            }
            if(totalCount > 10){
                this.totalRecords = '10+';
            } 
            else {
                this.totalRecords = totalCount;
            }

            if(totalCount > 0) {
                //To fetch Fund Investments records
                this.getFundInvestmentsRecords(this.recordId, this.sortedBy, this.sortedDirection);
                this.sortedDirection = 'ASC';
                this.sortedBy = ROW_ORDER_P1_FIELD.fieldApiName;
            }            
        })
        .catch((error) => {
            console.log('Error for count : ', error);
            this.isLoading = false;
        });
    }

    /**
     * To get Fund Investments records linked to the account
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Row Order P1)
     * @param sortedDirection sorting direction
    */ 
    getFundInvestmentsRecords(recordId, sortedBy, sortedDirection) {
        this.isLoading = true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        //Getting Fund Investments records based on the passed Account Id
        getFundInvestmentsRecords({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            nullOrder: this.nullOrder
        })
        .then((fundInvestmentRecords) => {
            if(fundInvestmentRecords) {
                for(var i=0; i<fundInvestmentRecords.length; i++)
                {
                    fundInvestmentRecords[i].recordLink = "/" + this.communityName + '/s/investment-funds/' + fundInvestmentRecords[i].Id;
                }
                this.fundInvestmentRecords = fundInvestmentRecords;
            } else {
                this.fundInvestmentRecords = null;
            }
            this.isLoading = false;
        })
        .catch((error) => {
            console.log('Error in fetching fund investment record : ', error);
            this.isLoading = false;
        });
    }

    /**
     * For sorting the table based on column and sort direction
     * @param {*} event 
    */ 
    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let tempSortBy = this.sortedBy;
        if(this.sortedBy == 'recordLink') {
            tempSortBy = NAME_FIELD.fieldApiName;
        }
        this.getFundInvestmentsRecords(this.recordId, tempSortBy, this.sortedDirection);
    }

    /**
    * For redirecting to Standard View All page
    */
    handleShowFullRelatedList() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Account',
                relationshipApiName: 'Fund_Investment__r',
                actionName: 'view'
            }
        });
    }
}